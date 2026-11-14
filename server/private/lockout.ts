export const MAX_ATTEMPTS_BEFORE_LOCK = 5;
const BASE_LOCK_MS = 5 * 60_000;
const MAX_LOCK_MS = 60 * 60_000;

/**
 * Returns the time the lock ends, or null if the account is not locked.
 * 5 failures: 5 min. 6: 10 min. 7: 20 min. Capped at 60 min.
 */
export function computeLockUntil(failedAttempts: number, now: Date): Date | null {
  if (failedAttempts < MAX_ATTEMPTS_BEFORE_LOCK) return null;
  const steps = failedAttempts - MAX_ATTEMPTS_BEFORE_LOCK;
  const duration = Math.min(BASE_LOCK_MS * 2 ** steps, MAX_LOCK_MS);
  return new Date(now.getTime() + duration);
}
