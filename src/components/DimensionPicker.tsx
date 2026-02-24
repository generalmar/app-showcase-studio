import { DimensionPreset, getGroupedPresets, Platform } from "@/lib/dimensions";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface DimensionPickerProps {
  platform: Platform;
  selected: string[];
  onToggle: (id: string) => void;
}

export default function DimensionPicker({ platform, selected, onToggle }: DimensionPickerProps) {
  const groups = getGroupedPresets(platform);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-mono font-medium text-muted-foreground uppercase tracking-wider">
        Target Dimensions
      </h3>
      <div className="space-y-3">
        {Object.entries(groups).map(([category, presets]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{category}</span>
              {presets[0].required && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  Required
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => {
                const isSelected = selected.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    onClick={() => onToggle(preset.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-mono transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    {preset.label} · {preset.width}×{preset.height}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
