"use client";

import { useCallback, useEffect, useRef } from "react";
import { createThrottle } from "./throttle";

/**
 * Throttles a callback. Refs are read only inside effects and event handlers,
 * never during render. Calls that arrive before the first effect runs are dropped,
 * which cannot happen in practice because no user input arrives that early.
 */
export function useThrottledCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
): (...args: A) => boolean {
  const latest = useRef(fn);
  const throttled = useRef<((...args: A) => boolean) | null>(null);

  useEffect(() => {
    latest.current = fn;
  }, [fn]);

  useEffect(() => {
    throttled.current = createThrottle((...args: A) => latest.current(...args), waitMs);
    return () => {
      throttled.current = null;
    };
  }, [waitMs]);

  return useCallback((...args: A) => throttled.current?.(...args) ?? false, []);
}
