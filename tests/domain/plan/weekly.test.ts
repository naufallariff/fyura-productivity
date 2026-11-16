import { describe, expect, it } from "vitest";
import { reorder, weekdayLabel } from "@/domain/plan/weekly";

describe("reorder", () => {
  it("moves an item and leaves the input unchanged", () => {
    const input = ["a", "b", "c"];
    expect(reorder(input, 0, 2)).toEqual(["b", "c", "a"]);
    expect(input).toEqual(["a", "b", "c"]);
  });

  it("rejects an index outside the list", () => {
    expect(() => reorder(["a"], 0, 3)).toThrow();
    expect(() => reorder(["a"], 5, 0)).toThrow(/Index out of range/);
  });
});

describe("weekdayLabel", () => {
  it("maps 1 to Monday and 7 to Sunday", () => {
    expect(weekdayLabel(1)).toBe("Monday");
    expect(weekdayLabel(7)).toBe("Sunday");
  });
});
