import { describe, expect, it } from "vitest";
import { contrastRatio, mix, parseHex, relativeLuminance, toHex } from "@/lib/theme/color";

describe("color utilities", () => {
  it("parses and re-serializes hex colors", () => {
    expect(toHex(parseHex("#1e2654"))).toBe("#1e2654");
  });

  it("rejects malformed hex", () => {
    expect(() => parseHex("1e2654")).toThrow(/Invalid hex/);
    expect(() => parseHex("#fff")).toThrow(/Invalid hex/);
  });

  it("gives black on white the maximum contrast of 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("gives identical colors a contrast of 1", () => {
    expect(contrastRatio("#1e2654", "#1e2654")).toBeCloseTo(1, 5);
  });

  it("has luminance 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("mixes at the endpoints and midpoint", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("clamps the mix factor", () => {
    expect(mix("#000000", "#ffffff", -1)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 2)).toBe("#ffffff");
  });
});
