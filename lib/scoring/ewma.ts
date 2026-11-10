import type { DayScore } from "./types";

export const EWMA_ALPHA = 0.25;

export interface TrendPoint {
  date: string;
  ratio: number;
  ewma: number;
}

/**
 * E_1 = R_1. Then E_t = alpha * R_t + (1 - alpha) * E_(t-1).
 * Days with no planned habits are skipped and do not move the trend.
 * Input must be sorted by date ascending.
 */
export function computeTrend(scores: readonly DayScore[]): TrendPoint[] {
  const points: TrendPoint[] = [];
  let previous: number | null = null;
  let lastDate = "";

  for (const score of scores) {
    if (score.date <= lastDate) {
      throw new Error(`Scores must be strictly ascending by date: ${score.date}`);
    }
    lastDate = score.date;

    if (score.ratio === null) continue;

    const ewma: number =
      previous === null ? score.ratio : EWMA_ALPHA * score.ratio + (1 - EWMA_ALPHA) * previous;

    points.push({ date: score.date, ratio: score.ratio, ewma });
    previous = ewma;
  }

  return points;
}
