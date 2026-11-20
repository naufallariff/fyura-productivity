// domain/learning/sm2.ts
// SM-2 spaced repetition (Woźniak, 1987). Pure functions, no framework imports.

export const SM2_DEFAULT_EF = 2.5;
export const SM2_MIN_EF = 1.3;
export const SM2_MAX_QUALITY = 5;

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface Sm2State {
  readonly ef: number;
  readonly intervalDays: number;
  readonly repetitions: number;
}

export const INITIAL_SM2_STATE: Sm2State = {
  ef: SM2_DEFAULT_EF,
  intervalDays: 0,
  repetitions: 0,
};

/** Narrows a number to a quality grade. Anything outside 0 to 5 is a programming error. */
export function toQuality(value: number): Quality {
  if (!Number.isInteger(value) || value < 0 || value > SM2_MAX_QUALITY) {
    throw new RangeError(`Quality must be an integer from 0 to 5: ${value}`);
  }
  return value as Quality;
}

/**
 * One review step. The easiness factor is updated on every review and never drops below
 * SM2_MIN_EF. A quality below 3 restarts the sequence (interval 1, repetitions 0).
 * Otherwise the interval is 1 day, then 6 days, then round(previous interval * new EF).
 */
export function nextSm2State(state: Sm2State, quality: Quality): Sm2State {
  const gap = 5 - quality;
  const ef = Math.max(SM2_MIN_EF, state.ef + (0.1 - gap * (0.08 + gap * 0.02)));

  if (quality < 3) return { ef, intervalDays: 1, repetitions: 0 };

  const repetitions = state.repetitions + 1;
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(state.intervalDays * ef);

  return { ef, intervalDays, repetitions };
}
