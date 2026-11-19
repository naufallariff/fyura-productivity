// server/db/repositories/tadabur.ts
import "server-only";
import { and, desc, eq, gte, isNull, lt, lte, or, type SQL } from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { tadaburEntries } from "@/server/db/schema";

export type TadaburRow = typeof tadaburEntries.$inferSelect;
export type NewTadaburRow = typeof tadaburEntries.$inferInsert;

export interface TadaburFilter {
  readonly from?: string;
  readonly to?: string;
  readonly surah?: number;
}

export interface TadaburPosition {
  readonly date: string;
  readonly id: string;
}

export async function listTadaburPage(
  tx: Tx,
  userId: string,
  filter: TadaburFilter,
  position: TadaburPosition | null,
  limit: number,
): Promise<TadaburRow[]> {
  const conditions: SQL[] = [eq(tadaburEntries.userId, userId), isNull(tadaburEntries.deletedAt)];

  if (filter.from) conditions.push(gte(tadaburEntries.logDate, filter.from));
  if (filter.to) conditions.push(lte(tadaburEntries.logDate, filter.to));
  if (filter.surah !== undefined) conditions.push(eq(tadaburEntries.surah, filter.surah));

  if (position) {
    const after = or(
      lt(tadaburEntries.logDate, position.date),
      and(eq(tadaburEntries.logDate, position.date), lt(tadaburEntries.id, position.id)),
    );
    if (after) conditions.push(after);
  }

  return tx
    .select()
    .from(tadaburEntries)
    .where(and(...conditions))
    .orderBy(desc(tadaburEntries.logDate), desc(tadaburEntries.id))
    .limit(limit);
}

export async function findTadabur(
  tx: Tx,
  userId: string,
  entryId: string,
): Promise<TadaburRow | null> {
  const [row] = await tx
    .select()
    .from(tadaburEntries)
    .where(
      and(
        eq(tadaburEntries.userId, userId),
        eq(tadaburEntries.id, entryId),
        isNull(tadaburEntries.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function insertTadabur(tx: Tx, row: NewTadaburRow): Promise<TadaburRow> {
  const now = new Date();
  const [inserted] = await tx
    .insert(tadaburEntries)
    .values({ ...row, createdAt: now, updatedAt: now })
    .returning();
  if (!inserted) throw new Error("insertTadabur: no row returned");
  return inserted;
}

export async function updateTadaburRow(
  tx: Tx,
  userId: string,
  entryId: string,
  patch: Partial<NewTadaburRow>,
): Promise<TadaburRow | null> {
  const [row] = await tx
    .update(tadaburEntries)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(
        eq(tadaburEntries.userId, userId),
        eq(tadaburEntries.id, entryId),
        isNull(tadaburEntries.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

export async function softDeleteTadabur(tx: Tx, userId: string, entryId: string): Promise<boolean> {
  const now = new Date();
  const removed = await tx
    .update(tadaburEntries)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(
        eq(tadaburEntries.userId, userId),
        eq(tadaburEntries.id, entryId),
        isNull(tadaburEntries.deletedAt),
      ),
    )
    .returning({ id: tadaburEntries.id });
  return removed.length === 1;
}
