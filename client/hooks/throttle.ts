/**
 * Leading-edge throttle. Calls inside the wait window are dropped, not queued.
 * Returns true when the call ran. Pure, so it can be tested with a fake clock.
 */
export function createThrottle<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
  now: () => number = Date.now,
): (...args: A) => boolean {
  let last = Number.NEGATIVE_INFINITY;
  return (...args: A) => {
    const current = now();
    if (current - last < waitMs) return false;
    last = current;
    fn(...args);
    return true;
  };
}
