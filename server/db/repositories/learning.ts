// server/db/repositories/learning.ts
import "server-only";
import { and, asc, desc, eq, inArray, isNull, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { learningItems, readingProgress, reviewCards, subjects } from "@/server/db/schema";

export type SubjectRow = typeof subjects.$inferSelect;
export type NewSubjectRow = typeof subjects.$inferInsert;
export type ItemRow = typeof learningItems.$inferSelect;
export type NewItemRow = typeof learningItems.$inferInsert;
export type ReviewRow = typeof reviewCards.$inferSelect;
export type NewReviewRow = typeof reviewCards.$inferInsert;

export interface ItemFilter {
  readonly subjectId?: string;
  readonly status?: "QUEUED" | "ACTIVE" | "DONE" | "ARCHIVED";
}

export interface ItemPosition {
  readonly at: Date;
  readonly id: string;
}

/* ---------- Subjects ---------- */

/** Non-archived subjects, alphabetical. The list is small, so it is not paginated. */
export async function selectSubjects(tx: Tx, userId: string): Promise<SubjectRow[]> {
  return tx
    .select()
    .from(subjects)
    .where(and(eq(subjects.userId, userId), ne(subjects.status, "ARCHIVED")))
    .orderBy(asc(subjects.name), asc(subjects.id));
}

export async function selectSubject(
  tx: Tx,
  userId: string,
  subjectId: string,
): Promise<SubjectRow | null> {
  const [row] = await tx
    .select()
    .from(subjects)
    .where(and(eq(subjects.userId, userId), eq(subjects.id, subjectId)))
    .limit(1);
  return row ?? null;
}

export async function selectSubjectByName(
  tx: Tx,
  userId: string,
  name: string,
): Promise<SubjectRow | null> {
  const [row] = await tx
    .select()
    .from(subjects)
    .where(and(eq(subjects.userId, userId), eq(subjects.name, name)))
    .limit(1);
  return row ?? null;
}

export async function countActiveSubjects(tx: Tx, userId: string): Promise<number> {
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(subjects)
    .where(and(eq(subjects.userId, userId), eq(subjects.status, "ACTIVE")));
  return row?.count ?? 0;
}

export async function insertSubject(tx: Tx, row: NewSubjectRow): Promise<SubjectRow> {
  const [inserted] = await tx.insert(subjects).values(row).returning();
  if (!inserted) throw new Error("insertSubject: no row returned");
  return inserted;
}

export async function updateSubjectRow(
  tx: Tx,
  userId: string,
  subjectId: string,
  patch: Partial<NewSubjectRow>,
): Promise<SubjectRow | null> {
  const [row] = await tx
    .update(subjects)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(subjects.userId, userId), eq(subjects.id, subjectId)))
    .returning();
  return row ?? null;
}

/* ---------- Items ---------- */

export async function selectItemsPage(
  tx: Tx,
  userId: string,
  filter: ItemFilter,
  position: ItemPosition | null,
  limit: number,
): Promise<ItemRow[]> {
  const conditions: SQL[] = [eq(learningItems.userId, userId)];

  if (filter.subjectId) conditions.push(eq(learningItems.subjectId, filter.subjectId));
  conditions.push(
    filter.status ? eq(learningItems.status, filter.status) : ne(learningItems.status, "ARCHIVED"),
  );

  if (position) {
    const after = or(
      lt(learningItems.updatedAt, position.at),
      and(eq(learningItems.updatedAt, position.at), lt(learningItems.id, position.id)),
    );
    if (after) conditions.push(after);
  }

  return tx
    .select()
    .from(learningItems)
    .where(and(...conditions))
    .orderBy(desc(learningItems.updatedAt), desc(learningItems.id))
    .limit(limit);
}

export async function selectItem(tx: Tx, userId: string, itemId: string): Promise<ItemRow | null> {
  const [row] = await tx
    .select()
    .from(learningItems)
    .where(and(eq(learningItems.userId, userId), eq(learningItems.id, itemId)))
    .limit(1);
  return row ?? null;
}

export async function insertItem(
  tx: Tx,
  row: Omit<NewItemRow, "createdAt" | "updatedAt">,
): Promise<ItemRow> {
  // Millisecond timestamps keep the ISO cursor exact.
  const now = new Date();
  const [inserted] = await tx
    .insert(learningItems)
    .values({ ...row, createdAt: now, updatedAt: now })
    .returning();
  if (!inserted) throw new Error("insertItem: no row returned");
  return inserted;
}

export async function updateItemRow(
  tx: Tx,
  userId: string,
  itemId: string,
  patch: Partial<NewItemRow>,
): Promise<ItemRow | null> {
  const [row] = await tx
    .update(learningItems)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(learningItems.userId, userId), eq(learningItems.id, itemId)))
    .returning();
  return row ?? null;
}

/* ---------- Progress ---------- */

/** Sum of logged units per item. Items without progress are missing from the map. */
export async function completedUnitsByItem(
  tx: Tx,
  userId: string,
  itemIds: readonly string[],
): Promise<Map<string, number>> {
  if (itemIds.length === 0) return new Map();
  const rows = await tx
    .select({
      itemId: readingProgress.itemId,
      units: sql<number>`sum(${readingProgress.units})::int`,
    })
    .from(readingProgress)
    .where(and(eq(readingProgress.userId, userId), inArray(readingProgress.itemId, [...itemIds])))
    .groupBy(readingProgress.itemId);
  return new Map(rows.map((row) => [row.itemId, row.units]));
}

/** Replaces the figures for one day. The conflict target is the unique (item, day) index. */
export async function upsertProgress(
  tx: Tx,
  userId: string,
  itemId: string,
  logDate: string,
  units: number,
  minutes: number,
): Promise<void> {
  await tx
    .insert(readingProgress)
    .values({ userId, itemId, logDate, units, minutes })
    .onConflictDoUpdate({
      target: [readingProgress.itemId, readingProgress.logDate],
      set: { units, minutes, updatedAt: new Date() },
    });
}

/* ---------- Review cards ---------- */

export async function insertReviewCard(
  tx: Tx,
  row: Omit<NewReviewRow, "createdAt" | "updatedAt">,
): Promise<ReviewRow> {
  const now = new Date();
  const [inserted] = await tx
    .insert(reviewCards)
    .values({ ...row, createdAt: now, updatedAt: now })
    .returning();
  if (!inserted) throw new Error("insertReviewCard: no row returned");
  return inserted;
}

/**
 * Reads the card and locks its row until the transaction ends. A second review of the
 * same card waits here, then sees the new due date and is refused.
 */
export async function lockReviewCard(
  tx: Tx,
  userId: string,
  cardId: string,
): Promise<ReviewRow | null> {
  const [row] = await tx
    .select()
    .from(reviewCards)
    .where(
      and(
        eq(reviewCards.userId, userId),
        eq(reviewCards.id, cardId),
        isNull(reviewCards.archivedAt),
      ),
    )
    .limit(1)
    .for("update");
  return row ?? null;
}

export async function updateReviewCardRow(
  tx: Tx,
  userId: string,
  cardId: string,
  patch: Partial<NewReviewRow>,
): Promise<ReviewRow | null> {
  const [row] = await tx
    .update(reviewCards)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(reviewCards.userId, userId), eq(reviewCards.id, cardId)))
    .returning();
  return row ?? null;
}

/** Active cards due on or before the given day, earliest first. */
export async function selectDueCards(
  tx: Tx,
  userId: string,
  today: string,
  limit: number,
): Promise<ReviewRow[]> {
  return tx
    .select()
    .from(reviewCards)
    .where(
      and(
        eq(reviewCards.userId, userId),
        isNull(reviewCards.archivedAt),
        lte(reviewCards.dueOn, today),
      ),
    )
    .orderBy(asc(reviewCards.dueOn), asc(reviewCards.id))
    .limit(limit);
}
