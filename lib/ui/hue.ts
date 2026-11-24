import type { CSSProperties } from "react";
import { CATEGORY_BY_HUE, type Hue } from "@/lib/theme/hues";

export function hueVar(hue: Hue): string {
  return `var(--cat-${CATEGORY_BY_HUE[hue]})`;
}

export function hueSoftVar(hue: Hue): string {
  return `var(--cat-${CATEGORY_BY_HUE[hue]}-soft)`;
}

/** Soft tinted background built from any CSS color. Works in both modes. */
export function tintStyle(color: string, percent: number): CSSProperties {
  return { background: `color-mix(in oklch, ${color} ${percent}%, transparent)` };
}
