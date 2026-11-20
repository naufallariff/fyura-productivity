import { BUNDLE_IDS, BUNDLES, MODES, type Mode } from "./bundles";
import { deriveTokens, type ThemeTokens } from "./derive";
import { HUE_NAMES, hueColor } from "./hues";

export function themeVariables(t: ThemeTokens): Record<string, string> {
  const variables: Record<string, string> = {
    "--canvas": t.canvas,
    "--glow-a": t.glow[0],
    "--glow-b": t.glow[1],
    "--glow-c": t.glow[2],
    "--glass-bg": t.glassBg,
    "--glass-solid": t.glassSolid,
    "--glass-border": t.glassBorder,
    "--glass-shadow": t.glassShadow,
    "--glass-highlight": t.glassHighlight,
    "--ink": t.ink,
    "--ink-muted": t.inkMuted,
    "--accent": t.accent,
    "--accent-soft": t.accentSoft,
    "--on-accent": t.onAccent,
    "--positive": t.positive,
    "--negative": t.negative,
    "--warning": t.warning,
    "--info": t.info,
  };
  for (const hue of HUE_NAMES) {
    variables[`--hue-${hue}`] = hueColor(hue, t.mode);
  }
  return variables;
}

/**
 * One CSS block per bundle and mode. Values come only from code constants,
 * never from user input, so injecting this into a style tag is safe.
 */
export function buildThemeCss(): string {
  return BUNDLE_IDS.flatMap((bundleId) =>
    MODES.map((mode: Mode) => {
      const tokens = deriveTokens(BUNDLES[bundleId], mode);
      const body = Object.entries(themeVariables(tokens))
        .map(([name, value]) => `${name}:${value};`)
        .join("");
      return `[data-bundle="${bundleId}"][data-mode="${mode}"]{color-scheme:${mode};${body}}`;
    }),
  ).join("\n");
}
