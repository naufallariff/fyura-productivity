export interface Interval {
  start: number;
  end: number;
}

/** Sorts and merges overlapping or touching intervals. Never mutates the input. */
export function mergeIntervals(list: readonly Interval[]): Interval[] {
  const sorted = [...list].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Interval[] = [];
  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (last && current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ start: current.start, end: current.end });
    }
  }
  return merged;
}

/**
 * Returns the unlogged stretches of a day that are at least `minLength` minutes long.
 * Shorter stretches are ignored, so the timeline does not fill with noise.
 */
export function findGaps(
  blocks: readonly Interval[],
  minLength: number,
  dayLength = 1440,
): Interval[] {
  if (minLength < 1) throw new RangeError("minLength must be at least 1");

  const gaps: Interval[] = [];
  let cursor = 0;
  for (const block of mergeIntervals(blocks)) {
    if (block.start - cursor >= minLength) gaps.push({ start: cursor, end: block.start });
    cursor = Math.max(cursor, block.end);
  }
  if (dayLength - cursor >= minLength) gaps.push({ start: cursor, end: dayLength });
  return gaps;
}
