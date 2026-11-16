import type { DayScore, DayStatus } from "./types";

export interface ChecklistEntry {
  /** Required items count toward the score. */
  readonly required: boolean;
  /** Core items also count on flexible and off days. */
  readonly core: boolean;
  readonly done: boolean;
}

/**
 * Score for one day from its checklist. Only required items are planned.
 * SICK plans nothing. FLEXIBLE and OFF plan only core items.
 */
export function scoreChecklistDay(
  date: string,
  status: DayStatus,
  entries: readonly ChecklistEntry[],
): DayScore {
  const planned = entries.filter((entry) => {
    if (!entry.required || status === "SICK") return false;
    return status === "NORMAL" ? true : entry.core;
  });
  const completed = planned.filter((entry) => entry.done).length;

  return {
    date,
    status,
    planned: planned.length,
    completed,
    ratio: planned.length === 0 ? null : completed / planned.length,
  };
}

/** Weekly score weighted by planned slots, not an average of daily averages. */
export function weeklyChecklistRatio(scores: readonly DayScore[]): number | null {
  const planned = scores.reduce((sum, score) => sum + score.planned, 0);
  if (planned === 0) return null;
  const completed = scores.reduce((sum, score) => sum + score.completed, 0);
  return completed / planned;
}
