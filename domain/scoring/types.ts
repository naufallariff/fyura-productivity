export const DAY_STATUSES = ["NORMAL", "SICK", "FLEXIBLE", "OFF"] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];

export const MEASURED_CATEGORIES = ["WORSHIP", "LEARNING", "WORK", "CAREER", "FITNESS"] as const;
export type MeasuredCategory = (typeof MEASURED_CATEGORIES)[number];

export const CONTEXT_CATEGORIES = ["REST", "SOCIAL", "LEISURE"] as const;
export type ContextCategory = (typeof CONTEXT_CATEGORIES)[number];

export type Category = MeasuredCategory | ContextCategory;

/** One scored day. Shared by the trend and warm-up modules. */
export interface DayScore {
  readonly date: string;
  readonly status: DayStatus;
  readonly planned: number;
  readonly completed: number;
  /** Null when nothing is planned, so the day is excluded from averages. */
  readonly ratio: number | null;
}
