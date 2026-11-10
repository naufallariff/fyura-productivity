export const DAY_STATUSES = ["NORMAL", "SICK", "FLEXIBLE", "OFF"] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];

export const MEASURED_CATEGORIES = ["WORSHIP", "LEARNING", "WORK", "CAREER", "FITNESS"] as const;
export type MeasuredCategory = (typeof MEASURED_CATEGORIES)[number];

export const CONTEXT_CATEGORIES = ["REST", "SOCIAL", "LEISURE"] as const;
export type ContextCategory = (typeof CONTEXT_CATEGORIES)[number];

export type Category = MeasuredCategory | ContextCategory;

export type HabitKind = "BINARY" | "QUANTITY";

export interface HabitDefinition {
  id: string;
  category: Category;
  kind: HabitKind;
  /** QUANTITY: units that make the habit complete for one day. Ignored for BINARY. */
  target: number;
  active: boolean;
  /** Planned on FLEXIBLE and OFF days. NORMAL days plan every active habit. */
  offDayCore: boolean;
}

export interface DayRecord {
  /** Logical date, YYYY-MM-DD. */
  date: string;
  status: DayStatus;
  /** Actual value per habit id. A missing key counts as 0 (not performed). */
  inputs: Readonly<Record<string, number>>;
}

export interface DayScore {
  date: string;
  status: DayStatus;
  planned: number;
  completed: number;
  /** completed / planned. Null when nothing is planned, so the day is excluded from averages. */
  ratio: number | null;
}
