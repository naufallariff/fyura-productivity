export const HUES = [
  "sky",
  "violet",
  "amber",
  "rose",
  "emerald",
  "teal",
  "orange",
  "indigo",
] as const;

export type Hue = (typeof HUES)[number];

/** Fixed expressive hues. They do not change with the active palette. */
export const HUE_SOLID: Record<Hue, string> = {
  sky: "#0EA5E9",
  violet: "#8B5CF6",
  amber: "#F59E0B",
  rose: "#F43F5E",
  emerald: "#10B981",
  teal: "#14B8A6",
  orange: "#F97316",
  indigo: "#6366F1",
};

/** Inline style for a tinted surface. Works in light and dark mode. */
export function hueTint(hue: Hue, strength = 14): { background: string } {
  return {
    background: `color-mix(in srgb, ${HUE_SOLID[hue]} ${strength}%, transparent)`,
  };
}

/** Inline style for an icon or bar in a hue. */
export function hueInk(hue: Hue): { color: string } {
  return { color: HUE_SOLID[hue] };
}
