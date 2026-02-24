import { Platform } from "@/lib/dimensions";
import { Smartphone, Apple } from "lucide-react";

interface PlatformTabsProps {
  active: Platform;
  onChange: (p: Platform) => void;
}

export default function PlatformTabs({ active, onChange }: PlatformTabsProps) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-secondary">
      <button
        onClick={() => onChange("ios")}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-mono font-medium transition-all ${
          active === "ios"
            ? "bg-primary text-primary-foreground shadow-lg"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Apple size={16} />
        iOS / iPadOS
      </button>
      <button
        onClick={() => onChange("android")}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-mono font-medium transition-all ${
          active === "android"
            ? "bg-primary text-primary-foreground shadow-lg"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Smartphone size={16} />
        Android
      </button>
    </div>
  );
}
