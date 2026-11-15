import { describe, expect, it } from "vitest";
import { layoutLanes } from "@/lib/time/layout";

describe("layoutLanes", () => {
  it("gives two overlapping blocks two lanes", () => {
    const out = layoutLanes([
      { id: "a", start: 540, end: 600 },
      { id: "b", start: 570, end: 630 },
    ]);
    expect(out.map((o) => [o.id, o.lane, o.lanes])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
    ]);
  });

  it("keeps non-overlapping blocks at full width", () => {
    const out = layoutLanes([
      { id: "a", start: 540, end: 600 },
      { id: "b", start: 600, end: 660 },
    ]);
    expect(out.every((o) => o.lanes === 1)).toBe(true);
  });

  it("reuses a freed lane inside the same cluster", () => {
    const out = layoutLanes([
      { id: "a", start: 540, end: 600 },
      { id: "b", start: 570, end: 630 },
      { id: "c", start: 620, end: 700 },
    ]);
    const c = out.find((o) => o.id === "c");
    expect(c).toMatchObject({ lane: 0, lanes: 2 });
  });
});
