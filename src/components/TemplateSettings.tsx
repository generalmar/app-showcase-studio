import { TemplateConfig, BackgroundStyle, BlobIntensity, TextPosition } from "@/lib/template";
import { fontOptions, ensureFontLoaded, getFontFamily } from "@/lib/fonts";
import { Input } from "@/components/ui/input";
import { Palette, Type, Layers, AlignHorizontalJustifyCenter } from "lucide-react";
import { useEffect } from "react";

interface TemplateSettingsProps {
  template: TemplateConfig;
  onChange: (t: TemplateConfig) => void;
}

interface Preset {
  label: string;
  bg: string;
  bg2: string;
  accent: string;
}

const PRESET_COLORS: Preset[] = [
  { label: "Forest",   bg: "#1e3a34", bg2: "#0f2420", accent: "#b8c94a" },
  { label: "Midnight", bg: "#0f172a", bg2: "#1e3a8a", accent: "#3b82f6" },
  { label: "Sunset",   bg: "#7c2d12", bg2: "#c2410c", accent: "#fbbf24" },
  { label: "Violet",   bg: "#4c1d95", bg2: "#831843", accent: "#ec4899" },
  { label: "Teal",     bg: "#134e4a", bg2: "#0f766e", accent: "#f472b6" },
  { label: "Carbon",   bg: "#18181b", bg2: "#27272a", accent: "#22d3ee" },
  { label: "Cream",    bg: "#fef3c7", bg2: "#fde68a", accent: "#dc2626" },
  { label: "Paper",    bg: "#f5f5f4", bg2: "#e7e5e4", accent: "#0891b2" },
  { label: "Ocean",    bg: "#0c4a6e", bg2: "#0369a1", accent: "#38bdf8" },
  { label: "Cherry",   bg: "#881337", bg2: "#be123c", accent: "#fda4af" },
  { label: "Mint",     bg: "#064e3b", bg2: "#047857", accent: "#a7f3d0" },
  { label: "Amber",    bg: "#78350f", bg2: "#b45309", accent: "#fde68a" },
  { label: "Indigo",   bg: "#312e81", bg2: "#4338ca", accent: "#a5b4fc" },
  { label: "Slate",    bg: "#1e293b", bg2: "#334155", accent: "#94a3b8" },
  { label: "Rose",     bg: "#9f1239", bg2: "#e11d48", accent: "#fecdd3" },
  { label: "Sky",      bg: "#e0f2fe", bg2: "#bae6fd", accent: "#0284c7" },
  { label: "Coral",    bg: "#fed7aa", bg2: "#fdba74", accent: "#c2410c" },
  { label: "Noir",     bg: "#000000", bg2: "#1f1f1f", accent: "#fafafa" },
  { label: "Lavender", bg: "#ede9fe", bg2: "#ddd6fe", accent: "#7c3aed" },
  { label: "Emerald",  bg: "#022c22", bg2: "#065f46", accent: "#34d399" },
  { label: "Peach",    bg: "#fff1e6", bg2: "#ffd6a5", accent: "#ef476f" },
  { label: "Berry",    bg: "#3b0764", bg2: "#6b21a8", accent: "#e879f9" },
  { label: "Steel",    bg: "#0f172a", bg2: "#475569", accent: "#f8fafc" },
  { label: "Sunrise",  bg: "#fca5a5", bg2: "#fcd34d", accent: "#7c2d12" },
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

  useEffect(() => {
    fontOptions.forEach((f) => ensureFontLoaded(f.id));
  }, []);

  const applyPreset = (p: Preset) => {
    const light = isLightColor(p.bg);
    update({
      backgroundColor: p.bg,
      backgroundColor2: p.bg2,
      accentColor: p.accent,
      textColor: light ? "#111111" : "#ffffff",
      subtextColor: light ? "#4b5563" : "#d1d5db",
    });
  };

  return (
    <div className="rounded-xl border border-border surface-elevated p-5 space-y-6">
      <div className="flex items-center gap-2">
        <Palette size={16} className="text-primary" />
        <h3 className="text-sm font-mono font-medium text-foreground">Template Settings</h3>
      </div>

      {/* App identity */}
      <section className="space-y-3">
        <SectionLabel>App Identity</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="App Name" hint="Shown at the top of every screenshot">
            <Input
              value={template.appName}
              onChange={(e) => update({ appName: e.target.value })}
              placeholder="YourApp"
              className="text-sm h-9 bg-background border-border"
            />
          </Field>
          <Field label="Tagline" hint="Short marketing line describing your app">
            <Input
              value={template.appDescription}
              onChange={(e) => update({ appDescription: e.target.value })}
              placeholder="A short tagline"
              className="text-sm h-9 bg-background border-border"
            />
          </Field>
        </div>
      </section>

      {/* Color presets */}
      <section className="space-y-3">
        <SectionLabel>Color Palettes ({PRESET_COLORS.length})</SectionLabel>
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {PRESET_COLORS.map((p) => {
            const active = template.backgroundColor.toLowerCase() === p.bg.toLowerCase();
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`group relative aspect-square rounded-lg border-2 transition-all overflow-hidden ${
                  active ? "border-primary scale-105" : "border-border hover:border-muted-foreground"
                }`}
                style={{ background: `linear-gradient(135deg, ${p.bg}, ${p.bg2})` }}
                title={p.label}
              >
                <div
                  className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-tl-lg"
                  style={{ backgroundColor: p.accent }}
                />
                <span className="sr-only">{p.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Background style */}
      <section className="space-y-3">
        <SectionLabel>Background Style</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {(["solid", "gradient", "mesh"] as BackgroundStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => update({ backgroundStyle: style })}
              className={`p-3 rounded-lg border-2 text-xs font-mono capitalize transition-all ${
                template.backgroundStyle === style
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <div
                className="w-full h-8 rounded mb-2"
                style={{
                  background:
                    style === "solid"
                      ? template.backgroundColor
                      : style === "gradient"
                      ? `linear-gradient(${template.gradientAngle}deg, ${template.backgroundColor}, ${template.backgroundColor2})`
                      : `radial-gradient(circle at 20% 20%, ${template.backgroundColor2}, ${template.backgroundColor} 60%)`,
                }}
              />
              {style}
            </button>
          ))}
        </div>

        {template.backgroundStyle === "gradient" && (
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-mono text-muted-foreground flex justify-between">
              <span>Gradient Angle</span>
              <span>{template.gradientAngle}°</span>
            </label>
            <input
              type="range"
              min={0}
              max={360}
              value={template.gradientAngle}
              onChange={(e) => update({ gradientAngle: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        )}
      </section>

      {/* Custom colors */}
      <section className="space-y-3">
        <SectionLabel>Custom Colors</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ColorField label="Background" value={template.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
          <ColorField label="BG Second" value={template.backgroundColor2} onChange={(v) => update({ backgroundColor2: v })} />
          <ColorField label="Accent" value={template.accentColor} onChange={(v) => update({ accentColor: v })} />
          <ColorField label="Text" value={template.textColor} onChange={(v) => update({ textColor: v })} />
          <ColorField label="Subtext" value={template.subtextColor} onChange={(v) => update({ subtextColor: v })} />
        </div>
      </section>

      {/* Layout */}
      <section className="space-y-3">
        <SectionLabel>
          <span className="inline-flex items-center gap-1.5">
            <AlignHorizontalJustifyCenter size={12} /> Layout
          </span>
        </SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Text Position" hint="Where to place the headline">
            <div className="flex gap-2">
              {(["top", "bottom"] as TextPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => update({ textPosition: pos })}
                  className={`flex-1 py-2 rounded-md border-2 text-xs font-mono capitalize ${
                    template.textPosition === pos
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Decorative Blobs" hint="Organic shapes behind the background">
            <div className="flex gap-2">
              {(["none", "subtle", "strong"] as BlobIntensity[]).map((b) => (
                <button
                  key={b}
                  onClick={() => update({ blobIntensity: b })}
                  className={`flex-1 py-2 rounded-md border-2 text-[11px] font-mono capitalize ${
                    template.blobIntensity === b
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Device Frame" hint="Wrap screenshot in a phone frame">
            <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background cursor-pointer">
              <input
                type="checkbox"
                checked={template.showDeviceFrame}
                onChange={(e) => update({ showDeviceFrame: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-xs font-mono text-muted-foreground">
                {template.showDeviceFrame ? "On" : "Off"}
              </span>
            </label>
          </Field>
        </div>
      </section>

      {/* Font selection */}
      <section className="space-y-3">
        <SectionLabel>
          <span className="inline-flex items-center gap-1.5">
            <Type size={12} /> Font Style
          </span>
        </SectionLabel>
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
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Layers size={11} className="text-muted-foreground" />
      <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
        {children}
      </label>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-mono text-foreground/80 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</label>
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
