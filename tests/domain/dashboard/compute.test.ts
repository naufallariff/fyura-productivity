import { describe, expect, it } from "vitest";
import { averageRatio, deltaPoints } from "@/domain/dashboard/compute";

describe("deltaPoints", () => {
  it("returns the change in percentage points with one decimal", () => {
    expect(deltaPoints(0.8, 0.7)).toBe(10);
    expect(deltaPoints(0.5, 0.5137)).toBe(-1.4);
  });

  it("returns null when either side is missing", () => {
    expect(deltaPoints(null, 0.5)).toBeNull();
    expect(deltaPoints(0.5, null)).toBeNull();
  });
});

describe("averageRatio", () => {
  it("ignores days with no plan", () => {
    expect(averageRatio([{ ratio: 0.5 }, { ratio: null }, { ratio: 1 }])).toBe(0.75);
  });

  it("returns null when nothing was recorded", () => {
    expect(averageRatio([{ ratio: null }])).toBeNull();
    expect(averageRatio([])).toBeNull();
  });
});
