import { contrastRatio } from "./color";
import { BUNDLE_IDS, BUNDLES, MODES, type BundleId, type Mode } from "./bundles";
import { deriveTokens } from "./derive";
import { HUE_NAMES, hueColor } from "./hues";

export const TEXT_MIN = 4.5;
export const GRAPHIC_MIN = 3;

export interface ContrastResult {
  readonly bundle: BundleId;
  readonly mode: Mode;
  readonly pair: string;
  readonly ratio: number;
  readonly required: number;
  readonly ok: boolean;
}

type Rule = [pair: string, foreground: string, background: string, required: number];

/** Every text and icon pair that the UI relies on, for one bundle and one mode. */
export function checkTheme(bundle: BundleId, mode: Mode): ContrastResult[] {
  const t = deriveTokens(BUNDLES[bundle], mode);

  const rules: Rule[] = [
    ["ink on canvas", t.ink, t.canvas, TEXT_MIN],
    ["ink on glass", t.ink, t.glassSolid, TEXT_MIN],
    ["ink muted on glass", t.inkMuted, t.glassSolid, TEXT_MIN],
    ["accent on glass", t.accent, t.glassSolid, TEXT_MIN],
    ["on accent", t.onAccent, t.accent, TEXT_MIN],
    ["ink on accent soft", t.ink, t.accentSoft, TEXT_MIN],
    ["positive on glass", t.positive, t.glassSolid, TEXT_MIN],
    ["negative on glass", t.negative, t.glassSolid, TEXT_MIN],
    ["warning on glass", t.warning, t.glassSolid, TEXT_MIN],
    ["info on glass", t.info, t.glassSolid, TEXT_MIN],
  ];

  for (const hue of HUE_NAMES) {
    rules.push([`hue ${hue} on glass`, hueColor(hue, mode), t.glassSolid, GRAPHIC_MIN]);
  }

  return rules.map(([pair, foreground, background, required]) => {
    const ratio = contrastRatio(foreground, background);
    return { bundle, mode, pair, ratio, required, ok: ratio >= required };
  });
}

export function checkAll(): ContrastResult[] {
  return BUNDLE_IDS.flatMap((bundle) => MODES.flatMap((mode) => checkTheme(bundle, mode)));
}
