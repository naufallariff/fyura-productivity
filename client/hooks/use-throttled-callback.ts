"use client";

import { useEffect, useMemo, useRef } from "react";
import { createThrottle } from "./throttle";

export function useThrottledCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
): (...args: A) => boolean {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  }, [fn]);

  return useMemo(() => createThrottle((...args: A) => latest.current(...args), waitMs), [waitMs]);
}
