import { describe, expect, it } from "vitest";
import { BUNDLE_IDS, MODES } from "@/lib/theme/bundles";
import { buildThemeCss } from "@/lib/theme/css";
import { CATEGORY_BY_HUE } from "@/lib/theme/hues";
import { validateContrast } from "@/lib/theme/validate";

const TEXT_MIN = 4.5;
const GRAPHIC_MIN = 3;
const THEME_CSS = buildThemeCss();
const THEMES = BUNDLE_IDS.flatMap((bundle) => MODES.map((mode) => ({ bundle, mode })));
const CATEGORIES = Object.values(CATEGORY_BY_HUE).map((category) => `--cat-${category}`);

const SURFACES = ["--bg-canvas", "--bg-page", "--bg-surface", "--bg-surface-elevated"];
const INKS = ["--color-ink", "--color-ink-muted", "--color-ink-subtle"];
const STATUSES = ["--color-positive", "--color-negative", "--color-warning", "--color-info"];

function resolveColors(bundle: string, mode: string) {
  const selector = `[data-bundle="${bundle}"][data-mode="${mode}"]`;
  const rule = THEME_CSS.split("\n").find((line) => line.startsWith(selector + "{"));
  if (!rule) throw new Error(`Missing theme rule for ${selector}`);

  const declarations = rule
    .slice(selector.length + 1, -1)
    .split(";")
    .filter(Boolean);
  const properties = new Map(
    declarations.map((entry) => {
      const colon = entry.indexOf(":");
      return [entry.slice(0, colon), entry.slice(colon + 1)] as const;
    }),
  );

  function color(name: string): string {
    const value = properties.get(name);
    if (!value) throw new Error(`Missing ${name} for ${selector}`);
    const reference = /^var\((--[a-z0-9-]+)\)$/.exec(value)?.[1];
    return reference ? color(reference) : value;
  }
  return color;
}

describe.each(THEMES)("$bundle / $mode", ({ bundle, mode }) => {
  const color = resolveColors(bundle, mode);

  it("passes WCAG AA for normal text on its rendered surfaces", () => {
    const categoryWashes = CATEGORIES.map((category) => `${category}-soft`);
    const pairs = [
      ...[...SURFACES, "--color-accent-soft", ...categoryWashes].flatMap((surface) =>
        INKS.map((ink) => [ink, surface] as const),
      ),
      ...SURFACES.flatMap((surface) =>
        [...STATUSES, "--color-accent"].map((ink) => [ink, surface] as const),
      ),
      ...CATEGORIES.map((category) => [category, `${category}-soft`] as const),
      ["--color-accent", "--color-accent-soft"],
      ["--color-on-accent", "--color-accent"],
      ["--color-on-accent", "--color-accent-hover"],
      ["--color-negative", "--color-negative-soft"],
    ] as const;

    for (const [fg, bg] of pairs) {
      const { ratio, passes } = validateContrast(color(fg), color(bg));
      expect(ratio, `${fg} on ${bg}`).toBeGreaterThanOrEqual(TEXT_MIN);
      expect(passes).toBe(true);
    }
  });

  it("passes WCAG AA for large text, focus rings, control outlines, and category markers", () => {
    const pairs = SURFACES.flatMap((surface) =>
      ["--color-accent", "--border-control", ...CATEGORIES].map((fg) => [fg, surface] as const),
    );

    for (const [fg, bg] of pairs) {
      const { ratio } = validateContrast(color(fg), color(bg));
      expect(ratio, `${fg} on ${bg}`).toBeGreaterThanOrEqual(GRAPHIC_MIN);
    }
  });
});

it("sets passes at the normal-text threshold without rounding the ratio", () => {
  const result = validateContrast("oklch(0.6 0 0)", "oklch(1 0 0)");
  expect(result.ratio).toBeGreaterThan(GRAPHIC_MIN);
  expect(result.ratio).toBeLessThan(TEXT_MIN);
  expect(result.passes).toBe(false);
});
