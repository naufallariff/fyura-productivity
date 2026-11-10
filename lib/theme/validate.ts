import { contrastRatio } from "./color";
import { deriveTokens } from "./derive";
import { PaletteSchema, type Palette } from "./schema";
import type { Mode, ThemeTokens } from "./tokens";

export const MODES: readonly Mode[] = ["light", "dark"];

export type ContrastIssue = {
  mode: Mode;
  pair: string;
  ratio: number;
  required: number;
};

type ContrastPair = {
  name: string;
  foreground: (t: ThemeTokens) => string;
  background: (t: ThemeTokens) => string;
  required: number;
};

/** WCAG AA: 4.5:1 for body text, 3:1 for large text and UI components. */
const TEXT = 4.5;
const UI = 3;

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { name: "text on bg", foreground: (t) => t.text, background: (t) => t.bg, required: TEXT },
  { name: "muted on bg", foreground: (t) => t.muted, background: (t) => t.bg, required: TEXT },
  {
    name: "text on surface",
    foreground: (t) => t.text,
    background: (t) => t.surface,
    required: TEXT,
  },
  {
    name: "muted on surface",
    foreground: (t) => t.muted,
    background: (t) => t.surface,
    required: TEXT,
  },
  {
    name: "text on raised surface",
    foreground: (t) => t.text,
    background: (t) => t.surfaceRaised,
    required: TEXT,
  },
  {
    name: "accent on surface",
    foreground: (t) => t.accent,
    background: (t) => t.surface,
    required: TEXT,
  },
  {
    name: "on-accent on accent",
    foreground: (t) => t.onAccent,
    background: (t) => t.accent,
    required: TEXT,
  },
  { name: "danger on bg", foreground: (t) => t.danger, background: (t) => t.bg, required: TEXT },
  {
    name: "danger on surface",
    foreground: (t) => t.danger,
    background: (t) => t.surface,
    required: TEXT,
  },
  { name: "accent on bg (UI)", foreground: (t) => t.accent, background: (t) => t.bg, required: UI },
];

/** Returns every failing pair across both modes. An empty array means the palette passes. */
export function checkPaletteContrast(palette: Palette): ContrastIssue[] {
  const issues: ContrastIssue[] = [];

  for (const mode of MODES) {
    const tokens = deriveTokens(palette, mode);
    for (const pair of CONTRAST_PAIRS) {
      const ratio = contrastRatio(pair.foreground(tokens), pair.background(tokens));
      if (ratio < pair.required) {
        issues.push({
          mode,
          pair: pair.name,
          ratio: Math.round(ratio * 100) / 100,
          required: pair.required,
        });
      }
    }
  }

  return issues;
}

export type PaletteValidation =
  { ok: true; palette: Palette; issues: [] } | { ok: false; errors: string[] };

/** Use for any palette that comes from outside the code base, such as a user-created theme. */
export function validatePalette(input: unknown): PaletteValidation {
  const parsed = PaletteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    };
  }

  const issues = checkPaletteContrast(parsed.data);
  if (issues.length > 0) {
    return {
      ok: false,
      errors: issues.map(
        (i) => `${i.mode} ${i.pair}: ratio ${i.ratio} is below required ${i.required}`,
      ),
    };
  }

  return { ok: true, palette: parsed.data, issues: [] };
}
