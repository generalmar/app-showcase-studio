export interface TemplateConfig {
  appName: string;
  appDescription: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  subtextColor: string;
  showDeviceFrame: boolean;
}

export const defaultTemplate: TemplateConfig = {
  appName: "YourApp",
  appDescription: "Describe your app in one line",
  backgroundColor: "#1e3a34",
  accentColor: "#b8c94a",
  textColor: "#ffffff",
  subtextColor: "#d1e0d8",
  showDeviceFrame: true,
};

export interface ScreenshotTemplate {
  headline: string;
  subtitle: string;
}

export const defaultScreenshotTemplate = (label: string): ScreenshotTemplate => ({
  headline: label || "Your Feature",
  subtitle: "A short description of this screen",
});
