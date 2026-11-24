import { BUNDLE_IDS, BUNDLES, MODES, PALETTE } from "./bundles";
import { deriveTokens, type ThemeTokens } from "./derive";
import { CATEGORY_BY_HUE, HUE_NAMES, type Hue } from "./hues";

const KPI_HUES = {
  consistency: "indigo",
  trend: "emerald",
  focus: "amber",
  streak: "violet",
} as const satisfies Record<string, Hue>;

function themeVariables(t: ThemeTokens): Record<string, string> {
  const variables: Record<string, string> = {
    "--bundle-canvas": t.canvas,
    "--bundle-accent": t.accent,
    "--mode-page": t.page,
    "--mode-surface": t.surface,
    "--mode-elevated": t.elevated,
    "--mode-ink": t.ink,
    "--mode-ink-muted": t.inkMuted,
    "--mode-ink-subtle": t.inkSubtle,
    "--mode-on-accent": t.onAccent,
    "--mode-positive": t.positive,
    "--mode-negative": t.negative,
    "--mode-warning": t.warning,
    "--mode-info": t.info,
    "--bg-canvas": "var(--bundle-canvas)",
    "--bg-page": "var(--mode-page)",
    "--bg-surface": "var(--mode-surface)",
    "--bg-surface-elevated": "var(--mode-elevated)",
    "--border-subtle": t.borderSubtle,
    "--border-default": t.borderDefault,
    "--border-control": t.borderControl,
    "--shadow-card": t.shadowCard,
    "--shadow-raised": t.shadowRaised,
    "--color-ink": "var(--mode-ink)",
    "--color-ink-muted": "var(--mode-ink-muted)",
    "--color-ink-subtle": "var(--mode-ink-subtle)",
    "--color-accent": "var(--bundle-accent)",
    "--color-accent-hover": t.accentHover,
    "--color-accent-soft": t.accentSoft,
    "--color-on-accent": "var(--mode-on-accent)",
    "--color-positive": "var(--mode-positive)",
    "--color-negative": "var(--mode-negative)",
    "--color-negative-soft": t.negativeSoft,
    "--color-warning": "var(--mode-warning)",
    "--color-info": "var(--mode-info)",
    "--glass-bg": t.glassBg,
    "--glass-border": "var(--border-subtle)",
  };
  for (const hue of HUE_NAMES) {
    const category = CATEGORY_BY_HUE[hue];
    variables[`--cat-${category}`] = t.categories[hue].ink;
    variables[`--cat-${category}-soft`] = t.categories[hue].wash;
  }
  for (const [name, hue] of Object.entries(KPI_HUES)) {
    const category = CATEGORY_BY_HUE[hue];
    variables[`--kpi-${name}-bg`] = `var(--cat-${category}-soft)`;
    variables[`--kpi-${name}-fg`] = `var(--cat-${category})`;
  }
  return variables;
}

function declarations(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([name, value]) => `${name}:${value};`)
    .join("");
}

/** All values come from code constants. This CSS is shared by every request. */
export function buildThemeCss(): string {
  const palette = Object.fromEntries(
    Object.entries(PALETTE).map(([name, value]) => [`--${name}`, value]),
  );
  const schemes = BUNDLE_IDS.flatMap((bundleId) =>
    MODES.map((mode) => {
      const tokens = deriveTokens(BUNDLES[bundleId], mode);
      return `[data-theme="${bundleId}"][data-mode="${mode}"]{color-scheme:${mode};${declarations(themeVariables(tokens))}}`;
    }),
  );
  return [`:root{${declarations(palette)}}`, ...schemes].join("\n");
}
