import type { DayRecord, DayScore, DayStatus, HabitDefinition } from "./types";

const PRAYERS_PER_DAY = 5;

/**
 * Daily value for the five-prayer habit. It is 1 only when all five prayers
 * are performed. One missed prayer makes the day 0, as agreed.
 */
export function prayerDailyValue(performed: readonly boolean[]): number {
  if (performed.length !== PRAYERS_PER_DAY) {
    throw new Error(`Expected ${PRAYERS_PER_DAY} prayer flags, received ${performed.length}`);
  }
  return performed.every(Boolean) ? 1 : 0;
}

/** Habits planned for a day, by status. SICK plans nothing. */
export function plannedHabits(
  habits: readonly HabitDefinition[],
  status: DayStatus,
): HabitDefinition[] {
  return habits.filter((habit) => {
    if (!habit.active) return false;
    if (status === "NORMAL") return true;
    if (status === "SICK") return false;
    return habit.offDayCore;
  });
}

/** Completion of one habit on one day, from 0 to 1. Invalid or negative input counts as 0. */
export function habitCompletion(habit: HabitDefinition, actual: number): number {
  if (!Number.isFinite(actual) || actual <= 0) return 0;
  if (habit.kind === "BINARY") return actual >= 1 ? 1 : 0;
  if (habit.target <= 0) {
    throw new Error(`Habit ${habit.id} has a non-positive target`);
  }
  return Math.min(actual / habit.target, 1);
}

export function scoreDay(day: DayRecord, habits: readonly HabitDefinition[]): DayScore {
  const planned = plannedHabits(habits, day.status);

  if (planned.length === 0) {
    return { date: day.date, status: day.status, planned: 0, completed: 0, ratio: null };
  }

  let completed = 0;
  for (const habit of planned) {
    completed += habitCompletion(habit, day.inputs[habit.id] ?? 0);
  }

  return {
    date: day.date,
    status: day.status,
    planned: planned.length,
    completed,
    ratio: completed / planned.length,
  };
}

/** Weekly consistency weighted by planned slots, not an average of daily averages. */
export function weeklyRatio(scores: readonly DayScore[]): number | null {
  const planned = scores.reduce((sum, s) => sum + s.planned, 0);
  if (planned === 0) return null;
  const completed = scores.reduce((sum, s) => sum + s.completed, 0);
  return completed / planned;
}
