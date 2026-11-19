// domain/learning/model.ts
export const SUBJECT_KINDS = ["STUDY", "LANGUAGE", "FAITH"] as const;
export const SUBJECT_STATUSES = ["QUEUED", "ACTIVE", "ARCHIVED"] as const;
export const ITEM_KINDS = ["BOOK", "COURSE", "RESEARCH"] as const;
export const ITEM_STATUSES = ["QUEUED", "ACTIVE", "DONE", "ARCHIVED"] as const;

export type SubjectStatus = (typeof SUBJECT_STATUSES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** Soft limit on subjects in ACTIVE status. Going over it warns and never blocks. */
export const WIP_LIMIT = 1;

export const MAX_UNITS = 100_000;
export const MAX_MINUTES_PER_DAY = 1440;

/** True when activating one more subject would go beyond the soft limit. */
export function wipExceeded(activeCount: number): boolean {
  return activeCount >= WIP_LIMIT;
}

/** True when completed units are more than the total. A null total means open-ended. */
export function exceedsTotal(completed: number, total: number | null): boolean {
  return total !== null && completed > total;
}
