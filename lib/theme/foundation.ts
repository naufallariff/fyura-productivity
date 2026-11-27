/** Exact palette read from FigCraft 202/205–219, 12395 and 27447 on 2026-11-27. */
export const BRAND_PRIMITIVES = {
  aqua: "#57F6DC",
  violet: "#B996FF",
  blue: "#6ACFFF",
  pink: "#FF8CD8",
  lime: "#E4FF88",
  canvas: "#F6F9FF",
  reading: "#FCFDFF",
  control: "#F1F5FF",
  ink: "#14213D",
  muted: "#52617D",
  focus: "#5841D1",
  membrane: "#9FEFF0",
  white: "#FFFFFF",
} as const;

export type NeonTone = "aqua" | "violet" | "blue" | "pink" | "lime";

/** Same sRGB primitives in OKLCH for the existing gamut/contrast pipeline. */
function oklch(hex: string): string {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const labB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return `oklch(${lightness} ${Math.hypot(a, labB)} ${((Math.atan2(labB, a) * 180) / Math.PI + 360) % 360})`;
}

export const NATIVE_TOKENS = {
  canvas: oklch(BRAND_PRIMITIVES.canvas),
  reading: oklch(BRAND_PRIMITIVES.reading),
  control: oklch(BRAND_PRIMITIVES.control),
  ink: oklch(BRAND_PRIMITIVES.ink),
  muted: oklch(BRAND_PRIMITIVES.muted),
  focus: oklch(BRAND_PRIMITIVES.focus),
};
