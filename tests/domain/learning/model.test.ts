import { describe, expect, it } from "vitest";
import { WIP_LIMIT, exceedsTotal, wipExceeded } from "@/domain/learning/model";

describe("wipExceeded", () => {
  it("warns once the soft limit is reached", () => {
    expect(wipExceeded(WIP_LIMIT - 1)).toBe(false);
    expect(wipExceeded(WIP_LIMIT)).toBe(true);
  });
});

describe("exceedsTotal", () => {
  it("is false for an open-ended item and for progress within the total", () => {
    expect(exceedsTotal(500, null)).toBe(false);
    expect(exceedsTotal(100, 100)).toBe(false);
  });

  it("is true only when progress is above the total", () => {
    expect(exceedsTotal(101, 100)).toBe(true);
  });
});
