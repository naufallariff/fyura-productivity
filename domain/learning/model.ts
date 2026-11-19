// domain/learning/model.ts
export const SUBJECT_KINDS = ["STUDY", "LANGUAGE", "FAITH"] as const;
export const SUBJECT_STATUSES = ["QUEUED", "ACTIVE", "ARCHIVED"] as const;
export const ITEM_KINDS = ["BOOK", "COURSE", "RESEARCH"] as const;
export const ITEM_STATUSES = ["QUEUED", "ACTIVE", "DONE", "ARCHIVED"] as const;

export type SubjectStatus = (typeof SUBJECT_STATUSES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];

/**
 * Work-in-progress policy for learning subjects, following the Kanban practice of an
 * explicit, visible limit. It is soft: going over it shows a warning and never blocks.
 * The limit counts all ACTIVE subjects at the moment of activation, with no time window.
 * Change this one number to adjust the policy.
 */
export const WIP_LIMIT = 3;

export const MAX_UNITS = 100_000;
export const MAX_MINUTES_PER_DAY = 1440;

/** True when one more active subject would go beyond the limit. Pass the count before saving. */
export function wipExceeded(activeCount: number): boolean {
  return activeCount >= WIP_LIMIT;
}

/** True when completed units are more than the total. A null total means open-ended. */
export function exceedsTotal(completed: number, total: number | null): boolean {
  return total !== null && completed > total;
}
