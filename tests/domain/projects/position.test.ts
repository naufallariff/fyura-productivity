import { describe, expect, it } from "vitest";
import {
  MIN_GAP,
  POSITION_STEP,
  positionBetween,
  respacedPositions,
} from "@/domain/projects/position";

describe("positionBetween", () => {
  it("places the first item at the step", () => {
    expect(positionBetween(null, null)).toBe(POSITION_STEP);
  });

  it("appends after the last item and prepends before the first", () => {
    expect(positionBetween(2048, null)).toBe(2048 + POSITION_STEP);
    expect(positionBetween(null, 1024)).toBe(1024 - POSITION_STEP);
  });

  it("returns the midpoint between two neighbours", () => {
    expect(positionBetween(1024, 2048)).toBe(1536);
  });

  it("asks for a respace when the neighbours are equal, reversed, or too close", () => {
    expect(positionBetween(1024, 1024)).toBeNull();
    expect(positionBetween(2048, 1024)).toBeNull();
    expect(positionBetween(1, 1 + MIN_GAP / 2)).toBeNull();
  });

  it("produces evenly spaced positions for a respace", () => {
    expect(respacedPositions(3)).toEqual([1024, 2048, 3072]);
  });
});
