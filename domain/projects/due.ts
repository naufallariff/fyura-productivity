// domain/projects/due.ts
export type DueState = "none" | "complete" | "overdue" | "today" | "upcoming";

/** Due state of a card. Dates are ISO strings, so string comparison is date comparison. */
export function dueState(dueOn: string | null, complete: boolean, today: string): DueState {
  if (dueOn === null) return "none";
  if (complete) return "complete";
  if (dueOn < today) return "overdue";
  if (dueOn === today) return "today";
  return "upcoming";
}
