import "server-only";
import { and, asc, eq, isNull, desc, gte, lte, sql } from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { timeBlocks } from "@/server/db/schema";

export type TimeBlockRow = typeof timeBlocks.$inferSelect;
export type NewTimeBlockRow = typeof timeBlocks.$inferInsert;

export interface HistoryFilters {
  readonly from?: string;
  readonly to?: string;
  readonly category?: string;
  readonly q?: string;
}

export interface HistoryCursor {
  readonly date: string;
  readonly minute: number;
  readonly id: string;
}

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
/** Soft-deletes a block and its midnight sibling. Returns the affected logical dates. */
export async function softDeleteBlockGroup(
  tx: Tx,
  userId: string,
  blockId: string,
): Promise<string[]> {
  const [target] = await tx
    .select({ splitGroupId: timeBlocks.splitGroupId })
    .from(timeBlocks)
    .where(
      and(eq(timeBlocks.userId, userId), eq(timeBlocks.id, blockId), isNull(timeBlocks.deletedAt)),
    )
    .limit(1);
  if (!target) return [];

  const scope = target.splitGroupId
    ? eq(timeBlocks.splitGroupId, target.splitGroupId)
    : eq(timeBlocks.id, blockId);

  const rows = await tx
    .update(timeBlocks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(timeBlocks.userId, userId), scope, isNull(timeBlocks.deletedAt)))
    .returning({ logDate: timeBlocks.logDate });

  return [...new Set(rows.map((row) => row.logDate))];
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

/** Escapes LIKE wildcards so search text is matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export async function listBlockHistory(
  tx: Tx,
  userId: string,
  filters: HistoryFilters,
  cursor: HistoryCursor | null,
  limit: number,
): Promise<TimeBlockRow[]> {
  const conditions = [eq(timeBlocks.userId, userId), isNull(timeBlocks.deletedAt)];

  if (filters.from) conditions.push(gte(timeBlocks.logDate, filters.from));
  if (filters.to) conditions.push(lte(timeBlocks.logDate, filters.to));
  if (filters.category) conditions.push(eq(timeBlocks.category, filters.category));
  if (filters.q) {
    conditions.push(sql`${timeBlocks.activity} ilike ${`%${escapeLike(filters.q)}%`}`);
  }
  // Explicit casts keep the row comparison typed. Parameters arrive as text otherwise.
  if (cursor) {
    conditions.push(
      sql`(${timeBlocks.logDate}, ${timeBlocks.startMinute}, ${timeBlocks.id}) < (${cursor.date}::date, ${cursor.minute}::int, ${cursor.id}::uuid)`,
    );
  }

  return tx
    .select()
    .from(timeBlocks)
    .where(and(...conditions))
    .orderBy(desc(timeBlocks.logDate), desc(timeBlocks.startMinute), desc(timeBlocks.id))
    .limit(limit);
}

/** Updates text fields on a block and on its midnight sibling, so the pair stays consistent. */
export async function updateBlockDetails(
  tx: Tx,
  userId: string,
  block: TimeBlockRow,
  patch: { readonly activity: string; readonly category: string },
): Promise<number> {
  const scope = block.splitGroupId
    ? eq(timeBlocks.splitGroupId, block.splitGroupId)
    : eq(timeBlocks.id, block.id);

  const updated = await tx
    .update(timeBlocks)
    .set({ activity: patch.activity, category: patch.category, updatedAt: new Date() })
    .where(and(eq(timeBlocks.userId, userId), scope, isNull(timeBlocks.deletedAt)))
    .returning({ id: timeBlocks.id });
  return updated.length;
}
