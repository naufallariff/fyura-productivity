import { MEASURED_CATEGORIES, type MeasuredCategory } from "./types";

export type MinutesByCategory = Partial<Record<MeasuredCategory, number>>;

/**
 * Balance = 1 - (1/2) * sum(|p_k - q_k|), over measured categories only.
 * p = actual share of minutes, q = planned share. Returns null when either side has no minutes.
 * Context categories (rest, social, leisure) are excluded by design.
 */
export function balanceScore(actual: MinutesByCategory, planned: MinutesByCategory): number | null {
  const actualShares = toShares(actual);
  const plannedShares = toShares(planned);
  if (actualShares === null || plannedShares === null) return null;

  let distance = 0;
  for (const category of MEASURED_CATEGORIES) {
    distance += Math.abs((actualShares[category] ?? 0) - (plannedShares[category] ?? 0));
  }
  return 1 - distance / 2;
}

function toShares(minutes: MinutesByCategory): Partial<Record<MeasuredCategory, number>> | null {
  let total = 0;
  for (const category of MEASURED_CATEGORIES) {
    const value = minutes[category] ?? 0;
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid minutes for ${category}: ${value}`);
    }
    total += value;
  }
  if (total === 0) return null;

  const shares: Partial<Record<MeasuredCategory, number>> = {};
  for (const category of MEASURED_CATEGORIES) {
    shares[category] = (minutes[category] ?? 0) / total;
  }
  return shares;
}
