// server/services/journal.ts
import "server-only";
import { withUser } from "@/server/db/tx";
import {
  insertJournalEntry,
  listJournalForDate,
  listLearningBlockDates,
  listLearningEntries,
  softDeleteJournalEntry,
} from "@/server/db/repositories/journal";
import { CreateJournalInput, DeleteJournalInput } from "@/server/validation/journal";
import type { JournalKind } from "@/domain/journal/kinds";
import {
  bestStreak,
  currentStreak,
  fireLevel,
  isLateEntry,
  type FireLevel,
  type LearningDay,
} from "@/domain/scoring/streak";
import { localIsoDate } from "@/domain/time/local-date";
import { DomainError } from "@/server/services/errors";
import { parse } from "@/server/services/parse";
import { readTimeZone } from "@/server/services/user";

export interface JournalEntryDto {
  readonly id: string;
  readonly logDate: string;
  readonly kind: JournalKind;
  readonly title: string | null;
  readonly body: string;
  readonly createdAt: string;
  /** True when the entry was written more than one day after its log date. Marked, never rejected. */
  readonly late: boolean;
}

export interface LearningStreakView {
  readonly current: number;
  readonly best: number;
  readonly level: FireLevel;
  readonly todayComplete: boolean;
  /** Complete days whose LEARNING entry was written more than one day after its date. */
  readonly lateDays: number;
}

/** Entries of one day, optionally filtered by kind. A day is small, so no pagination. */
export async function listJournalDay(
  userId: string,
  logDate: string,
  kind?: JournalKind,
): Promise<JournalEntryDto[]> {
  return withUser(userId, async (tx) => {
    const timeZone = await readTimeZone(tx, userId);
    const rows = await listJournalForDate(tx, userId, logDate);
    return rows
      .filter((row) => kind === undefined || row.kind === kind)
      .map((row) => ({
        id: row.id,
        logDate: row.logDate,
        kind: row.kind as JournalKind,
        title: row.title,
        body: row.body,
        createdAt: row.createdAt.toISOString(),
        late: isLateEntry(row.logDate, localIsoDate(row.createdAt, timeZone)),
      }));
  });
}

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

export async function deleteJournalEntry(userId: string, input: unknown): Promise<void> {
  const parsed = parse(DeleteJournalInput, input);
  await withUser(userId, async (tx) => {
    const removed = await softDeleteJournalEntry(tx, userId, parsed.entryId);
    if (!removed) throw new DomainError("NOT_FOUND", "Journal entry not found");
  });
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
    const lateDays = days.filter((day) => day.complete && lateByDate.get(day.date) === true).length;

    return {
      current,
      best: bestStreak(days),
      level: fireLevel(current),
      todayComplete: days.some((day) => day.date === today && day.complete),
      lateDays,
    };
  });
}
