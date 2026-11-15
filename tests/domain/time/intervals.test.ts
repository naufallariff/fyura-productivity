import { describe, expect, it } from "vitest";
import { findGaps, mergeIntervals } from "@/lib/time/intervals";

describe("mergeIntervals", () => {
  it("merges overlapping and touching intervals without mutating input", () => {
    const input = [
      { start: 600, end: 700 },
      { start: 540, end: 630 },
      { start: 700, end: 720 },
    ];
    expect(mergeIntervals(input)).toEqual([{ start: 540, end: 720 }]);
    expect(input[0]).toEqual({ start: 600, end: 700 });
  });
});

describe("findGaps", () => {
  it("returns the whole day when nothing is logged", () => {
    expect(findGaps([], 30)).toEqual([{ start: 0, end: 1440 }]);
  });

  it("finds unlogged stretches around and between blocks", () => {
    const gaps = findGaps(
      [
        { start: 540, end: 630 },
        { start: 600, end: 700 },
      ],
      30,
    );
    expect(gaps).toEqual([
      { start: 0, end: 540 },
      { start: 700, end: 1440 },
    ]);
  });

  it("ignores stretches shorter than the minimum length", () => {
    expect(findGaps([{ start: 0, end: 1420 }], 30)).toEqual([]);
  });
});
