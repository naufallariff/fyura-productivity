// domain/career/status.ts
import { daysBetween } from "@/domain/time/logical-date";

export const JOB_STATUSES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
  "WITHDRAWN",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Statuses where the application is still in progress. */
export const OPEN_STATUSES: readonly JobStatus[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"];

/** Days without a status change after which an open job needs a follow-up. */
export const FOLLOW_UP_AFTER_DAYS = 7;

export function isJobStatus(value: string): value is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value);
}

/** Narrows a stored value to a status. Throws on anything unexpected, because the database constraint should prevent it. */
export function asJobStatus(value: string): JobStatus {
  if (!isJobStatus(value)) throw new RangeError(`Unknown job status: ${value}`);
  return value;
}

export function isOpen(status: JobStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

/**
 * An open job needs attention when its status has not changed for FOLLOW_UP_AFTER_DAYS.
 * Dates are ISO calendar dates in the user's time zone.
 */
export function needsFollowUp(status: JobStatus, lastChangedOn: string, today: string): boolean {
  if (!isOpen(status)) return false;
  return daysBetween(lastChangedOn, today) >= FOLLOW_UP_AFTER_DAYS;
}
