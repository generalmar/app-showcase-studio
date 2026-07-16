export type BackgroundStyle = "solid" | "gradient" | "mesh";
export type TextPosition = "top" | "bottom";
export type BlobIntensity = "none" | "subtle" | "strong";

export interface TemplateConfig {
  appName: string;
  appDescription: string;
  backgroundColor: string;
  backgroundColor2: string; // used for gradient / mesh
  gradientAngle: number; // 0-360 degrees
  backgroundStyle: BackgroundStyle;
  blobIntensity: BlobIntensity;
  accentColor: string;
  textColor: string;
  subtextColor: string;
  showDeviceFrame: boolean;
  textPosition: TextPosition;
  fontId: string;
}

export const defaultTemplate: TemplateConfig = {
  appName: "YourApp",
  appDescription: "Describe your app in one line",
  backgroundColor: "#1e3a34",
  backgroundColor2: "#0f2420",
  gradientAngle: 135,
  backgroundStyle: "gradient",
  blobIntensity: "subtle",
  accentColor: "#b8c94a",
  textColor: "#ffffff",
  subtextColor: "#d1e0d8",
  showDeviceFrame: true,
  textPosition: "top",
  fontId: "inter",
};

export interface ScreenshotTemplate {
  headline: string;
  subtitle: string;
}

export const defaultScreenshotTemplate = (label: string): ScreenshotTemplate => ({
  headline: label || "Your Feature",
  subtitle: "A short description of this screen",
});
