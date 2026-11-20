// Bundles define the base environment only: canvas, glow, glass tint, hairline, shadow tint, accent.
// Text, status, and module hues are fixed and never change with a bundle.

export const BUNDLE_IDS = ["ocean", "sage", "dusk"] as const;
export type BundleId = (typeof BUNDLE_IDS)[number];

export const MODES = ["light", "dark"] as const;
export type Mode = (typeof MODES)[number];

export const DEFAULT_BUNDLE: BundleId = "ocean";
export const DEFAULT_MODE: Mode = "light";

export interface BundleSeed {
  readonly canvas: string;
  readonly glow: readonly [string, string, string];
  readonly glassTint: string;
  readonly border: string;
  readonly shadowTint: string;
  readonly accent: string;
  readonly accentSoft: string;
}

export interface Bundle {
  readonly id: BundleId;
  readonly label: string;
  readonly light: BundleSeed;
  readonly dark: BundleSeed;
}

export const BUNDLES: Readonly<Record<BundleId, Bundle>> = {
  ocean: {
    id: "ocean",
    label: "Ocean",
    light: {
      canvas: "#EAF4FB",
      glow: ["#B8DDF3", "#D5EBFA", "#C5D8FF"],
      glassTint: "#FFFFFF",
      border: "#3E83B0",
      shadowTint: "#143F5E",
      accent: "#1B6FB0",
      accentSoft: "#D6EBF8",
    },
    dark: {
      canvas: "#081523",
      glow: ["#15435F", "#1B3A66", "#0E3A4A"],
      glassTint: "#8FC7E8",
      border: "#8FC7E8",
      shadowTint: "#000814",
      accent: "#7CC4F2",
      accentSoft: "#16384F",
    },
  },
  sage: {
    id: "sage",
    label: "Sage",
    light: {
      canvas: "#EDF5EC",
      glow: ["#BFE2BC", "#D8EED2", "#B9DCCB"],
      glassTint: "#FFFFFF",
      border: "#3F7A52",
      shadowTint: "#1F4A2F",
      accent: "#2F7A4F",
      accentSoft: "#D4EBD6",
    },
    dark: {
      canvas: "#0A1510",
      glow: ["#1D4D33", "#1B4A45", "#14402F"],
      glassTint: "#A8E0B8",
      border: "#A8E0B8",
      shadowTint: "#000803",
      accent: "#8BD3A3",
      accentSoft: "#1A3A2A",
    },
  },
  dusk: {
    id: "dusk",
    label: "Dusk",
    light: {
      canvas: "#F3EFFA",
      glow: ["#D8CBF2", "#EBDFF8", "#F1CDE3"],
      glassTint: "#FFFFFF",
      border: "#6F57A8",
      shadowTint: "#3B2A6B",
      accent: "#6D4BC3",
      accentSoft: "#E6DCF8",
    },
    dark: {
      canvas: "#100B1A",
      glow: ["#3A2766", "#2C2452", "#4A2550"],
      glassTint: "#C9B8F5",
      border: "#C9B8F5",
      shadowTint: "#050210",
      accent: "#B9A2F5",
      accentSoft: "#2A2145",
    },
  },
};
