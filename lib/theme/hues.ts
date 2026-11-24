export const HUE_NAMES = [
  "sky",
  "violet",
  "amber",
  "rose",
  "emerald",
  "teal",
  "orange",
  "indigo",
] as const;
export type Hue = (typeof HUE_NAMES)[number];

export const CATEGORY_BY_HUE = {
  sky: "rest",
  violet: "leisure",
  amber: "social",
  rose: "career",
  emerald: "fitness",
  teal: "worship",
  orange: "work",
  indigo: "learning",
} as const satisfies Record<Hue, string>;

export type ThemeCategory = (typeof CATEGORY_BY_HUE)[Hue];

// Two foreground tones share a hue and chroma. Washes are derived from these seeds.
export const HUE_PRIMITIVES = {
  sky: { hue: 210, chroma: 0.1, light: 0.45, dark: 0.72 },
  violet: { hue: 290, chroma: 0.12, light: 0.45, dark: 0.72 },
  amber: { hue: 80, chroma: 0.14, light: 0.52, dark: 0.78 },
  rose: { hue: 350, chroma: 0.14, light: 0.5, dark: 0.75 },
  emerald: { hue: 155, chroma: 0.1, light: 0.42, dark: 0.72 },
  teal: { hue: 180, chroma: 0.1, light: 0.42, dark: 0.72 },
  orange: { hue: 65, chroma: 0.14, light: 0.52, dark: 0.78 },
  indigo: { hue: 260, chroma: 0.12, light: 0.42, dark: 0.72 },
} as const satisfies Record<Hue, { hue: number; chroma: number; light: number; dark: number }>;
