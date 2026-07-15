import { TemplateConfig } from "@/lib/template";
import { fontOptions, ensureFontLoaded, getFontFamily } from "@/lib/fonts";
import { Input } from "@/components/ui/input";
import { Palette, Type } from "lucide-react";
import { useEffect } from "react";

interface TemplateSettingsProps {
  template: TemplateConfig;
  onChange: (t: TemplateConfig) => void;
}

const PRESET_COLORS = [
  { bg: "#1e3a34", accent: "#b8c94a", label: "Forest" },
  { bg: "#0f172a", accent: "#3b82f6", label: "Midnight" },
  { bg: "#7c2d12", accent: "#fbbf24", label: "Sunset" },
  { bg: "#4c1d95", accent: "#ec4899", label: "Violet" },
  { bg: "#134e4a", accent: "#f472b6", label: "Teal" },
  { bg: "#18181b", accent: "#22d3ee", label: "Carbon" },
  { bg: "#fef3c7", accent: "#dc2626", label: "Cream" },
  { bg: "#f5f5f4", accent: "#0891b2", label: "Paper" },
];

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function TemplateSettings({ template, onChange }: TemplateSettingsProps) {
  const update = (patch: Partial<TemplateConfig>) => onChange({ ...template, ...patch });

  // Preload all font options for preview swatches
  useEffect(() => {
    fontOptions.forEach((f) => ensureFontLoaded(f.id));
  }, []);

  const applyPreset = (bg: string, accent: string) => {
    const light = isLightColor(bg);
    update({
      backgroundColor: bg,
      accentColor: accent,
      textColor: light ? "#111111" : "#ffffff",
      subtextColor: light ? "#4b5563" : "#d1d5db",
    });
  };

  return (
    <div className="rounded-xl border border-border surface-elevated p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Palette size={16} className="text-primary" />
        <h3 className="text-sm font-mono font-medium text-foreground">Template Settings</h3>
      </div>

      {/* App identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            App Name
          </label>
          <Input
            value={template.appName}
            onChange={(e) => update({ appName: e.target.value })}
            placeholder="YourApp"
            className="text-sm h-9 bg-background border-border"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            App Description
          </label>
          <Input
            value={template.appDescription}
            onChange={(e) => update({ appDescription: e.target.value })}
            placeholder="A short tagline"
            className="text-sm h-9 bg-background border-border"
          />
        </div>
      </div>

      {/* Color presets */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          Color Presets
        </label>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {PRESET_COLORS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.bg, p.accent)}
              className={`group relative aspect-square rounded-lg border-2 transition-all overflow-hidden ${
                template.backgroundColor.toLowerCase() === p.bg.toLowerCase()
                  ? "border-primary"
                  : "border-border hover:border-muted-foreground"
              }`}
              style={{ backgroundColor: p.bg }}
              title={p.label}
            >
              <div
                className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-tl-lg"
                style={{ backgroundColor: p.accent }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ColorField label="Background" value={template.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
        <ColorField label="Accent" value={template.accentColor} onChange={(v) => update({ accentColor: v })} />
        <ColorField label="Text" value={template.textColor} onChange={(v) => update({ textColor: v })} />
        <ColorField label="Subtext" value={template.subtextColor} onChange={(v) => update({ subtextColor: v })} />
      </div>

      {/* Font selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Type size={14} className="text-muted-foreground" />
          <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Font Style
          </label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {fontOptions.map((f) => {
            const active = template.fontId === f.id;
            return (
              <button
                key={f.id}
                onClick={() => update({ fontId: f.id })}
                className={`flex flex-col items-start gap-0.5 rounded-lg border-2 p-3 text-left transition-all ${
                  active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground bg-background"
                }`}
                style={{ fontFamily: getFontFamily(f.id) }}
              >
                <span className="text-base font-semibold text-foreground leading-tight">
                  {f.label}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {f.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Device frame toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={template.showDeviceFrame}
          onChange={(e) => update({ showDeviceFrame: e.target.checked })}
          className="rounded border-border"
        />
        <span className="text-xs font-mono text-muted-foreground">Show device frame around screenshots</span>
      </label>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none w-full min-w-0"
        />
      </div>
    </div>
  );
}
