import { describe, expect, it } from "vitest";
import { monthCells, shiftMonth } from "@/domain/time/mini-month";

describe("monthCells", () => {
  it("places November 2026 correctly, since 1 November is a Sunday", () => {
    const cells = monthCells(2026, 11);
    expect(cells).toHaveLength(42);
    expect(cells[6]).toBe("2026-11-01");
    expect(cells[35]).toBe("2026-11-30");
    expect(cells[5]).toBeNull();
  });
});

describe("shiftMonth", () => {
  it("crosses year boundaries in both directions", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 0)).toBe("2026-11");
  });
});
