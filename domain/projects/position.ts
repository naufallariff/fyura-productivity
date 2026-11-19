// domain/projects/position.ts
/** Spacing between positions after a respace. Leaves room for many insertions. */
export const POSITION_STEP = 1024;

/** Gaps at or below this value trigger a respace of the whole list. */
export const MIN_GAP = 1e-6;

/**
 * Position for an item placed between two neighbours. A null neighbour means
 * "no item on that side". Returns null when the gap is too small, so the caller
 * must respace the list and try again.
 */
export function positionBetween(before: number | null, after: number | null): number | null {
  if (before === null && after === null) return POSITION_STEP;
  if (before === null) return after === null ? POSITION_STEP : after - POSITION_STEP;
  if (after === null) return before + POSITION_STEP;
  if (after <= before) return null;
  if (after - before <= MIN_GAP) return null;
  return before + (after - before) / 2;
}

/** Evenly spaced positions for count items, in order. */
export function respacedPositions(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index + 1) * POSITION_STEP);
}
