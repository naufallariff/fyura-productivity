import { contrastRatio, mix } from "./color";
import type { Palette } from "./schema";
import type { Mode, ThemeTokens } from "./tokens";

const WHITE = "#ffffff";
const INK = "#0b0d14";

/** Picks white or near-black text, whichever has the higher contrast on the given color. */
export function pickOnColor(background: string): string {
  return contrastRatio(WHITE, background) >= contrastRatio(INK, background) ? WHITE : INK;
}

/** Derives every semantic token for one palette and one mode. Pure and deterministic. */
export function deriveTokens(palette: Palette, mode: Mode): ThemeTokens {
  const seed = palette[mode];
  const lift = mode === "light" ? 0.03 : 0.06;

  return {
    mode,
    bg: seed.bg,
    surface: seed.surface,
    surfaceRaised: mix(seed.surface, seed.text, lift),
    line: mix(seed.surface, seed.text, 0.12),
    text: seed.text,
    muted: seed.muted,
    accent: seed.accent,
    accentStrong: seed.accentStrong,
    onAccent: pickOnColor(seed.accent),
    danger: seed.danger,
    glowA: seed.glow[0],
    glowB: seed.glow[1],
    chart: [...palette.chart],
  };
}

/** Maps tokens to CSS custom properties. Names are role-based, never palette-based. */
export function toCssVariables(tokens: ThemeTokens): Record<string, string> {
  const variables: Record<string, string> = {
    "--bg": tokens.bg,
    "--surface": tokens.surface,
    "--surface-raised": tokens.surfaceRaised,
    "--line": tokens.line,
    "--text": tokens.text,
    "--muted": tokens.muted,
    "--accent": tokens.accent,
    "--accent-strong": tokens.accentStrong,
    "--on-accent": tokens.onAccent,
    "--danger": tokens.danger,
    "--glow-a": tokens.glowA,
    "--glow-b": tokens.glowB,
  };
  tokens.chart.forEach((color, index) => {
    variables[`--chart-${index + 1}`] = color;
  });
  return variables;
}
