import { describe, expect, it } from "vitest";
import { INITIAL_SM2_STATE, nextSm2State, toQuality } from "@/domain/learning/sm2";

describe("nextSm2State", () => {
  it("follows the 1, 6, then interval times EF sequence on good answers", () => {
    const first = nextSm2State(INITIAL_SM2_STATE, 5);
    expect(first.repetitions).toBe(1);
    expect(first.intervalDays).toBe(1);
    expect(first.ef).toBeCloseTo(2.6, 10);

    const second = nextSm2State(first, 5);
    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(6);
    expect(second.ef).toBeCloseTo(2.7, 10);

    const third = nextSm2State(second, 5);
    expect(third.repetitions).toBe(3);
    expect(third.ef).toBeCloseTo(2.8, 10);
    expect(third.intervalDays).toBe(17);
  });

  it("restarts the sequence on a failed answer", () => {
    const state = { ef: 2.5, intervalDays: 6, repetitions: 2 };
    const next = nextSm2State(state, toQuality(2));
    expect(next.repetitions).toBe(0);
    expect(next.intervalDays).toBe(1);
    expect(next.ef).toBeCloseTo(2.18, 10);
  });

  it("lowers EF on a blackout answer, but never below 1.3", () => {
    const once = nextSm2State(INITIAL_SM2_STATE, toQuality(0));
    expect(once.ef).toBeCloseTo(1.7, 10);

    const twice = nextSm2State(once, toQuality(0));
    expect(twice.ef).toBe(1.3);
  });
});

describe("toQuality", () => {
  it("accepts 0 to 5 and rejects everything else", () => {
    expect(toQuality(5)).toBe(5);
    expect(() => toQuality(6)).toThrow(RangeError);
    expect(() => toQuality(2.5)).toThrow(RangeError);
  });
});
