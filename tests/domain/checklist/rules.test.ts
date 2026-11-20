import { describe, expect, it } from "vitest";
import { doneState, itemsForWeekday } from "@/domain/checklist/rules";

describe("itemsForWeekday", () => {
  it("returns one weekday in position order and leaves the input unchanged", () => {
    const input = [
      { id: "b", weekday: 1, position: 1 },
      { id: "x", weekday: 2, position: 0 },
      { id: "a", weekday: 1, position: 0 },
    ];
    expect(itemsForWeekday(input, 1).map((item) => item.id)).toEqual(["a", "b"]);
    expect(input[0]?.id).toBe("b");
  });
});

describe("doneState", () => {
  const now = new Date("2026-11-02T03:00:00Z");

  it("sets the completion time when an item is done", () => {
    expect(doneState(true, now)).toEqual({ isDone: true, doneAt: now });
  });

  it("clears the completion time when an item is undone", () => {
    expect(doneState(false, now)).toEqual({ isDone: false, doneAt: null });
  });
});
