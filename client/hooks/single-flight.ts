/**
 * Runs at most one task at a time. Calls made while one is running receive the same promise.
 * Used for save buttons, so a double click cannot send two writes.
 */
export function createSingleFlight<A extends unknown[], R>(
  task: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  let inFlight: Promise<R> | null = null;

  return (...args: A) => {
    if (inFlight) return inFlight;
    inFlight = task(...args).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
