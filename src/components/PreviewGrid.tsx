import { useState, useEffect } from "react";
import { ScreenshotItem, resizeImage } from "@/lib/imageUtils";
import { dimensionPresets, DimensionPreset } from "@/lib/dimensions";

interface PreviewGridProps {
  screenshots: ScreenshotItem[];
  selectedPresets: string[];
}

export default function PreviewGrid({ screenshots, selectedPresets }: PreviewGridProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const presets = dimensionPresets.filter((p) => selectedPresets.includes(p.id));

  useEffect(() => {
    if (!screenshots.length || !presets.length) return;

    // Only generate preview for first screenshot + first preset
    const ss = screenshots[0];
    const preset = presets[0];
    const key = `${ss.id}-${preset.id}`;

    if (previews[key]) return;

    resizeImage(ss.originalUrl, preset.width, preset.height).then((url) => {
      setPreviews((prev) => ({ ...prev, [key]: url }));
    });
  }, [screenshots, selectedPresets]);

  if (!screenshots.length || !presets.length) {
    return (
      <div className="flex items-center justify-center p-12 rounded-xl border border-dashed border-border text-muted-foreground text-sm font-mono">
        Upload screenshots & select dimensions to preview
      </div>
    );
  }

  const ss = screenshots[0];
  const preset = presets[0];
  const key = `${ss.id}-${preset.id}`;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono font-medium text-muted-foreground uppercase tracking-wider">
        Preview · {preset.category} {preset.label}
      </h3>
      <div className="relative rounded-xl border border-border overflow-hidden surface-elevated card-shadow max-w-sm mx-auto">
        {previews[key] ? (
          <img src={previews[key]} alt="Preview" className="w-full" />
        ) : (
          <div className="aspect-[9/16] flex items-center justify-center text-muted-foreground text-xs font-mono">
            Generating preview...
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-background/90 to-transparent">
          <p className="text-xs font-mono text-foreground">
            {preset.width} × {preset.height}px
          </p>
        </div>
      </div>
    </div>
  );
}
