import { describe, expect, it } from "vitest";
import { createThrottle } from "@/client/hooks/throttle";

describe("createThrottle", () => {
  it("drops calls inside the wait window and accepts them after it", () => {
    let clock = 0;
    const calls: number[] = [];
    const throttled = createThrottle(
      (value: number) => calls.push(value),
      300,
      () => clock,
    );

    expect(throttled(1)).toBe(true);
    clock = 100;
    expect(throttled(2)).toBe(false);
    clock = 300;
    expect(throttled(3)).toBe(true);
    expect(calls).toEqual([1, 3]);
  });
});
