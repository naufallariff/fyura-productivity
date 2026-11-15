import type { Mode } from "./bundles";

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

// Module hues. Light values are deeper so icons keep 3:1 contrast on glass.
export const HUES: Readonly<Record<Mode, Readonly<Record<Hue, string>>>> = {
  light: {
    sky: "#0369A1",
    violet: "#6D28D9",
    amber: "#B45309",
    rose: "#BE123C",
    emerald: "#047857",
    teal: "#0F766E",
    orange: "#C2410C",
    indigo: "#4338CA",
  },
  dark: {
    sky: "#38BDF8",
    violet: "#A78BFA",
    amber: "#FBBF24",
    rose: "#FB7185",
    emerald: "#34D399",
    teal: "#2DD4BF",
    orange: "#FB923C",
    indigo: "#818CF8",
  },
};

export function hueColor(hue: Hue, mode: Mode): string {
  return HUES[mode][hue];
}
