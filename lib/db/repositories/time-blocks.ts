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

/** Soft-deletes a block and, when it is part of a midnight split, its sibling segments. */
export async function softDeleteBlockGroup(
  tx: Tx,
  userId: string,
  blockId: string,
): Promise<number> {
  const [target] = await tx
    .select({ splitGroupId: timeBlocks.splitGroupId })
    .from(timeBlocks)
    .where(
      and(eq(timeBlocks.userId, userId), eq(timeBlocks.id, blockId), isNull(timeBlocks.deletedAt)),
    )
    .limit(1);
  if (!target) return 0;

  const scope = target.splitGroupId
    ? eq(timeBlocks.splitGroupId, target.splitGroupId)
    : eq(timeBlocks.id, blockId);

  const updated = await tx
    .update(timeBlocks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(timeBlocks.userId, userId), scope, isNull(timeBlocks.deletedAt)))
    .returning({ id: timeBlocks.id });
  return updated.length;
}

export async function findBlockById(
  tx: Tx,
  userId: string,
  blockId: string,
): Promise<TimeBlockRow | null> {
  const [row] = await tx
    .select()
    .from(timeBlocks)
    .where(
      and(eq(timeBlocks.userId, userId), eq(timeBlocks.id, blockId), isNull(timeBlocks.deletedAt)),
    )
    .limit(1);
  return row ?? null;
}

export async function updateBlockTiming(
  tx: Tx,
  userId: string,
  blockId: string,
  startMinute: number,
  endMinute: number,
): Promise<void> {
  await tx
    .update(timeBlocks)
    .set({ startMinute, endMinute, updatedAt: new Date() })
    .where(and(eq(timeBlocks.userId, userId), eq(timeBlocks.id, blockId)));
}
