import { describe, expect, it } from "vitest";
import { MAX_DAILY_COUNT, clampCount, totalsByKind } from "@/domain/career/activity";

describe("clampCount", () => {
  it("keeps a count between zero and the daily maximum", () => {
    expect(clampCount(-5)).toBe(0);
    expect(clampCount(3.9)).toBe(3);
    expect(clampCount(MAX_DAILY_COUNT + 1)).toBe(MAX_DAILY_COUNT);
  });
});

describe("totalsByKind", () => {
  it("sums each kind and ignores unknown kinds", () => {
    const totals = totalsByKind([
      { kind: "APPLY", count: 2 },
      { kind: "APPLY", count: 3 },
      { kind: "NETWORKING", count: 1 },
      { kind: "UNKNOWN", count: 9 },
    ]);
    expect(totals.APPLY).toBe(5);
    expect(totals.NETWORKING).toBe(1);
    expect(totals.OTHER).toBe(0);
  });
});
