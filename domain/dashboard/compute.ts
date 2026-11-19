// domain/dashboard/compute.ts
// Pure helpers for dashboard figures. No database or framework imports.

/** Difference between two ratios in percentage points, rounded to one decimal. Null when either side is missing. */
export function deltaPoints(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  return Math.round((current - previous) * 1000) / 10;
}

/** Mean of the non-null ratios. Null when nothing was recorded. */
export function averageRatio(
  days: ReadonlyArray<{ readonly ratio: number | null }>,
): number | null {
  const values = days.map((day) => day.ratio).filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
