import { useState } from "react";
import { ScreenshotItem } from "@/lib/imageUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles, Loader2 } from "lucide-react";

interface ScreenshotCardProps {
  item: ScreenshotItem;
  onLabelChange: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  onBeautify: (id: string) => void;
  isBeautifying: boolean;
}

export default function ScreenshotCard({
  item,
  onLabelChange,
  onRemove,
  onBeautify,
  isBeautifying,
}: ScreenshotCardProps) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border overflow-hidden surface-elevated card-shadow animate-fade-in">
      <div className="relative aspect-[9/16] bg-background overflow-hidden">
        <img
          src={item.originalUrl}
          alt={item.label}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={() => onBeautify(item.id)}
            disabled={isBeautifying}
            title="Beautify with AI"
          >
            {isBeautifying ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <div className="p-3">
        <Input
          value={item.label}
          onChange={(e) => onLabelChange(item.id, e.target.value)}
          placeholder="Screenshot label..."
          className="text-xs font-mono h-8 bg-background border-border"
        />
      </div>
    </div>
  );
}
