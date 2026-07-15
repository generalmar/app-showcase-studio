export interface FontOption {
  id: string;
  label: string;
  family: string;
  googleName: string; // for Google Fonts URL
  weights: string; // ital,wght spec
  category: "sans" | "serif" | "mono" | "display";
}

export const fontOptions: FontOption[] = [
  { id: "inter", label: "Inter", family: "Inter", googleName: "Inter", weights: "wght@300;400;500;600;700;800", category: "sans" },
  { id: "poppins", label: "Poppins", family: "Poppins", googleName: "Poppins", weights: "wght@300;400;500;600;700;800", category: "sans" },
  { id: "space-grotesk", label: "Space Grotesk", family: "Space Grotesk", googleName: "Space+Grotesk", weights: "wght@300;400;500;600;700", category: "sans" },
  { id: "dm-sans", label: "DM Sans", family: "DM Sans", googleName: "DM+Sans", weights: "wght@400;500;700", category: "sans" },
  { id: "montserrat", label: "Montserrat", family: "Montserrat", googleName: "Montserrat", weights: "wght@300;400;600;700;800", category: "sans" },
  { id: "manrope", label: "Manrope", family: "Manrope", googleName: "Manrope", weights: "wght@400;500;600;700;800", category: "sans" },
  { id: "playfair", label: "Playfair Display", family: "Playfair Display", googleName: "Playfair+Display", weights: "wght@400;600;700;800", category: "serif" },
  { id: "jetbrains", label: "JetBrains Mono", family: "JetBrains Mono", googleName: "JetBrains+Mono", weights: "wght@400;500;600;700", category: "mono" },
];

const loaded = new Set<string>();

export function ensureFontLoaded(id: string) {
  if (typeof document === "undefined") return;
  const font = fontOptions.find((f) => f.id === id);
  if (!font || loaded.has(id)) return;
  loaded.add(id);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleName}:${font.weights}&display=swap`;
  document.head.appendChild(link);
}

export function getFontFamily(id: string): string {
  const font = fontOptions.find((f) => f.id === id) ?? fontOptions[0];
  const fallback =
    font.category === "serif" ? "Georgia, serif"
    : font.category === "mono" ? "monospace"
    : "system-ui, sans-serif";
  return `"${font.family}", ${fallback}`;
}
