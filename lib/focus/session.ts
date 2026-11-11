export type FocusKind = "DEEP" | "LIGHT";

export const FOCUS_DURATIONS = [25, 50, 90] as const;
export type FocusDuration = (typeof FOCUS_DURATIONS)[number];

/** Remaining milliseconds from a fixed end timestamp. Never negative. */
export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now);
}

/** Whole minutes actually focused, floored. Pausing is not supported, so this is wall-clock time. */
export function elapsedMinutes(startedAt: number, endedAt: number): number {
  return Math.max(0, Math.floor((endedAt - startedAt) / 60_000));
}

/**
 * A DEEP session counts toward output only when it reached its planned length.
 * LIGHT sessions are recorded but never count toward deep work.
 */
export function countsAsDeepWork(kind: FocusKind, completed: boolean): boolean {
  return kind === "DEEP" && completed;
}

/** "mm:ss" for a remaining duration in milliseconds. */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Minute of the day (0 to 1439) in the given IANA timezone. */
export function minuteOfDayIn(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}
