import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import { ScreenshotItem, dataUrlToBlob } from "@/lib/imageUtils";
import { dimensionPresets } from "@/lib/dimensions";
import { TemplateConfig } from "@/lib/template";
import { renderTemplate } from "@/lib/templateRenderer";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";

interface ExportPanelProps {
  screenshots: ScreenshotItem[];
  selectedPresets: string[];
  template: TemplateConfig;
}

export default function ExportPanel({ screenshots, selectedPresets, template }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const presets = dimensionPresets.filter((p) => selectedPresets.includes(p.id));

  const handleExport = async () => {
    if (!screenshots.length || !presets.length) {
      toast({
        title: "Nothing to export",
        description: "Add screenshots and select dimensions first.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      const zip = new JSZip();

      for (const ss of screenshots) {
        for (const preset of presets) {
          const rendered = await renderTemplate(
            ss.originalUrl,
            template,
            { headline: ss.headline, subtitle: ss.subtitle },
            preset.width,
            preset.height
          );
          const blob = dataUrlToBlob(rendered);
          const folder = `${preset.platform}/${preset.category}/${preset.label}`;
          const filename = `${ss.label || "screenshot"}_${preset.width}x${preset.height}.png`;
          zip.file(`${folder}/${filename}`, blob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${template.appName || "app"}-store-screenshots.zip`);
      toast({
        title: "Export complete!",
        description: `${screenshots.length * presets.length} images exported.`,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Export failed", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border surface-elevated">
      <div className="flex-1">
        <p className="text-sm font-mono font-medium text-foreground">Ready to export</p>
        <p className="text-xs text-muted-foreground">
          {screenshots.length} screenshot{screenshots.length !== 1 ? "s" : ""} × {presets.length} dimension
          {presets.length !== 1 ? "s" : ""} ={" "}
          <span className="text-primary font-medium">
            {screenshots.length * presets.length} images
          </span>
        </p>
      </div>
      <Button
        onClick={handleExport}
        disabled={exporting || !screenshots.length || !presets.length}
        className="gap-2 font-mono"
      >
        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
        {exporting ? "Rendering..." : "Export ZIP"}
      </Button>
    </div>
  );
}
