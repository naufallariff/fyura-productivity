// domain/journal/kinds.ts
export const JOURNAL_KINDS = ["DAILY", "LEARNING", "ENGLISH", "COURSE", "FREE"] as const;
export type JournalKind = (typeof JOURNAL_KINDS)[number];
