import { habitCompletion, plannedHabits, scoreDay, weeklyRatio } from "./daily";
import { computeTrend, type TrendPoint } from "./ewma";
import { calibrationState, type CalibrationState } from "./warmup";
import type { DayRecord, DayScore, HabitDefinition } from "./types";
import { addDays } from "@/lib/time/logical-date";

export type NamedHabit = HabitDefinition & { name: string };

export interface MissedHabit {
  habitId: string;
  name: string;
  misses: number;
}

export interface DashboardModel {
  today: DayScore;
  trend: TrendPoint[];
  calibration: CalibrationState;
  week: { ratio: number | null; recorded: number; flexible: number };
  priorWeekRatio: number | null;
  /** E_t minus E_(t-1). Null until both days are recorded. */
  deltaVsYesterday: number | null;
  /** Today's ratio minus the average of up to the previous 7 recorded ratios. Gated by calibration. */
  deltaVsAverage7: number | null;
  mostMissed: MissedHabit[];
}

const WEEK_DAYS = 7;
const TOP_MISSED = 3;

/**
 * Builds the dashboard view model from scoring input.
 * `days` must be sorted ascending and end on `today`. At least 14 days are needed for last-week comparison.
 */
export function buildDashboard(
  habits: NamedHabit[],
  days: DayRecord[],
  today: string,
): DashboardModel {
  const scores = days.map((day) => scoreDay(day, habits));
  const trend = computeTrend(scores);
  const calibration = calibrationState(scores);

  const weekStart = addDays(today, -(WEEK_DAYS - 1));
  const priorStart = addDays(today, -(2 * WEEK_DAYS - 1));
  const priorEnd = addDays(today, -WEEK_DAYS);
  const inWindow = (date: string, from: string, to: string) => date >= from && date <= to;

  const weekScores = scores.filter((s) => inWindow(s.date, weekStart, today));
  const priorScores = scores.filter((s) => inWindow(s.date, priorStart, priorEnd));
  const weekDays = days.filter((d) => inWindow(d.date, weekStart, today));

  const todayScore = scores.find((s) => s.date === today);
  if (!todayScore) throw new Error("buildDashboard: today is missing from the input days");

  const last = trend.at(-1);
  const previous = trend.at(-2);
  const deltaVsYesterday =
    last && previous && last.date === today && previous.date === addDays(today, -1)
      ? last.ewma - previous.ewma
      : null;

  let deltaVsAverage7: number | null = null;
  if (calibration.isCalibrated && todayScore.ratio !== null) {
    const earlier = trend.filter((p) => p.date < today).slice(-WEEK_DAYS);
    if (earlier.length > 0) {
      const average = earlier.reduce((sum, p) => sum + p.ratio, 0) / earlier.length;
      deltaVsAverage7 = todayScore.ratio - average;
    }
  }

  const misses = new Map<string, number>();
  for (const day of weekDays) {
    for (const habit of plannedHabits(habits, day.status)) {
      if (habitCompletion(habit, day.inputs[habit.id] ?? 0) < 1) {
        misses.set(habit.id, (misses.get(habit.id) ?? 0) + 1);
      }
    }
  }
  const mostMissed: MissedHabit[] = [...misses.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_MISSED)
    .map(([habitId, count]) => ({
      habitId,
      name: habits.find((h) => h.id === habitId)?.name ?? "",
      misses: count,
    }));

  return {
    today: todayScore,
    trend,
    calibration,
    week: {
      ratio: weeklyRatio(weekScores),
      recorded: weekScores.filter((s) => s.ratio !== null).length,
      flexible: weekDays.filter((d) => d.status === "FLEXIBLE").length,
    },
    priorWeekRatio: weeklyRatio(priorScores),
    deltaVsYesterday,
    deltaVsAverage7,
    mostMissed,
  };
}
