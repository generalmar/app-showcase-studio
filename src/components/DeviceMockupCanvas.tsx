import { useState, useRef, useCallback, useEffect } from "react";
import { ScreenshotItem, resizeImage } from "@/lib/imageUtils";
import { dimensionPresets, DimensionPreset } from "@/lib/dimensions";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeviceMockupCanvasProps {
  screenshots: ScreenshotItem[];
  selectedPresets: string[];
}

interface DeviceFrame {
  preset: DimensionPreset;
  borderRadius: number;
  bezelTop: number;
  bezelSide: number;
  bezelBottom: number;
  notch: boolean;
  homeButton: boolean;
  label: string;
}

function getDeviceFrame(preset: DimensionPreset): DeviceFrame {
  const base = {
    preset,
    borderRadius: 16,
    bezelTop: 24,
    bezelSide: 8,
    bezelBottom: 24,
    notch: false,
    homeButton: false,
    label: `${preset.category} · ${preset.label}`,
  };

  if (preset.id.includes("iphone")) {
    return { ...base, borderRadius: 22, bezelTop: 32, bezelBottom: 32, notch: true };
  }
  if (preset.id.includes("ipad")) {
    return { ...base, borderRadius: 18, bezelTop: 28, bezelSide: 12, bezelBottom: 28, homeButton: true };
  }
  if (preset.id.includes("watch")) {
    return { ...base, borderRadius: 40, bezelTop: 12, bezelSide: 6, bezelBottom: 12 };
  }
  if (preset.id.includes("phone")) {
    return { ...base, borderRadius: 18, bezelTop: 28, bezelBottom: 28 };
  }
  if (preset.id.includes("tablet")) {
    return { ...base, borderRadius: 14, bezelTop: 20, bezelSide: 10, bezelBottom: 20 };
  }
  return base;
}

// Scale real px dimensions to a reasonable artboard size
function getDisplaySize(preset: DimensionPreset): { w: number; h: number } {
  const maxDim = 280;
  const ratio = Math.min(maxDim / preset.width, maxDim / preset.height);
  return { w: Math.round(preset.width * ratio), h: Math.round(preset.height * ratio) };
}

export default function DeviceMockupCanvas({ screenshots, selectedPresets }: DeviceMockupCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const presets = dimensionPresets.filter((p) => selectedPresets.includes(p.id));

  // Generate preview images
  useEffect(() => {
    if (!screenshots.length || !presets.length) return;

    for (const ss of screenshots) {
      for (const preset of presets) {
        const key = `${ss.id}-${preset.id}`;
        if (previews[key]) continue;
        resizeImage(ss.originalUrl, preset.width, preset.height).then((url) => {
          setPreviews((prev) => ({ ...prev, [key]: url }));
        });
      }
    }
  }, [screenshots, selectedPresets]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(3, Math.max(0.2, z * delta)));
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  if (!screenshots.length || !presets.length) {
    return (
      <div className="flex items-center justify-center p-16 rounded-xl border border-dashed border-border text-muted-foreground text-sm font-mono">
        Upload screenshots & select dimensions to see device previews
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-medium text-muted-foreground uppercase tracking-wider">
          Device Preview Canvas
        </h3>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z * 1.2))}>
            <ZoomIn size={14} />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}>
            <ZoomOut size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetView}>
            <Maximize2 size={14} />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-border bg-[hsl(220,14%,4%)] h-[500px] cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        {/* Artboards container */}
        <div
          className="absolute inset-0 flex flex-wrap items-start justify-center gap-10 p-10"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {screenshots.map((ss) =>
            presets.map((preset) => {
              const frame = getDeviceFrame(preset);
              const display = getDisplaySize(preset);
              const key = `${ss.id}-${preset.id}`;

              return (
                <div key={key} className="flex flex-col items-center gap-3 shrink-0">
                  {/* Device frame */}
                  <div
                    className="relative bg-[hsl(220,12%,12%)] border border-[hsl(220,12%,22%)] shadow-2xl"
                    style={{
                      borderRadius: frame.borderRadius,
                      padding: `${frame.bezelTop}px ${frame.bezelSide}px ${frame.bezelBottom}px`,
                    }}
                  >
                    {/* Notch */}
                    {frame.notch && (
                      <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[40%] h-[18px] bg-[hsl(220,14%,6%)] rounded-b-xl z-10" />
                    )}

                    {/* Screen */}
                    <div
                      className="relative overflow-hidden bg-background"
                      style={{
                        width: display.w,
                        height: display.h,
                        borderRadius: Math.max(0, frame.borderRadius - 6),
                      }}
                    >
                      {previews[key] ? (
                        <img
                          src={previews[key]}
                          alt={`${ss.label} - ${preset.category}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] font-mono animate-pulse">
                          Rendering...
                        </div>
                      )}
                    </div>

                    {/* Home button */}
                    {frame.homeButton && (
                      <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[28px] h-[28px] rounded-full border border-[hsl(220,12%,22%)] bg-[hsl(220,14%,8%)]" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center space-y-0.5">
                    <p className="text-[11px] font-mono font-medium text-foreground truncate max-w-[180px]">
                      {ss.label}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground">
                      {frame.label} · {preset.width}×{preset.height}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
