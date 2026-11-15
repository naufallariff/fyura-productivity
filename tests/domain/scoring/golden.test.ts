import { describe, expect, it } from "vitest";
import { computeTrend } from "@/lib/scoring/ewma";
import { calibrationState } from "@/lib/scoring/warmup";
import { scoreDay, weeklyRatio } from "@/lib/scoring/daily";
import type { DayRecord, HabitDefinition } from "@/lib/scoring/types";

/*
 * Hand-calculated fixture. Habits:
 * - prayer: five daily prayers, binary, planned on off days.
 * - learning: binary, planned on off days.
 * - deep work: quantity, target 150 minutes, NOT planned on off days.
 * - quran: quantity, optional, planned on normal days only.
 */
const HABITS: HabitDefinition[] = [
  {
    id: "prayer_five_daily",
    category: "WORSHIP",
    kind: "BINARY",
    target: 1,
    active: true,
    offDayCore: true,
  },
  {
    id: "learning_daily",
    category: "LEARNING",
    kind: "BINARY",
    target: 1,
    active: true,
    offDayCore: true,
  },
  {
    id: "deep_work",
    category: "WORK",
    kind: "QUANTITY",
    target: 150,
    active: true,
    offDayCore: false,
  },
  {
    id: "quran",
    category: "WORSHIP",
    kind: "QUANTITY",
    target: 10,
    active: true,
    offDayCore: false,
  },
];

const DAYS: DayRecord[] = [
  // Day 1: prayers and learning done, deep work 0 of 150. 2 of 3 planned habits.
  {
    date: "2026-10-01",
    status: "NORMAL",
    inputs: { prayer_five_daily: 1, learning_daily: 1, deep_work: 0 },
  },
  // Day 2: everything planned. 3 of 3.
  {
    date: "2026-10-02",
    status: "NORMAL",
    inputs: { prayer_five_daily: 1, learning_daily: 1, deep_work: 150 },
  },
  // Day 3: sick. Excluded from every average.
  { date: "2026-10-03", status: "SICK", inputs: {} },
  // Day 4: off day. Only prayer and learning are planned. Deep work input is ignored.
  {
    date: "2026-10-04",
    status: "OFF",
    inputs: { prayer_five_daily: 1, learning_daily: 1, deep_work: 150, quran: 10 },
  },
  // Day 5: normal day, one prayer missed (binary 0), learning missed, quran done. 2 of 4.
  {
    date: "2026-10-05",
    status: "NORMAL",
    inputs: { prayer_five_daily: 0, learning_daily: 0, deep_work: 0, quran: 10 },
  },
];

describe("golden fixture", () => {
  const scores = DAYS.map((day) => scoreDay(day, HABITS));

  it("scores each day from the planned habits only", () => {
    expect(scores.map((s) => [s.planned, s.completed])).toEqual([
      [4, 2],
      [4, 3],
      [0, 0],
      [2, 2],
      [4, 1],
    ]);
    expect(scores[2]?.ratio).toBeNull();
  });

  it("computes the EWMA trend with E_1 = R_1 and alpha 0.25", () => {
    const trend = computeTrend(scores);
    expect(trend.map((p) => p.date)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-04",
      "2026-10-05",
    ]);
    expect(trend[0]?.ewma).toBeCloseTo(0.5, 10);
    expect(trend[1]?.ewma).toBeCloseTo(0.5625, 10);
    expect(trend[2]?.ewma).toBeCloseTo(0.671875, 10);
    expect(trend[3]?.ewma).toBeCloseTo(0.56640625, 10);
  });

  it("weights the weekly ratio by planned slots: 8 of 14", () => {
    expect(weeklyRatio(scores)).toBeCloseTo(8 / 14, 10);
  });

  it("keeps calibration active until seven recorded days exist", () => {
    const state = calibrationState(scores);
    expect(state.recordedDays).toBe(4);
    expect(state.isCalibrated).toBe(false);
  });

  it("rejects unsorted input to the trend", () => {
    const reversed = [...scores].reverse();
    expect(() => computeTrend(reversed)).toThrow(/ascending/);
  });
});

describe("habit rules", () => {
  it("counts a quantity habit proportionally and caps at 1", () => {
    const deep = HABITS[2]!;
    expect(
      scoreDay({ date: "2026-10-06", status: "NORMAL", inputs: { deep_work: 75 } }, [deep]).ratio,
    ).toBeCloseTo(0.5);
    expect(
      scoreDay({ date: "2026-10-06", status: "NORMAL", inputs: { deep_work: 999 } }, [deep]).ratio,
    ).toBe(1);
  });

  it("treats a blank input as zero, never as NaN", () => {
    const deep = HABITS[2]!;
    const score = scoreDay(
      { date: "2026-10-06", status: "NORMAL", inputs: { deep_work: Number.NaN } },
      [deep],
    );
    expect(score.ratio).toBe(0);
  });

  it("plans nothing on a sick day", () => {
    const score = scoreDay(
      { date: "2026-10-06", status: "SICK", inputs: { prayer_five_daily: 1 } },
      HABITS,
    );
    expect(score.planned).toBe(0);
    expect(score.ratio).toBeNull();
  });
});
