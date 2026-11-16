// domain/time/week.ts
import { addDays, isoWeekday } from "./logical-date";

/** Monday-first list of the seven logical dates in the week that contains isoDate. */
export function weekOf(isoDate: string): string[] {
  const offset = isoWeekday(isoDate) - 1;
  const monday = addDays(isoDate, -offset);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}
