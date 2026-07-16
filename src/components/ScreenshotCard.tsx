import { ScreenshotItem } from "@/lib/imageUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles, Loader2, Tag, Type, Text } from "lucide-react";

interface ScreenshotCardProps {
  item: ScreenshotItem;
  onLabelChange: (id: string, label: string) => void;
  onHeadlineChange: (id: string, headline: string) => void;
  onSubtitleChange: (id: string, subtitle: string) => void;
  onRemove: (id: string) => void;
  onBeautify: (id: string) => void;
  isBeautifying: boolean;
}

export default function ScreenshotCard({
  item,
  onLabelChange,
  onHeadlineChange,
  onSubtitleChange,
  onRemove,
  onBeautify,
  isBeautifying,
}: ScreenshotCardProps) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border overflow-hidden surface-elevated card-shadow animate-fade-in">
      {/* Image preview */}
      <div className="relative aspect-[9/16] bg-background overflow-hidden border-b border-border">
        <img
          src={item.originalUrl}
          alt={item.label}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 shadow-lg"
            onClick={() => onBeautify(item.id)}
            disabled={isBeautifying}
            title="Beautify background with AI"
          >
            {isBeautifying ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 shadow-lg"
            onClick={() => onRemove(item.id)}
            title="Remove screenshot"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Editable fields with clear labels */}
      <div className="p-3 space-y-3">
        <FieldRow
          icon={<Tag size={11} />}
          label="Label"
          hint="Used as the file name in the export"
        >
          <Input
            value={item.label}
            onChange={(e) => onLabelChange(item.id, e.target.value)}
            placeholder="e.g. onboarding-1"
            className="text-xs font-mono h-8 bg-background border-border"
          />
        </FieldRow>

        <FieldRow
          icon={<Type size={11} />}
          label="Headline"
          hint="Big bold text on the screenshot"
        >
          <Input
            value={item.headline}
            onChange={(e) => onHeadlineChange(item.id, e.target.value)}
            placeholder="e.g. Track habits in seconds"
            className="text-sm font-semibold h-9 bg-background border-border"
          />
        </FieldRow>

        <FieldRow
          icon={<Text size={11} />}
          label="Subtitle"
          hint="Smaller supporting line under the headline"
        >
          <Input
            value={item.subtitle}
            onChange={(e) => onSubtitleChange(item.id, e.target.value)}
            placeholder="e.g. Beautiful streaks and reminders"
            className="text-xs h-8 bg-background border-border"
          />
        </FieldRow>
      </div>
    </div>
  );
}

function FieldRow({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      {children}
      <p className="text-[10px] text-muted-foreground/70 leading-tight">{hint}</p>
    </div>
  );
}
