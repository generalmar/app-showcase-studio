import { useState, useCallback } from "react";
import { Platform, getPresetsByPlatform } from "@/lib/dimensions";
import { ScreenshotItem, imageToBase64 } from "@/lib/imageUtils";
import PlatformTabs from "@/components/PlatformTabs";
import DimensionPicker from "@/components/DimensionPicker";
import ScreenshotUploader from "@/components/ScreenshotUploader";
import ScreenshotCard from "@/components/ScreenshotCard";
import ExportPanel from "@/components/ExportPanel";
import DeviceMockupCanvas from "@/components/DeviceMockupCanvas";
import StoreUploadPanel from "@/components/StoreUploadPanel";
import { useToast } from "@/hooks/use-toast";
import { Layers, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [platform, setPlatform] = useState<Platform>("ios");
  const [selectedPresets, setSelectedPresets] = useState<string[]>(() =>
    getPresetsByPlatform("ios").filter((p) => p.required).map((p) => p.id)
  );
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [beautifyingIds, setBeautifyingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setSelectedPresets(getPresetsByPlatform(p).filter((pr) => pr.required).map((pr) => pr.id));
  };

  const togglePreset = (id: string) => {
    setSelectedPresets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleUpload = useCallback((items: ScreenshotItem[]) => {
    setScreenshots((prev) => [...prev, ...items]);
  }, []);

  const handleLabelChange = (id: string, label: string) => {
    setScreenshots((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  };

  const handleRemove = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

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
        const newUrl = data.imageBase64;
        setScreenshots((prev) =>
          prev.map((s) => (s.id === id ? { ...s, originalUrl: newUrl } : s))
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
              <Layers size={20} />
            </div>
            <div>
              <h1 className="text-lg font-mono font-bold tracking-tight gradient-text">
                StoreReady
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                App Store & Play Store asset generator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Zap size={12} className="text-accent" />
            AI-powered beautification
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Platform + Dimensions */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="space-y-6 flex-1">
            <PlatformTabs active={platform} onChange={handlePlatformChange} />
            <DimensionPicker
              platform={platform}
              selected={selectedPresets}
              onToggle={togglePreset}
            />
          </div>
        </div>

        {/* Device Mockup Canvas */}
        <DeviceMockupCanvas screenshots={screenshots} selectedPresets={selectedPresets} />

        {/* Upload */}
        <ScreenshotUploader onUpload={handleUpload} />

        {/* Screenshot Gallery */}
        {screenshots.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Screenshots ({screenshots.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {screenshots.map((ss) => (
                <ScreenshotCard
                  key={ss.id}
                  item={ss}
                  onLabelChange={handleLabelChange}
                  onRemove={handleRemove}
                  onBeautify={handleBeautify}
                  isBeautifying={beautifyingIds.has(ss.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <ExportPanel screenshots={screenshots} selectedPresets={selectedPresets} />

        {/* Store Upload */}
        <StoreUploadPanel screenshots={screenshots} selectedPresets={selectedPresets} />
      </main>
    </div>
  );
}
