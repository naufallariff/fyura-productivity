import type { Bundle, Mode } from "./bundles";
import { fitSrgb, formatOklch, parseOklch, type Oklch } from "./color";
import { HUE_NAMES, HUE_PRIMITIVES, type Hue } from "./hues";
import { MODE_CONSTANTS } from "./tokens";
import { NATIVE_TOKENS } from "./foundation";

function gamutColor(color: Oklch): string {
  return formatOklch(fitSrgb(color));
}

export function deriveCategory(hue: Hue, mode: Mode) {
  const primitive = HUE_PRIMITIVES[hue];
  const isLight = mode === "light";
  const warm = hue === "amber" || hue === "orange";
  const chroma = isLight ? (warm ? 0.05 : hue === "sky" ? 0.03 : 0.04) : warm ? 0.04 : 0.03;
  return {
    ink: gamutColor({ lightness: primitive[mode], chroma: primitive.chroma, hue: primitive.hue }),
    wash: gamutColor({
      lightness: isLight ? (warm || hue === "sky" ? 0.94 : 0.93) : warm ? 0.24 : 0.22,
      chroma,
      hue: primitive.hue,
    }),
  };
}

export function deriveTokens(bundle: Bundle, mode: Mode) {
  const seed = bundle[mode];
  const fixed = MODE_CONSTANTS[mode];
  const base = parseOklch(seed.accent);
  const { hue } = base;
  const isLight = mode === "light";
  const bundleTone = (lightness: number, chroma: number, alpha?: number) =>
    formatOklch(fitSrgb({ lightness, chroma, hue }), alpha);
  const statuses = {
    positive: gamutColor(parseOklch(fixed.positive)),
    negative: gamutColor(parseOklch(fixed.negative)),
    warning: gamutColor(parseOklch(fixed.warning)),
    info: gamutColor(parseOklch(fixed.info)),
  };

  return {
    ...fixed,
    ...statuses,
    mode,
    canvas: isLight ? NATIVE_TOKENS.canvas : seed.canvas,
    accent: isLight ? NATIVE_TOKENS.focus : gamutColor(base),
    accentHover: isLight
      ? NATIVE_TOKENS.focus
      : gamutColor({
          ...base,
          lightness: isLight ? 0.48 : 0.75,
          chroma: isLight ? base.chroma * (13 / 14) : base.chroma + 0.02,
        }),
    accentSoft: isLight
      ? NATIVE_TOKENS.control
      : gamutColor({
          lightness: isLight ? 0.95 : 0.25,
          chroma: isLight ? 0.025 : 0.04,
          hue,
        }),
    borderSubtle: isLight ? bundleTone(0.9, 0.01, 0.6) : bundleTone(0.3, 0.012, 0.5),
    borderDefault: isLight ? bundleTone(0.85, 0.012, 0.8) : bundleTone(0.35, 0.014, 0.6),
    borderControl: isLight ? bundleTone(0.64, 0.014) : bundleTone(0.54, 0.014),
    negativeSoft: gamutColor({
      ...parseOklch(fixed.negative),
      lightness: isLight ? 0.95 : 0.25,
      chroma: 0.035,
    }),
    glassBg: isLight ? "oklch(1 0 0 / 0.72)" : "oklch(0.16 0.01 240 / 0.72)",
    categories: Object.fromEntries(
      HUE_NAMES.map((hue) => [hue, deriveCategory(hue, mode)]),
    ) as Record<Hue, ReturnType<typeof deriveCategory>>,
  };
}

export type ThemeTokens = ReturnType<typeof deriveTokens>;
