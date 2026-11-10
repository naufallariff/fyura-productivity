import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/theme/color";
import { deriveTokens, pickOnColor, toCssVariables } from "@/lib/theme/derive";
import { getPalette } from "@/lib/theme/palettes";

describe("deriveTokens", () => {
  it("uses the seed values directly for text and background", () => {
    const tokens = deriveTokens(getPalette("navy"), "dark");
    expect(tokens.bg).toBe("#0f1330");
    expect(tokens.text).toBe("#f5f7fc");
    expect(tokens.mode).toBe("dark");
  });

  it("chooses white text on the dark navy accent in light mode", () => {
    expect(deriveTokens(getPalette("navy"), "light").onAccent).toBe("#ffffff");
  });

  it("chooses near-black text on the light rose accent in dark mode", () => {
    expect(deriveTokens(getPalette("rose"), "dark").onAccent).toBe("#0b0d14");
  });

  it("always returns the on-accent color with higher contrast", () => {
    for (const id of ["navy", "forest", "rose", "midnight-teal", "aurora-frost"]) {
      for (const mode of ["light", "dark"] as const) {
        const t = deriveTokens(getPalette(id), mode);
        const chosen = contrastRatio(t.onAccent, t.accent);
        expect(chosen).toBeGreaterThanOrEqual(contrastRatio("#ffffff", t.accent) - 1e-9);
        expect(chosen).toBeGreaterThanOrEqual(contrastRatio("#0b0d14", t.accent) - 1e-9);
      }
    }
  });

  it("gives every palette exactly six chart colors", () => {
    for (const id of ["navy", "forest", "rose", "midnight-teal", "aurora-frost"]) {
      expect(deriveTokens(getPalette(id), "light").chart).toHaveLength(6);
    }
  });

  it("uses the danger seed of each palette and mode", () => {
    const palette = getPalette("rose");
    expect(deriveTokens(palette, "light").danger).toBe(palette.light.danger);
    expect(deriveTokens(palette, "dark").danger).toBe(palette.dark.danger);
  });

  it("is deterministic for the same input", () => {
    const a = deriveTokens(getPalette("forest"), "light");
    const b = deriveTokens(getPalette("forest"), "light");
    expect(a).toEqual(b);
  });
});

describe("toCssVariables", () => {
  it("exposes role-based names and six chart variables", () => {
    const vars = toCssVariables(deriveTokens(getPalette("rose"), "light"));
    expect(vars["--accent"]).toBe("#b3265e");
    expect(vars["--chart-1"]).toBeDefined();
    expect(vars["--chart-6"]).toBeDefined();
    expect(vars["--chart-7"]).toBeUndefined();
  });

  it("matches the snapshot for the default theme", () => {
    const vars = toCssVariables(deriveTokens(getPalette("navy"), "dark"));
    expect(vars).toMatchSnapshot();
  });
});

describe("pickOnColor", () => {
  it("returns white on dark backgrounds and ink on light backgrounds", () => {
    expect(pickOnColor("#0f1330")).toBe("#ffffff");
    expect(pickOnColor("#f5f7fc")).toBe("#0b0d14");
  });
});
