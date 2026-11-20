import { describe, expect, it } from "vitest";
import {
  dropNeighbours,
  insertionIndex,
  moveIndex,
  neighboursAt,
  splitByLengths,
  withItemInserted,
} from "@/domain/projects/placement";

describe("neighboursAt", () => {
  it("returns the items on either side of an index", () => {
    expect(neighboursAt(["a", "b", "c"], 1)).toEqual({ beforeId: "a", afterId: "b" });
    expect(neighboursAt(["a", "b"], 0)).toEqual({ beforeId: null, afterId: "a" });
    expect(neighboursAt(["a", "b"], 2)).toEqual({ beforeId: "b", afterId: null });
  });
});

describe("insertionIndex", () => {
  it("places after the before neighbour and before the after neighbour", () => {
    expect(insertionIndex(["a", "b"], { beforeId: "a", afterId: null }, false)).toBe(1);
    expect(insertionIndex(["a", "b"], { beforeId: null, afterId: "b" }, false)).toBe(1);
  });

  it("uses nullMeansEnd when no neighbour is given", () => {
    expect(insertionIndex(["a", "b"], { beforeId: null, afterId: null }, true)).toBe(2);
    expect(insertionIndex(["a", "b"], { beforeId: null, afterId: null }, false)).toBe(0);
  });

  it("falls back to the end when a neighbour is not in the list", () => {
    expect(insertionIndex(["a"], { beforeId: "missing", afterId: null }, false)).toBe(1);
  });
});

describe("withItemInserted", () => {
  it("inserts between two neighbours", () => {
    const result = withItemInserted(
      [{ id: "a" }, { id: "c" }],
      { id: "b" },
      { beforeId: "a", afterId: "c" },
      false,
    );
    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});

describe("moveIndex", () => {
  it("moves an item down and up without mutating the input", () => {
    const input = ["a", "b", "c"];
    expect(moveIndex(input, 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveIndex(input, 2, 0)).toEqual(["c", "a", "b"]);
    expect(input).toEqual(["a", "b", "c"]);
  });
});

describe("dropNeighbours", () => {
  const ids = ["a", "b", "c"];

  it("moves a card down within its list, after the card it was dropped on", () => {
    expect(
      dropNeighbours({
        activeId: "a",
        sourceListId: "L",
        sourceIds: ids,
        overId: "c",
        targetListId: "L",
        targetIds: ids,
        overIsList: false,
      }),
    ).toEqual({ beforeId: "c", afterId: null });
  });

  it("moves a card up within its list, before the card it was dropped on", () => {
    expect(
      dropNeighbours({
        activeId: "c",
        sourceListId: "L",
        sourceIds: ids,
        overId: "a",
        targetListId: "L",
        targetIds: ids,
        overIsList: false,
      }),
    ).toEqual({ beforeId: null, afterId: "a" });
  });

  it("returns null when a card is dropped on its own place", () => {
    expect(
      dropNeighbours({
        activeId: "a",
        sourceListId: "L",
        sourceIds: ids,
        overId: "a",
        targetListId: "L",
        targetIds: ids,
        overIsList: false,
      }),
    ).toBeNull();
  });

  it("places a card from another list before the card it was dropped on", () => {
    expect(
      dropNeighbours({
        activeId: "a",
        sourceListId: "L1",
        sourceIds: ["a"],
        overId: "c",
        targetListId: "L2",
        targetIds: ["x", "c"],
        overIsList: false,
      }),
    ).toEqual({ beforeId: "x", afterId: "c" });
  });

  it("appends to another list when dropped on its area", () => {
    expect(
      dropNeighbours({
        activeId: "a",
        sourceListId: "L1",
        sourceIds: ["a"],
        overId: "list:L2",
        targetListId: "L2",
        targetIds: ["x", "y"],
        overIsList: true,
      }),
    ).toEqual({ beforeId: "y", afterId: null });
  });
});

describe("splitByLengths", () => {
  it("keeps the original page sizes", () => {
    expect(splitByLengths([1, 2, 3, 4, 5], [2, 2, 1])).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("gives the last page any extra items", () => {
    expect(splitByLengths([1, 2, 3], [2, 2])).toEqual([[1, 2], [3]]);
  });
});
