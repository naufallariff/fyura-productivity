import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Tx } from "@/lib/db/tx";
import { timeBlocks } from "@/lib/db/schema";

export type TimeBlockRow = typeof timeBlocks.$inferSelect;
export type NewTimeBlockRow = typeof timeBlocks.$inferInsert;

export async function listBlocksForDate(
  tx: Tx,
  userId: string,
  logDate: string,
): Promise<TimeBlockRow[]> {
  return tx
    .select()
    .from(timeBlocks)
    .where(
      and(
        eq(timeBlocks.userId, userId),
        eq(timeBlocks.logDate, logDate),
        isNull(timeBlocks.deletedAt),
      ),
    )
    .orderBy(asc(timeBlocks.startMinute));
}

export async function insertBlocks(tx: Tx, rows: NewTimeBlockRow[]): Promise<TimeBlockRow[]> {
  if (rows.length === 0) return [];
  return tx.insert(timeBlocks).values(rows).returning();
}

export async function softDeleteBlock(tx: Tx, userId: string, blockId: string): Promise<boolean> {
  const updated = await tx
    .update(timeBlocks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(timeBlocks.userId, userId), eq(timeBlocks.id, blockId), isNull(timeBlocks.deletedAt)),
    )
    .returning({ id: timeBlocks.id });
  return updated.length === 1;
}
