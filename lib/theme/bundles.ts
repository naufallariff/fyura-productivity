export const BUNDLE_IDS = ["ocean", "sage", "dusk"] as const;
export type BundleId = (typeof BUNDLE_IDS)[number];

export const MODES = ["light", "dark"] as const;
export type Mode = (typeof MODES)[number];

export const DEFAULT_BUNDLE: BundleId = "ocean";
export const DEFAULT_MODE: Mode = "light";

export const PALETTE = {
  "ocean-50": "oklch(0.97 0.012 240)",
  "ocean-100": "oklch(0.93 0.025 240)",
  "ocean-200": "oklch(0.86 0.045 240)",
  "ocean-300": "oklch(0.76 0.075 240)",
  "ocean-400": "oklch(0.65 0.11 240)",
  "ocean-500": "oklch(0.56 0.14 240)",
  "ocean-600": "oklch(0.48 0.13 240)",
  "ocean-700": "oklch(0.4 0.11 240)",
  "ocean-800": "oklch(0.33 0.085 240)",
  "ocean-900": "oklch(0.26 0.065 240)",
  "sage-500": "oklch(0.56 0.1 155)",
  "dusk-500": "oklch(0.56 0.12 290)",
  "neutral-50": "oklch(0.985 0.005 240)",
  "neutral-100": "oklch(0.96 0.008 240)",
  "neutral-200": "oklch(0.92 0.01 240)",
  "neutral-300": "oklch(0.87 0.012 240)",
  "neutral-400": "oklch(0.7 0.015 240)",
  "neutral-500": "oklch(0.55 0.015 240)",
  "neutral-600": "oklch(0.45 0.015 240)",
  "neutral-700": "oklch(0.35 0.012 240)",
  "neutral-800": "oklch(0.25 0.01 240)",
  "neutral-900": "oklch(0.18 0.008 240)",
  "neutral-950": "oklch(0.145 0.008 240)",
} as const;

interface BundleSeed {
  readonly canvas: string;
  readonly accent: string;
}

interface Bundle {
  readonly id: BundleId;
  readonly label: string;
  readonly light: BundleSeed;
  readonly dark: BundleSeed;
}

export type { Bundle };

export const BUNDLES: Readonly<Record<BundleId, Bundle>> = {
  ocean: {
    id: "ocean",
    label: "Ocean",
    light: { canvas: PALETTE["neutral-50"], accent: PALETTE["ocean-500"] },
    dark: { canvas: PALETTE["neutral-950"], accent: "oklch(0.7 0.12 240)" },
  },
  sage: {
    id: "sage",
    label: "Sage",
    light: { canvas: "oklch(0.985 0.008 155)", accent: PALETTE["sage-500"] },
    dark: { canvas: "oklch(0.145 0.012 155)", accent: "oklch(0.7 0.10 155)" },
  },
  dusk: {
    id: "dusk",
    label: "Dusk",
    light: { canvas: "oklch(0.985 0.008 290)", accent: PALETTE["dusk-500"] },
    dark: { canvas: "oklch(0.145 0.015 290)", accent: "oklch(0.7 0.12 290)" },
  },
};
