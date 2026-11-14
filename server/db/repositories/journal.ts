import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Tx } from "@/lib/db/tx";
import { journalEntries, timeBlocks } from "@/lib/db/schema";

export type JournalRow = typeof journalEntries.$inferSelect;

export async function insertJournalEntry(
  tx: Tx,
  row: Pick<JournalRow, "userId" | "logDate" | "kind" | "title" | "body">,
): Promise<string> {
  const [inserted] = await tx
    .insert(journalEntries)
    .values(row)
    .returning({ id: journalEntries.id });
  if (!inserted) throw new Error("insertJournalEntry: no row returned");
  return inserted.id;
}

export async function listJournalForDate(
  tx: Tx,
  userId: string,
  logDate: string,
): Promise<JournalRow[]> {
  return tx
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.logDate, logDate),
        isNull(journalEntries.deletedAt),
      ),
    )
    .orderBy(asc(journalEntries.createdAt));
}

export async function softDeleteJournalEntry(
  tx: Tx,
  userId: string,
  entryId: string,
): Promise<boolean> {
  const updated = await tx
    .update(journalEntries)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.id, entryId),
        isNull(journalEntries.deletedAt),
      ),
    )
    .returning({ id: journalEntries.id });
  return updated.length === 1;
}

/** Created-at timestamps of active LEARNING entries, used for the late-entry flag. */
export async function listLearningEntries(
  tx: Tx,
  userId: string,
): Promise<{ logDate: string; createdAt: Date }[]> {
  return tx
    .select({ logDate: journalEntries.logDate, createdAt: journalEntries.createdAt })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.kind, "LEARNING"),
        isNull(journalEntries.deletedAt),
      ),
    );
}

/** Distinct logical dates that have at least one active LEARNING time block. */
export async function listLearningBlockDates(tx: Tx, userId: string): Promise<string[]> {
  const rows = await tx
    .selectDistinct({ logDate: timeBlocks.logDate })
    .from(timeBlocks)
    .where(
      and(
        eq(timeBlocks.userId, userId),
        eq(timeBlocks.category, "LEARNING"),
        isNull(timeBlocks.deletedAt),
      ),
    );
  return rows.map((row) => row.logDate);
}
