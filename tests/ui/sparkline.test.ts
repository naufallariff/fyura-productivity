import { describe, expect, it } from "vitest";
import { sparklinePath } from "@/lib/ui/sparkline";

describe("sparklinePath", () => {
  it("needs at least two finite values", () => {
    expect(sparklinePath([1], 120, 36)).toBeNull();
    expect(sparklinePath([Number.NaN, 2], 120, 36)).toBeNull();
  });

  it("maps the lowest value to the bottom and the highest to the top", () => {
    expect(sparklinePath([1, 2], 120, 36)).toBe("M2.00 34.00 C60.00 34.00 60.00 2.00 118.00 2.00");
  });

  it("draws a flat line through the middle when all values are equal", () => {
    expect(sparklinePath([5, 5, 5], 120, 36)).toBe(
      "M2.00 18.00 C31.00 18.00 31.00 18.00 60.00 18.00 C89.00 18.00 89.00 18.00 118.00 18.00",
    );
  });
});
