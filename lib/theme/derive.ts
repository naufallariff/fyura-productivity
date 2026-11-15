import { contrastRatio } from "./color";
import type { Bundle, Mode } from "./bundles";
import { MODE_CONSTANTS } from "./tokens";

const WHITE = "#FFFFFF";
const INK_ON_LIGHT = "#0B0D14";

export interface ThemeTokens {
  readonly mode: Mode;
  readonly canvas: string;
  readonly glow: readonly [string, string, string];
  /** Translucent glass surface. Used together with backdrop blur. */
  readonly glassBg: string;
  /** Opaque equivalent of the glass over the canvas. Used for contrast checks and fallback. */
  readonly glassSolid: string;
  readonly glassBorder: string;
  readonly glassShadow: string;
  readonly glassHighlight: string;
  readonly ink: string;
  readonly inkMuted: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly onAccent: string;
  readonly positive: string;
  readonly negative: string;
  readonly warning: string;
  readonly info: string;
}

export type RGB = readonly [number, number, number];

export function hexToRgb(hex: string): RGB {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  const digits = match?.[1];
  if (!digits) throw new Error(`Invalid hex color: ${hex}`);
  const value = Number.parseInt(digits, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex([r, g, b]: RGB): string {
  const part = (c: number) => Math.round(c).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** Linear blend in sRGB. t = 0 returns a, t = 1 returns b. */
export function blendHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

function onColor(background: string): string {
  return contrastRatio(WHITE, background) >= contrastRatio(INK_ON_LIGHT, background)
    ? WHITE
    : INK_ON_LIGHT;
}

/** Derives every token for one bundle and one mode. Pure and deterministic. */
export function deriveTokens(bundle: Bundle, mode: Mode): ThemeTokens {
  const seed = bundle[mode];
  const k = MODE_CONSTANTS[mode];

  return {
    mode,
    canvas: seed.canvas,
    glow: seed.glow,
    glassBg: rgba(seed.glassTint, k.glassAlpha),
    glassSolid: blendHex(seed.canvas, seed.glassTint, k.glassAlpha),
    glassBorder: rgba(seed.border, k.borderAlpha),
    glassShadow: `0 1px 2px rgb(0 0 0 / 0.06), 0 16px 40px -16px ${rgba(seed.shadowTint, k.shadowAlpha)}`,
    glassHighlight: `rgb(255 255 255 / ${k.highlightAlpha})`,
    ink: k.ink,
    inkMuted: k.inkMuted,
    accent: seed.accent,
    accentSoft: seed.accentSoft,
    onAccent: onColor(seed.accent),
    positive: k.positive,
    negative: k.negative,
    warning: k.warning,
    info: k.info,
  };
}
