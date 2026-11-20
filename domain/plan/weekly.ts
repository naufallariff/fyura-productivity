export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Returns a new array with one item moved. The input is never mutated. */
export function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    throw new RangeError("Indexes must be integers");
  }
  if (from < 0 || from >= list.length) {
    throw new RangeError(`Index out of range: ${from}`);
  }

  const next = list.slice();
  const [moved] = next.splice(from, 1);
  if (moved === undefined) throw new RangeError(`Index out of range: ${from}`);

  // After removal the valid target range is 0 to next.length inclusive.
  if (to < 0 || to > next.length) {
    throw new RangeError(`Index out of range: ${to}`);
  }

  next.splice(to, 0, moved);
  return next;
}

/**
 * Weekday name for the locale. 2024-01-01 is a Monday, so the offset is fixed
 * and the result does not depend on the server clock or the user's time zone.
 */
export function weekdayLabel(weekday: Weekday, locale: string = "en"): string {
  const base = Date.UTC(2024, 0, weekday);
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(base),
  );
}
