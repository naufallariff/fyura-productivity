export interface Positioned {
  readonly weekday: number;
  readonly position: number;
}

/** Items of one weekday in display order. The input array is not mutated. */
export function itemsForWeekday<T extends Positioned>(items: readonly T[], weekday: number): T[] {
  return items.filter((item) => item.weekday === weekday).sort((a, b) => a.position - b.position);
}

/** The stored done state for a toggle. Completion time is set only when the item is done. */
export function doneState(done: boolean, now: Date): { isDone: boolean; doneAt: Date | null } {
  return done ? { isDone: true, doneAt: now } : { isDone: false, doneAt: null };
}
