import type { CSSProperties } from "react";
import type { Hue } from "@/lib/theme/hues";

export function hueVar(hue: Hue): string {
  return `var(--hue-${hue})`;
}

/** Soft tinted background built from any CSS color. Works in both modes. */
export function tintStyle(color: string, percent: number): CSSProperties {
  return { background: `color-mix(in srgb, ${color} ${percent}%, transparent)` };
}
