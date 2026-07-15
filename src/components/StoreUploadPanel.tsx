import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, Apple, Smartphone, ChevronDown, ChevronUp, KeyRound } from "lucide-react";
import { ScreenshotItem, dataUrlToBlob } from "@/lib/imageUtils";
import { dimensionPresets } from "@/lib/dimensions";
import { TemplateConfig } from "@/lib/template";
import { renderTemplate } from "@/lib/templateRenderer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoreUploadPanelProps {
  screenshots: ScreenshotItem[];
  selectedPresets: string[];
  template: TemplateConfig;
}

type StoreTarget = "ios" | "android" | null;

export default function StoreUploadPanel({ screenshots, selectedPresets, template }: StoreUploadPanelProps) {
  const [target, setTarget] = useState<StoreTarget>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // iOS fields
  const [issuerId, setIssuerId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [appId, setAppId] = useState("");
  const [iosVersion, setIosVersion] = useState("");

  // Android fields
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [packageName, setPackageName] = useState("");
  const [editId, setEditId] = useState("");

  const presets = dimensionPresets.filter((p) => selectedPresets.includes(p.id));

  const handleUpload = async () => {
    if (!screenshots.length || !presets.length) {
      toast({ title: "Nothing to upload", description: "Add screenshots first.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Generate all resized images as base64
      const assets: { base64: string; width: number; height: number; label: string; presetId: string }[] = [];

      const targetPresets = presets.filter((p) => p.platform === target);

      for (const ss of screenshots) {
        for (const preset of targetPresets) {
          const rendered = await renderTemplate(
            ss.originalUrl,
            template,
            { headline: ss.headline, subtitle: ss.subtitle },
            preset.width,
            preset.height
          );
          assets.push({
            base64: rendered,
            width: preset.width,
            height: preset.height,
            label: ss.label || "screenshot",
            presetId: preset.id,
          });
        }
      }

      if (!assets.length) {
        toast({ title: "No matching assets", description: `No ${target === "ios" ? "iOS" : "Android"} presets selected.`, variant: "destructive" });
        return;
      }

      const body = target === "ios"
        ? {
            store: "ios",
            issuerId,
            keyId,
            privateKey,
            appId,
            version: iosVersion,
            assets,
          }
        : {
            store: "android",
            serviceAccountJson,
            packageName,
            editId: editId || undefined,
            assets,
          };

      const { data, error } = await supabase.functions.invoke("upload-to-store", { body });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Upload complete!", description: data?.message || `${assets.length} assets uploaded to ${target === "ios" ? "App Store" : "Play Store"}.` });
    } catch (err: any) {
      console.error("Store upload error:", err);
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload to store.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const iosPresetCount = presets.filter((p) => p.platform === "ios").length;
  const androidPresetCount = presets.filter((p) => p.platform === "android").length;

  return (
    <div className="rounded-xl border border-border surface-elevated overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <Upload size={18} className="text-primary" />
        <div className="flex-1">
          <p className="text-sm font-mono font-medium text-foreground">Upload to Store</p>
          <p className="text-xs text-muted-foreground">Push screenshots directly to App Store Connect or Google Play Console</p>
        </div>
      </div>

      {/* Store selector */}
      <div className="px-4 pb-3 flex gap-2">
        <Button
          variant={target === "ios" ? "default" : "outline"}
          size="sm"
          className="gap-2 font-mono text-xs"
          onClick={() => setTarget(target === "ios" ? null : "ios")}
          disabled={iosPresetCount === 0}
        >
          <Apple size={14} />
          App Store Connect
          {target === "ios" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </Button>
        <Button
          variant={target === "android" ? "default" : "outline"}
          size="sm"
          className="gap-2 font-mono text-xs"
          onClick={() => setTarget(target === "android" ? null : "android")}
          disabled={androidPresetCount === 0}
        >
          <Smartphone size={14} />
          Google Play Console
          {target === "android" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </Button>
      </div>

      {/* iOS config */}
      {target === "ios" && (
        <div className="border-t border-border p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-2">
            <KeyRound size={12} />
            App Store Connect API credentials
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-muted-foreground">Issuer ID</label>
              <Input value={issuerId} onChange={(e) => setIssuerId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="text-xs h-8 font-mono bg-background" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-muted-foreground">Key ID</label>
              <Input value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="XXXXXXXXXX" className="text-xs h-8 font-mono bg-background" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-muted-foreground">App ID</label>
              <Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="1234567890" className="text-xs h-8 font-mono bg-background" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-muted-foreground">Version (e.g. 1.0.0)</label>
              <Input value={iosVersion} onChange={(e) => setIosVersion(e.target.value)} placeholder="1.0.0" className="text-xs h-8 font-mono bg-background" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted-foreground">Private Key (.p8 contents)</label>
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              className="w-full text-xs font-mono bg-background border border-border rounded-md p-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading || !issuerId || !keyId || !privateKey || !appId || !iosVersion || !screenshots.length}
            className="w-full gap-2 font-mono"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading to App Store..." : `Upload ${screenshots.length * iosPresetCount} screenshots`}
          </Button>
        </div>
      )}

      {/* Android config */}
      {target === "android" && (
        <div className="border-t border-border p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-2">
            <KeyRound size={12} />
            Google Play Developer API credentials
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-mono text-muted-foreground">Package Name</label>
              <Input value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="com.example.app" className="text-xs h-8 font-mono bg-background" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-mono text-muted-foreground">Edit ID (leave blank to create new)</label>
              <Input value={editId} onChange={(e) => setEditId(e.target.value)} placeholder="Optional" className="text-xs h-8 font-mono bg-background" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted-foreground">Service Account JSON</label>
            <textarea
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
              placeholder='{"type": "service_account", ...}'
              className="w-full text-xs font-mono bg-background border border-border rounded-md p-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading || !serviceAccountJson || !packageName || !screenshots.length}
            className="w-full gap-2 font-mono"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading to Play Store..." : `Upload ${screenshots.length * androidPresetCount} screenshots`}
          </Button>
        </div>
      )}
    </div>
  );
}
