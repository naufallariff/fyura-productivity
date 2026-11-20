import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { checklistEntries } from "@/server/db/schema";

export type ChecklistRow = typeof checklistEntries.$inferSelect;
export type NewChecklistRow = typeof checklistEntries.$inferInsert;

export async function listChecklistForDate(
  tx: Tx,
  userId: string,
  logDate: string,
): Promise<ChecklistRow[]> {
  return tx
    .select()
    .from(checklistEntries)
    .where(and(eq(checklistEntries.userId, userId), eq(checklistEntries.logDate, logDate)))
    .orderBy(asc(checklistEntries.position));
}

export async function listChecklistInRange(
  tx: Tx,
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<ChecklistRow[]> {
  return tx
    .select()
    .from(checklistEntries)
    .where(
      and(
        eq(checklistEntries.userId, userId),
        gte(checklistEntries.logDate, fromDate),
        lte(checklistEntries.logDate, toDate),
      ),
    );
}

/**
 * Copies a day's items. A row that already exists for the same source is skipped,
 * so two first taps on the same day cannot write the snapshot twice.
 */
export async function insertSnapshot(tx: Tx, rows: NewChecklistRow[]): Promise<void> {
  if (rows.length === 0) return;
  await tx
    .insert(checklistEntries)
    .values(rows)
    .onConflictDoNothing({
      target: [checklistEntries.userId, checklistEntries.logDate, checklistEntries.sourceItemId],
    });
}

export async function setItemDone(
  tx: Tx,
  userId: string,
  logDate: string,
  sourceItemId: string,
  isDone: boolean,
  doneAt: Date | null,
): Promise<boolean> {
  const updated = await tx
    .update(checklistEntries)
    .set({ isDone, doneAt, updatedAt: new Date() })
    .where(
      and(
        eq(checklistEntries.userId, userId),
        eq(checklistEntries.logDate, logDate),
        eq(checklistEntries.sourceItemId, sourceItemId),
      ),
    )
    .returning({ id: checklistEntries.id });
  return updated.length === 1;
}
