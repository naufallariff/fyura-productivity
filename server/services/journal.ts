import "server-only";
import { withUser } from "@/lib/db/tx";
import {
  insertJournalEntry,
  listJournalForDate,
  listLearningBlockDates,
  listLearningEntries,
  softDeleteJournalEntry,
} from "@/lib/db/repositories/journal";
import { DomainError } from "./errors";
import { CreateJournalInput } from "@/lib/validation/journal";
import {
  bestStreak,
  currentStreak,
  fireLevel,
  isLateEntry,
  type FireLevel,
  type LearningDay,
} from "@/lib/scoring/streak";
import { localIsoDate } from "@/lib/time/local-date";

export async function createJournalEntry(userId: string, input: unknown): Promise<string> {
  const parsed = parse(CreateJournalInput, input);
  return withUser(userId, (tx) =>
    insertJournalEntry(tx, {
      userId,
      logDate: parsed.logDate,
      kind: parsed.kind,
      title: parsed.title.length > 0 ? parsed.title : null,
      body: parsed.body,
    }),
  );
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  await withUser(userId, async (tx) => {
    const removed = await softDeleteJournalEntry(tx, userId, entryId);
    if (!removed) throw new DomainError("NOT_FOUND", "Journal entry not found");
  });
}

export async function getJournalForDate(userId: string, logDate: string) {
  return withUser(userId, (tx) => listJournalForDate(tx, userId, logDate));
}

export interface LearningStreakView {
  current: number;
  best: number;
  level: FireLevel;
  todayComplete: boolean;
  /** Complete days whose LEARNING entry was written more than one day after its date. */
  lateDays: number;
}

/**
 * A learning day is complete when it has both a LEARNING block and a LEARNING
 * journal entry on the same logical date. Streaks are counted by log date,
 * not by when the entry was typed.
 */
export async function getLearningStreak(
  userId: string,
  today: string,
  timeZone: string,
): Promise<LearningStreakView> {
  return withUser(userId, async (tx) => {
    const [blockDates, entries] = await Promise.all([
      listLearningBlockDates(tx, userId),
      listLearningEntries(tx, userId),
    ]);

    const blockSet = new Set(blockDates);
    const lateByDate = new Map<string, boolean>();
    for (const entry of entries) {
      const enteredOn = localIsoDate(entry.createdAt, timeZone);
      const late = isLateEntry(entry.logDate, enteredOn);
      lateByDate.set(entry.logDate, (lateByDate.get(entry.logDate) ?? false) || late);
    }

    const dates = new Set([...blockSet, ...lateByDate.keys()]);
    const days: LearningDay[] = [...dates]
      .sort()
      .map((date) => ({ date, complete: blockSet.has(date) && lateByDate.has(date) }));

    const current = currentStreak(days, today);
    const lateDays = days.filter((d) => d.complete && lateByDate.get(d.date) === true).length;

    return {
      current,
      best: bestStreak(days),
      level: fireLevel(current),
      todayComplete: days.some((d) => d.date === today && d.complete),
      lateDays,
    };
  });
}

function parse<T>(schema: { parse: (value: unknown) => T }, value: unknown): T {
  try {
    return schema.parse(value);
  } catch {
    throw new DomainError("VALIDATION_FAILED", "Input is invalid");
  }
}
