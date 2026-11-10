import { addDays, assertIsoDate, daysBetween } from "@/lib/time/logical-date";

export interface LearningDay {
  /** Logical date of the entry (log_date), not the time it was typed. */
  date: string;
  /** True when a learning block exists and a LEARNING journal entry exists for the same date. */
  complete: boolean;
}

/**
 * Current streak counted backwards from today when today is complete,
 * otherwise from yesterday. An incomplete today does not break the streak yet.
 */
export function currentStreak(days: readonly LearningDay[], today: string): number {
  assertIsoDate(today);
  const complete = completeDates(days);
  let cursor = complete.has(today) ? today : addDays(today, -1);

  let count = 0;
  while (complete.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Longest run of consecutive complete days ever recorded. */
export function bestStreak(days: readonly LearningDay[]): number {
  const dates = [...completeDates(days)].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of dates) {
    run = previous !== null && daysBetween(previous, date) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

export type FireLevel = "ember" | "kindle" | "blaze" | "inferno" | "core";

/** Level from streak length. The fire never turns black: zero is the lowest level. */
export function fireLevel(streak: number): FireLevel {
  if (!Number.isInteger(streak) || streak < 0) {
    throw new Error(`Streak must be a non-negative integer: ${streak}`);
  }
  if (streak >= 90) return "core";
  if (streak >= 30) return "inferno";
  if (streak >= 7) return "blaze";
  if (streak >= 1) return "kindle";
  return "ember";
}

/** True when an entry was written more than one day after its logical date. */
export function isLateEntry(logDate: string, enteredOn: string): boolean {
  return daysBetween(logDate, enteredOn) > 1;
}

function completeDates(days: readonly LearningDay[]): Set<string> {
  const set = new Set<string>();
  for (const day of days) {
    assertIsoDate(day.date);
    if (day.complete) set.add(day.date);
  }
  return set;
}
