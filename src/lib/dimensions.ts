export type Platform = "ios" | "android";
export type Orientation = "portrait" | "landscape";

export interface DimensionPreset {
  id: string;
  platform: Platform;
  category: string;
  label: string;
  width: number;
  height: number;
  orientation: Orientation;
  required: boolean;
}

export const dimensionPresets: DimensionPreset[] = [
  // iOS
  {
    id: "ios-iphone65-portrait",
    platform: "ios",
    category: 'iPhone 6.5"',
    label: "Portrait",
    width: 1242,
    height: 2688,
    orientation: "portrait",
    required: true,
  },
  {
    id: "ios-iphone65-landscape",
    platform: "ios",
    category: 'iPhone 6.5"',
    label: "Landscape",
    width: 2688,
    height: 1242,
    orientation: "landscape",
    required: true,
  },
  {
    id: "ios-ipad-portrait",
    platform: "ios",
    category: '12.9" iPad Pro',
    label: "Portrait",
    width: 2048,
    height: 2732,
    orientation: "portrait",
    required: true,
  },
  {
    id: "ios-ipad-landscape",
    platform: "ios",
    category: '12.9" iPad Pro',
    label: "Landscape",
    width: 2732,
    height: 2048,
    orientation: "landscape",
    required: true,
  },
  {
    id: "ios-watch-portrait",
    platform: "ios",
    category: "Apple Watch",
    label: "Portrait",
    width: 422,
    height: 514,
    orientation: "portrait",
    required: false,
  },
  {
    id: "ios-watch-landscape",
    platform: "ios",
    category: "Apple Watch",
    label: "Landscape",
    width: 410,
    height: 502,
    orientation: "landscape",
    required: false,
  },

  // Android
  {
    id: "android-phone-portrait",
    platform: "android",
    category: "Phone",
    label: "Portrait",
    width: 1080,
    height: 1920,
    orientation: "portrait",
    required: true,
  },
  {
    id: "android-phone-landscape",
    platform: "android",
    category: "Phone",
    label: "Landscape",
    width: 1920,
    height: 1080,
    orientation: "landscape",
    required: true,
  },
  {
    id: "android-7tablet-portrait",
    platform: "android",
    category: '7" Tablet',
    label: "Portrait",
    width: 1200,
    height: 1920,
    orientation: "portrait",
    required: false,
  },
  {
    id: "android-7tablet-landscape",
    platform: "android",
    category: '7" Tablet',
    label: "Landscape",
    width: 1920,
    height: 1200,
    orientation: "landscape",
    required: false,
  },
  {
    id: "android-10tablet-portrait",
    platform: "android",
    category: '10" Tablet',
    label: "Portrait",
    width: 1600,
    height: 2560,
    orientation: "portrait",
    required: false,
  },
  {
    id: "android-10tablet-landscape",
    platform: "android",
    category: '10" Tablet',
    label: "Landscape",
    width: 2560,
    height: 1600,
    orientation: "landscape",
    required: false,
  },
];

export function getPresetsByPlatform(platform: Platform): DimensionPreset[] {
  return dimensionPresets.filter((p) => p.platform === platform);
}

export function getGroupedPresets(platform: Platform) {
  const presets = getPresetsByPlatform(platform);
  const groups: Record<string, DimensionPreset[]> = {};
  for (const p of presets) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  }
  return groups;
}
