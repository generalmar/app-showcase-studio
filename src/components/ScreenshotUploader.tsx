import { useCallback, useRef } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { generateId, type ScreenshotItem } from "@/lib/imageUtils";

interface ScreenshotUploaderProps {
  onUpload: (items: ScreenshotItem[]) => void;
}

export default function ScreenshotUploader({ onUpload }: ScreenshotUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const items: ScreenshotItem[] = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => {
          const label = file.name.replace(/\.[^.]+$/, "");
          return {
            id: generateId(),
            file,
            originalUrl: URL.createObjectURL(file),
            label,
            headline: label.replace(/[-_]/g, " "),
            subtitle: "A short description of this screen",
            resizedUrls: {},
          };
        });
      if (items.length) onUpload(items);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="group relative flex flex-col items-center justify-center gap-4 p-10 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer surface-elevated"
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
        <ImagePlus size={28} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Drop screenshots here or click to upload
        </p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP supported</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
