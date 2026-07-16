import { useState, useCallback } from "react";
import { Platform, getPresetsByPlatform } from "@/lib/dimensions";
import { ScreenshotItem, imageToBase64 } from "@/lib/imageUtils";
import { TemplateConfig, defaultTemplate } from "@/lib/template";
import PlatformTabs from "@/components/PlatformTabs";
import DimensionPicker from "@/components/DimensionPicker";
import ScreenshotUploader from "@/components/ScreenshotUploader";
import ScreenshotCard from "@/components/ScreenshotCard";
import ExportPanel from "@/components/ExportPanel";
import DeviceMockupCanvas from "@/components/DeviceMockupCanvas";
import StoreUploadPanel from "@/components/StoreUploadPanel";
import TemplateSettings from "@/components/TemplateSettings";
import { AppSidebar, DashboardSection } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [platform, setPlatform] = useState<Platform>("ios");
  const [selectedPresets, setSelectedPresets] = useState<string[]>(() =>
    getPresetsByPlatform("ios").filter((p) => p.required).map((p) => p.id)
  );
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [beautifyingIds, setBeautifyingIds] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState<TemplateConfig>(defaultTemplate);
  const [section, setSection] = useState<DashboardSection>("brand");
  const { toast } = useToast();

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setSelectedPresets(getPresetsByPlatform(p).filter((pr) => pr.required).map((pr) => pr.id));
  };

  const togglePreset = (id: string) =>
    setSelectedPresets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const handleUpload = useCallback((items: ScreenshotItem[]) => {
    setScreenshots((prev) => [...prev, ...items]);
  }, []);

  const handleLabelChange = (id: string, label: string) =>
    setScreenshots((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  const handleHeadlineChange = (id: string, headline: string) =>
    setScreenshots((prev) => prev.map((s) => (s.id === id ? { ...s, headline } : s)));
  const handleSubtitleChange = (id: string, subtitle: string) =>
    setScreenshots((prev) => prev.map((s) => (s.id === id ? { ...s, subtitle } : s)));
  const handleRemove = (id: string) =>
    setScreenshots((prev) => prev.filter((s) => s.id !== id));

  const handleBeautify = async (id: string) => {
    const ss = screenshots.find((s) => s.id === id);
    if (!ss) return;

    setBeautifyingIds((prev) => new Set(prev).add(id));
    try {
      const base64 = await imageToBase64(ss.originalUrl);
      const { data, error } = await supabase.functions.invoke("beautify-screenshot", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.imageBase64) {
        setScreenshots((prev) =>
          prev.map((s) => (s.id === id ? { ...s, originalUrl: data.imageBase64 } : s))
        );
        toast({ title: "Screenshot beautified!", description: "AI background applied." });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Beautify failed",
        description: err?.message || "Could not beautify screenshot.",
        variant: "destructive",
      });
    } finally {
      setBeautifyingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const sectionMeta: Record<DashboardSection, { title: string; subtitle: string }> = {
    brand: { title: "Brand & Template", subtitle: "Set colors, fonts, and copy for your marketing screenshots" },
    screenshots: { title: "Screenshots", subtitle: "Upload, label, and beautify your source screens" },
    preview: { title: "Preview & Export", subtitle: "Pick dimensions, preview every variant, then export a ZIP" },
    publish: { title: "Publish to Stores", subtitle: "Push directly to App Store Connect or Google Play" },
  };

  const renderSection = () => {
    switch (section) {
      case "brand":
        return <TemplateSettings template={template} onChange={setTemplate} />;
      case "screenshots":
        return (
          <div className="space-y-6">
            <ScreenshotUploader onUpload={handleUpload} />
            {screenshots.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-mono font-medium text-muted-foreground uppercase tracking-wider">
                  Screenshots ({screenshots.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {screenshots.map((ss) => (
                    <ScreenshotCard
                      key={ss.id}
                      item={ss}
                      onLabelChange={handleLabelChange}
                      onHeadlineChange={handleHeadlineChange}
                      onSubtitleChange={handleSubtitleChange}
                      onRemove={handleRemove}
                      onBeautify={handleBeautify}
                      isBeautifying={beautifyingIds.has(ss.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "preview":
        return (
          <div className="space-y-6">
            {/* Dimensions picker */}
            <div className="rounded-xl border border-border surface-elevated p-5 space-y-4">
              <div>
                <h3 className="text-sm font-mono font-medium text-foreground">
                  1. Choose device sizes
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select the store dimensions you want to generate.
                </p>
              </div>
              <PlatformTabs active={platform} onChange={handlePlatformChange} />
              <DimensionPicker
                platform={platform}
                selected={selectedPresets}
                onToggle={togglePreset}
              />
            </div>

            {/* Preview canvas */}
            <div className="rounded-xl border border-border surface-elevated p-5 space-y-4">
              <div>
                <h3 className="text-sm font-mono font-medium text-foreground">
                  2. Preview every variant
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scroll, zoom, and pan through the generated screenshots.
                </p>
              </div>
              <DeviceMockupCanvas
                screenshots={screenshots}
                selectedPresets={selectedPresets}
                template={template}
              />
            </div>

            {/* Export */}
            <div className="rounded-xl border border-border surface-elevated p-5 space-y-4">
              <div>
                <h3 className="text-sm font-mono font-medium text-foreground">
                  3. Export ZIP
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download a ZIP with every screenshot rendered at every selected size.
                </p>
              </div>
              <ExportPanel
                screenshots={screenshots}
                selectedPresets={selectedPresets}
                template={template}
              />
            </div>
          </div>
        );
      case "publish":
        return (
          <StoreUploadPanel
            screenshots={screenshots}
            selectedPresets={selectedPresets}
            template={template}
          />
        );
    }
  };

  const meta = sectionMeta[section];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar active={section} onSelect={setSection} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 md:px-6 sticky top-0 z-10 bg-background/95 backdrop-blur">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="min-w-0">
                <h2 className="text-sm font-mono font-semibold text-foreground truncate">
                  {meta.title}
                </h2>
                <p className="text-[11px] text-muted-foreground truncate">{meta.subtitle}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Zap size={12} className="text-accent" />
              AI-powered beautification
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">{renderSection()}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
