import { describe, expect, it } from "vitest";
import { buildDashboard, type NamedHabit } from "@/lib/scoring/dashboard";
import type { DayRecord } from "@/lib/scoring/types";

const HABITS: NamedHabit[] = [
  {
    id: "a",
    name: "Habit A",
    category: "WORSHIP",
    kind: "BINARY",
    target: 1,
    active: true,
    offDayCore: true,
  },
  {
    id: "b",
    name: "Habit B",
    category: "LEARNING",
    kind: "BINARY",
    target: 1,
    active: true,
    offDayCore: true,
  },
];

// Two binary habits, seven normal days, 11 of 14 slots done.
const WEEK: DayRecord[] = [
  { date: "2026-10-01", status: "NORMAL", inputs: { a: 1, b: 0 } },
  { date: "2026-10-02", status: "NORMAL", inputs: { a: 1, b: 1 } },
  { date: "2026-10-03", status: "NORMAL", inputs: { a: 1, b: 1 } },
  { date: "2026-10-04", status: "NORMAL", inputs: { a: 0, b: 1 } },
  { date: "2026-10-05", status: "NORMAL", inputs: { a: 1, b: 1 } },
  { date: "2026-10-06", status: "NORMAL", inputs: { a: 1, b: 1 } },
  { date: "2026-10-07", status: "NORMAL", inputs: { a: 1, b: 0 } },
];

describe("buildDashboard", () => {
  const model = buildDashboard(HABITS, WEEK, "2026-10-07");

  it("computes the weekly ratio weighted by planned slots", () => {
    expect(model.week.ratio).toBeCloseTo(11 / 14, 10);
    expect(model.week.recorded).toBe(7);
  });

  it("has no prior-week comparison when prior days are absent", () => {
    expect(model.priorWeekRatio).toBeNull();
  });

  it("ranks the most missed habits first", () => {
    expect(model.mostMissed).toEqual([
      { habitId: "b", name: "Habit B", misses: 2 },
      { habitId: "a", name: "Habit A", misses: 1 },
    ]);
  });

  it("compares today with the average of the previous recorded days once calibrated", () => {
    // Today = 0.5. Previous six recorded ratios average 5/6, so the delta is -1/3.
    expect(model.calibration.isCalibrated).toBe(true);
    expect(model.deltaVsAverage7).toBeCloseTo(-1 / 3, 10);
  });

  it("keeps the 7-day average hidden during calibration", () => {
    const short = buildDashboard(HABITS, WEEK.slice(-3), "2026-10-07");
    expect(short.calibration.isCalibrated).toBe(false);
    expect(short.deltaVsAverage7).toBeNull();
  });

  it("requires the today entry to exist", () => {
    expect(() => buildDashboard(HABITS, WEEK, "2026-10-08")).toThrow(/today/);
  });
});
