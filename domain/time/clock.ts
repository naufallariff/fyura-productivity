import { MINUTES_PER_DAY } from "./split-block";

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Parses "HH:MM" (24-hour) into minutes from midnight. Returns null for anything else. */
export function parseClock(value: string): number | null {
  const match = CLOCK.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Formats minutes from midnight as "HH:MM". 1440 is shown as "24:00" (end of day). */
export function formatMinute(minute: number): string {
  if (!Number.isInteger(minute) || minute < 0 || minute > MINUTES_PER_DAY) {
    throw new RangeError(`Minute out of range: ${minute}`);
  }
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
