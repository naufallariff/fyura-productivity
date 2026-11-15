export type Trend = "up" | "down" | "flat";
export type Meaning = "positive" | "negative" | "neutral";
export type GoodWhen = "higher" | "lower" | "neutral";

export interface DeltaResult {
  readonly trend: Trend;
  /** Null when the previous value is zero, because a percentage is undefined. */
  readonly percent: number | null;
  readonly meaning: Meaning;
  /** True when the base is too small for a meaningful percentage. */
  readonly smallBase: boolean;
}

export const SMALL_BASE = 5;

/**
 * Compares a value with its baseline. Colour follows meaning, not direction:
 * a rise in cost is negative when lower is better. Small bases stay neutral,
 * so a change from 1 to 0 never shows as a red minus 100 percent.
 */
export function computeDelta(
  current: number,
  previous: number | null,
  goodWhen: GoodWhen,
  smallBaseLimit: number = SMALL_BASE,
): DeltaResult | null {
  if (previous === null || !Number.isFinite(current) || !Number.isFinite(previous)) {
    return null;
  }

  const diff = current - previous;
  const trend: Trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const percent = previous === 0 ? null : diff / Math.abs(previous);
  const smallBase = Math.abs(previous) < smallBaseLimit;

  let meaning: Meaning = "neutral";
  if (!smallBase && trend !== "flat" && goodWhen !== "neutral") {
    const improved = goodWhen === "higher" ? trend === "up" : trend === "down";
    meaning = improved ? "positive" : "negative";
  }

  return { trend, percent, meaning, smallBase };
}
