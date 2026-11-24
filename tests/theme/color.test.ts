import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  fitSrgb,
  formatOklch,
  parseOklch,
  relativeLuminance,
} from "@/lib/theme/color";

const BLACK = "oklch(0 0 0)";
const WHITE = "oklch(1 0 0)";

describe("OKLCH colors", () => {
  it("parses percentages and degree notation", () => {
    expect(formatOklch(parseOklch("oklch(50% 25% 240deg)"))).toBe("oklch(0.5 0.1 240)");
  });

  it("rejects malformed, out-of-range, and translucent input", () => {
    expect(() => parseOklch("oklch(0.5 0.1)")).toThrow(/OKLCH/);
    expect(() => parseOklch("oklch(1.1 0 0)")).toThrow(/OKLCH/);
    expect(() => parseOklch("oklch(0.5 0.1 0 / 0.5)")).toThrow(/OKLCH/);
  });

  it("returns the WCAG contrast endpoints", () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 8);
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 8);
    expect(contrastRatio(WHITE, WHITE)).toBe(1);
  });

  it("uses linear-light luminance for mid-gray and the sRGB primaries", () => {
    expect(relativeLuminance("oklch(0.5 0 0)")).toBeCloseTo(0.125, 8);
    expect(relativeLuminance("oklch(0.62795536 0.25768331 29.233885)")).toBeCloseTo(0.2126, 5);
    expect(relativeLuminance("oklch(0.86643961 0.29482724 142.495339)")).toBeCloseTo(0.7152, 5);
    expect(relativeLuminance("oklch(0.45201372 0.31321437 264.052021)")).toBeCloseTo(0.0722, 5);
  });

  it("fits wide-gamut colors by reducing chroma at the original lightness and hue", () => {
    const color = parseOklch("oklch(0.98 0.15 240)");
    const fitted = fitSrgb(color);
    expect(fitted.lightness).toBe(color.lightness);
    expect(fitted.hue).toBe(color.hue);
    expect(fitted.chroma).toBeLessThan(color.chroma);
    expect(fitSrgb(fitted)).toEqual(fitted);
  });
});
