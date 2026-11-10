import { addDays, assertIsoDate } from "./logical-date";

export const MINUTES_PER_DAY = 1440;

export interface BlockSegment {
  logDate: string;
  startMinute: number;
  endMinute: number;
}

/**
 * Splits a block that starts on `logDate` at `startMinute` and lasts `durationMinutes`.
 * A block that crosses midnight becomes two segments, one per logical day.
 * Each segment is stored under the day it belongs to, so each day's score stays independent.
 */
export function splitBlock(
  logDate: string,
  startMinute: number,
  durationMinutes: number,
): BlockSegment[] {
  assertIsoDate(logDate);
  if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute >= MINUTES_PER_DAY) {
    throw new Error(`startMinute must be an integer from 0 to 1439: ${startMinute}`);
  }
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > MINUTES_PER_DAY
  ) {
    throw new Error(`durationMinutes must be an integer from 1 to 1440: ${durationMinutes}`);
  }

  const end = startMinute + durationMinutes;
  if (end <= MINUTES_PER_DAY) {
    return [{ logDate, startMinute, endMinute: end }];
  }

  return [
    { logDate, startMinute, endMinute: MINUTES_PER_DAY },
    { logDate: addDays(logDate, 1), startMinute: 0, endMinute: end - MINUTES_PER_DAY },
  ];
}
