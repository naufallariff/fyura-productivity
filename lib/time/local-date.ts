import { assertIsoDate } from "./logical-date";

/** The calendar date (YYYY-MM-DD) of an instant in the given IANA timezone. */
export function localIsoDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function isValidIsoDate(value: string): boolean {
  try {
    assertIsoDate(value);
    return true;
  } catch {
    return false;
  }
}
