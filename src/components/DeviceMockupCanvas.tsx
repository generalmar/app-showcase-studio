import { useState, useRef, useCallback, useEffect } from "react";
import { ScreenshotItem } from "@/lib/imageUtils";
import { dimensionPresets, DimensionPreset } from "@/lib/dimensions";
import { TemplateConfig } from "@/lib/template";
import { renderTemplate } from "@/lib/templateRenderer";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeviceMockupCanvasProps {
  screenshots: ScreenshotItem[];
  selectedPresets: string[];
  template: TemplateConfig;
}

// Scale full-size render to a canvas artboard size
function getDisplaySize(preset: DimensionPreset): { w: number; h: number } {
  const maxDim = 320;
  const ratio = Math.min(maxDim / preset.width, maxDim / preset.height);
  return { w: Math.round(preset.width * ratio), h: Math.round(preset.height * ratio) };
}

export default function DeviceMockupCanvas({
  screenshots,
  selectedPresets,
  template,
}: DeviceMockupCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const presets = dimensionPresets.filter((p) => selectedPresets.includes(p.id));

  // Serialize template + per-screenshot text as a cache key
  const templateKey = JSON.stringify(template);
  const ssKey = JSON.stringify(
    screenshots.map((s) => ({ id: s.id, url: s.originalUrl, h: s.headline, st: s.subtitle }))
  );

  // Regenerate previews when template or screenshots change
  useEffect(() => {
    setPreviews({});
    let cancelled = false;

    (async () => {
      for (const ss of screenshots) {
        for (const preset of presets) {
          if (cancelled) return;
          const key = `${ss.id}-${preset.id}`;
          try {
            const url = await renderTemplate(
              ss.originalUrl,
              template,
              { headline: ss.headline, subtitle: ss.subtitle },
              preset.width,
              preset.height
            );
            if (!cancelled) {
              setPreviews((prev) => ({ ...prev, [key]: url }));
            }
          } catch (e) {
            console.error("preview render error", e);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateKey, ssKey, selectedPresets.join(",")]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(3, Math.max(0.2, z * delta)));
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!screenshots.length || !presets.length) {
    return (
      <div className="flex items-center justify-center p-16 rounded-xl border border-dashed border-border text-muted-foreground text-sm font-mono">
        Upload screenshots & select dimensions to see previews
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-medium text-muted-foreground uppercase tracking-wider">
          Preview Canvas
        </h3>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
          >
            <ZoomIn size={14} />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}
          >
            <ZoomOut size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetView}>
            <Maximize2 size={14} />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-border bg-[hsl(220,14%,4%)] h-[600px] cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Artboards */}
        <div
          className="absolute inset-0 flex flex-wrap items-start justify-center gap-10 p-10"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {screenshots.map((ss) =>
            presets.map((preset) => {
              const display = getDisplaySize(preset);
              const key = `${ss.id}-${preset.id}`;

              return (
                <div key={key} className="flex flex-col items-center gap-3 shrink-0">
                  <div
                    className="relative overflow-hidden rounded-2xl border border-[hsl(220,12%,22%)] shadow-2xl bg-background"
                    style={{ width: display.w, height: display.h }}
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

                  <div className="text-center space-y-0.5">
                    <p className="text-[11px] font-mono font-medium text-foreground truncate max-w-[220px]">
                      {ss.label}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground">
                      {preset.category} · {preset.label} · {preset.width}×{preset.height}
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
