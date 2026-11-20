// domain/career/activity.ts
export const ACTIVITY_KINDS = [
  "APPLY",
  "FOLLOW_UP",
  "NETWORKING",
  "REMOTE_COMMUNITY",
  "OTHER",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Upper bound for one kind on one day. Matches the database check. */
export const MAX_DAILY_COUNT = 1000;

export function isActivityKind(value: string): value is ActivityKind {
  return (ACTIVITY_KINDS as readonly string[]).includes(value);
}

/** Keeps a daily count inside 0 to MAX_DAILY_COUNT. Fractions are dropped. */
export function clampCount(value: number): number {
  return Math.min(MAX_DAILY_COUNT, Math.max(0, Math.trunc(value)));
}

/** Sums rows by kind. Unknown kinds are ignored, so a bad row cannot break a total. */
export function totalsByKind(
  rows: ReadonlyArray<{ readonly kind: string; readonly count: number }>,
): Record<ActivityKind, number> {
  const totals = Object.fromEntries(ACTIVITY_KINDS.map((kind) => [kind, 0])) as Record<
    ActivityKind,
    number
  >;
  for (const row of rows) {
    if (isActivityKind(row.kind)) totals[row.kind] += row.count;
  }
  return totals;
}

export function asActivityKind(value: string): ActivityKind {
  if (!isActivityKind(value)) throw new RangeError(`Unknown activity kind: ${value}`);
  return value;
}
