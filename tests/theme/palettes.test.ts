import { describe, expect, it } from "vitest";
import { checkPaletteContrast, validatePalette } from "@/lib/theme/validate";
import { DEFAULT_PALETTE_ID, PALETTES, PALETTE_IDS, getPalette } from "@/lib/theme/palettes";

describe("base palettes", () => {
  it("ships exactly five palettes with unique ids", () => {
    expect(PALETTES).toHaveLength(5);
    expect(new Set(PALETTE_IDS).size).toBe(5);
  });

  it("uses navy as the default palette", () => {
    expect(DEFAULT_PALETTE_ID).toBe("navy");
    expect(getPalette(DEFAULT_PALETTE_ID).name).toBe("Navy Dark");
  });

  it("throws for an unknown palette id", () => {
    expect(() => getPalette("nope")).toThrow(/Unknown palette/);
  });

  for (const palette of PALETTES) {
    it(`${palette.id} passes WCAG AA in light and dark mode`, () => {
      expect(checkPaletteContrast(palette)).toEqual([]);
    });

    it(`${palette.id} is accepted by validatePalette`, () => {
      expect(validatePalette(palette).ok).toBe(true);
    });
  }
});

describe("validatePalette", () => {
  it("rejects a palette whose text is unreadable on its background", () => {
    const bad = {
      ...getPalette("navy"),
      light: { ...getPalette("navy").light, text: "#f0f0f0" },
    };
    const result = validatePalette(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("light text on bg"))).toBe(true);
    }
  });

  it("rejects a malformed palette before running contrast checks", () => {
    const result = validatePalette({ id: "x" });
    expect(result.ok).toBe(false);
  });
});
