// server/db/repositories/projects.ts
import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import {
  boardCardLabels,
  boardCards,
  boardChecklistItems,
  boardLabels,
  boardLists,
  boards,
  rateLimits,
} from "@/server/db/schema";

export type BoardRow = typeof boards.$inferSelect;
export type ListRow = typeof boardLists.$inferSelect;
export type CardRow = typeof boardCards.$inferSelect;
export type LabelRow = typeof boardLabels.$inferSelect;
export type ChecklistRow = typeof boardChecklistItems.$inferSelect;
export type NewBoardRow = typeof boards.$inferInsert;
export type NewListRow = typeof boardLists.$inferInsert;
export type NewCardRow = typeof boardCards.$inferInsert;
export type NewLabelRow = typeof boardLabels.$inferInsert;
export type NewChecklistRow = typeof boardChecklistItems.$inferInsert;

export interface CardFilter {
  readonly archived: boolean;
  readonly q?: string;
  readonly labelId?: string;
  readonly due?: "none" | "overdue" | "today" | "week";
  readonly today: string;
  readonly weekEnd: string;
}

/** Escapes LIKE wildcards so search text is matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/* ---------- Boards ---------- */

export async function listBoardsPage(
  tx: Tx,
  userId: string,
  archived: boolean,
  cursor: { readonly at: Date; readonly id: string } | null,
  limit: number,
): Promise<BoardRow[]> {
  const ownerOnly = eq(boards.userId, userId);
  const state = archived ? isNotNull(boards.archivedAt) : isNull(boards.archivedAt);

  const afterCursor = cursor
    ? or(
        lt(boards.updatedAt, cursor.at),
        and(eq(boards.updatedAt, cursor.at), lt(boards.id, cursor.id)),
      )
    : undefined;

  return tx
    .select()
    .from(boards)
    .where(and(ownerOnly, state, afterCursor))
    .orderBy(desc(boards.updatedAt), desc(boards.id))
    .limit(limit);
}

export async function findBoard(tx: Tx, userId: string, boardId: string): Promise<BoardRow | null> {
  const [row] = await tx
    .select()
    .from(boards)
    .where(and(eq(boards.userId, userId), eq(boards.id, boardId)))
    .limit(1);
  return row ?? null;
}

export async function insertBoard(tx: Tx, row: NewBoardRow): Promise<BoardRow> {
  // Millisecond precision matches the ISO cursor, so pagination never skips a board.
  const [inserted] = await tx
    .insert(boards)
    .values({ ...row, updatedAt: new Date() })
    .returning();
  if (!inserted) throw new Error("insertBoard: no row returned");
  return inserted;
}

export async function updateBoardRow(
  tx: Tx,
  userId: string,
  boardId: string,
  patch: Partial<NewBoardRow>,
): Promise<BoardRow | null> {
  const [row] = await tx
    .update(boards)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(boards.userId, userId), eq(boards.id, boardId)))
    .returning();
  return row ?? null;
}

/* ---------- Lists ---------- */

export async function listActiveLists(tx: Tx, userId: string, boardId: string): Promise<ListRow[]> {
  return tx
    .select()
    .from(boardLists)
    .where(
      and(
        eq(boardLists.userId, userId),
        eq(boardLists.boardId, boardId),
        isNull(boardLists.archivedAt),
      ),
    )
    .orderBy(asc(boardLists.position), asc(boardLists.id));
}

export async function findList(tx: Tx, userId: string, listId: string): Promise<ListRow | null> {
  const [row] = await tx
    .select()
    .from(boardLists)
    .where(and(eq(boardLists.userId, userId), eq(boardLists.id, listId)))
    .limit(1);
  return row ?? null;
}

export async function insertList(tx: Tx, row: NewListRow): Promise<ListRow> {
  const [inserted] = await tx.insert(boardLists).values(row).returning();
  if (!inserted) throw new Error("insertList: no row returned");
  return inserted;
}

export async function updateListRow(
  tx: Tx,
  userId: string,
  listId: string,
  patch: Partial<NewListRow>,
): Promise<ListRow | null> {
  const [row] = await tx
    .update(boardLists)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(boardLists.userId, userId), eq(boardLists.id, listId)))
    .returning();
  return row ?? null;
}

export async function setListPositions(
  tx: Tx,
  userId: string,
  pairs: ReadonlyArray<{ readonly id: string; readonly position: number }>,
): Promise<void> {
  for (const pair of pairs) {
    await tx
      .update(boardLists)
      .set({ position: pair.position })
      .where(and(eq(boardLists.userId, userId), eq(boardLists.id, pair.id)));
  }
}

/* ---------- Cards ---------- */

export async function findCard(tx: Tx, userId: string, cardId: string): Promise<CardRow | null> {
  const [row] = await tx
    .select()
    .from(boardCards)
    .where(and(eq(boardCards.userId, userId), eq(boardCards.id, cardId)))
    .limit(1);
  return row ?? null;
}

export async function insertCard(tx: Tx, row: NewCardRow): Promise<CardRow> {
  const [inserted] = await tx.insert(boardCards).values(row).returning();
  if (!inserted) throw new Error("insertCard: no row returned");
  return inserted;
}

export async function updateCardRow(
  tx: Tx,
  userId: string,
  cardId: string,
  patch: Partial<NewCardRow>,
): Promise<CardRow | null> {
  const [row] = await tx
    .update(boardCards)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(boardCards.userId, userId), eq(boardCards.id, cardId)))
    .returning();
  return row ?? null;
}

/** Active cards of a list in display order. Used for neighbour lookup and respacing. */
export async function listActiveCards(tx: Tx, userId: string, listId: string): Promise<CardRow[]> {
  return tx
    .select()
    .from(boardCards)
    .where(
      and(
        eq(boardCards.userId, userId),
        eq(boardCards.listId, listId),
        isNull(boardCards.archivedAt),
      ),
    )
    .orderBy(asc(boardCards.position), asc(boardCards.id));
}

export async function setCardPositions(
  tx: Tx,
  userId: string,
  pairs: ReadonlyArray<{ readonly id: string; readonly position: number }>,
): Promise<void> {
  for (const pair of pairs) {
    await tx
      .update(boardCards)
      .set({ position: pair.position })
      .where(and(eq(boardCards.userId, userId), eq(boardCards.id, pair.id)));
  }
}

export async function setCardPlacement(
  tx: Tx,
  userId: string,
  cardId: string,
  listId: string,
  position: number,
): Promise<void> {
  await tx
    .update(boardCards)
    .set({ listId, position, updatedAt: new Date() })
    .where(and(eq(boardCards.userId, userId), eq(boardCards.id, cardId)));
}

/**
 * One page of cards in a list. The cursor is (position, id), so pages never overlap
 * even when two cards share a position.
 */
export async function listCardsPage(
  tx: Tx,
  userId: string,
  listId: string,
  filter: CardFilter,
  cursor: { readonly position: number; readonly id: string } | null,
  limit: number,
): Promise<CardRow[]> {
  const conditions = [
    eq(boardCards.userId, userId),
    eq(boardCards.listId, listId),
    filter.archived ? isNotNull(boardCards.archivedAt) : isNull(boardCards.archivedAt),
  ];

  if (filter.q) conditions.push(ilike(boardCards.title, `%${escapeLike(filter.q)}%`));

  if (filter.labelId) {
    const labelId = filter.labelId;
    conditions.push(
      exists(
        tx
          .select({ one: sql`1` })
          .from(boardCardLabels)
          .where(
            and(eq(boardCardLabels.cardId, boardCards.id), eq(boardCardLabels.labelId, labelId)),
          ),
      ),
    );
  }

  switch (filter.due) {
    case "none":
      conditions.push(isNull(boardCards.dueOn));
      break;
    case "overdue":
      conditions.push(
        isNotNull(boardCards.dueOn),
        lt(boardCards.dueOn, filter.today),
        eq(boardCards.dueComplete, false),
      );
      break;
    case "today":
      conditions.push(eq(boardCards.dueOn, filter.today));
      break;
    case "week":
      conditions.push(gte(boardCards.dueOn, filter.today), lte(boardCards.dueOn, filter.weekEnd));
      break;
    default:
      break;
  }

  if (cursor) {
    const afterCursor = or(
      gt(boardCards.position, cursor.position),
      and(eq(boardCards.position, cursor.position), gt(boardCards.id, cursor.id)),
    );
    if (afterCursor) conditions.push(afterCursor);
  }

  return tx
    .select()
    .from(boardCards)
    .where(and(...conditions))
    .orderBy(asc(boardCards.position), asc(boardCards.id))
    .limit(limit);
}

/* ---------- Labels ---------- */

export async function listLabels(tx: Tx, userId: string, boardId: string): Promise<LabelRow[]> {
  return tx
    .select()
    .from(boardLabels)
    .where(and(eq(boardLabels.userId, userId), eq(boardLabels.boardId, boardId)))
    .orderBy(asc(boardLabels.name));
}

export async function findLabel(tx: Tx, userId: string, labelId: string): Promise<LabelRow | null> {
  const [row] = await tx
    .select()
    .from(boardLabels)
    .where(and(eq(boardLabels.userId, userId), eq(boardLabels.id, labelId)))
    .limit(1);
  return row ?? null;
}

export async function insertLabel(tx: Tx, row: NewLabelRow): Promise<LabelRow> {
  const [inserted] = await tx.insert(boardLabels).values(row).returning();
  if (!inserted) throw new Error("insertLabel: no row returned");
  return inserted;
}

export async function updateLabelRow(
  tx: Tx,
  userId: string,
  labelId: string,
  patch: Partial<NewLabelRow>,
): Promise<LabelRow | null> {
  const [row] = await tx
    .update(boardLabels)
    .set(patch)
    .where(and(eq(boardLabels.userId, userId), eq(boardLabels.id, labelId)))
    .returning();
  return row ?? null;
}

export async function deleteLabelRow(tx: Tx, userId: string, labelId: string): Promise<boolean> {
  const removed = await tx
    .delete(boardLabels)
    .where(and(eq(boardLabels.userId, userId), eq(boardLabels.id, labelId)))
    .returning({ id: boardLabels.id });
  return removed.length === 1;
}

export async function labelLinksForCards(
  tx: Tx,
  userId: string,
  cardIds: readonly string[],
): Promise<Array<{ readonly cardId: string; readonly labelId: string }>> {
  if (cardIds.length === 0) return [];
  return tx
    .select({ cardId: boardCardLabels.cardId, labelId: boardCardLabels.labelId })
    .from(boardCardLabels)
    .where(and(eq(boardCardLabels.userId, userId), inArray(boardCardLabels.cardId, [...cardIds])));
}

export async function setCardLabelLink(
  tx: Tx,
  userId: string,
  boardId: string,
  cardId: string,
  labelId: string,
  on: boolean,
): Promise<void> {
  if (on) {
    await tx
      .insert(boardCardLabels)
      .values({ userId, boardId, cardId, labelId })
      .onConflictDoNothing({ target: [boardCardLabels.cardId, boardCardLabels.labelId] });
    return;
  }
  await tx
    .delete(boardCardLabels)
    .where(
      and(
        eq(boardCardLabels.userId, userId),
        eq(boardCardLabels.cardId, cardId),
        eq(boardCardLabels.labelId, labelId),
      ),
    );
}

/* ---------- Checklist ---------- */

export async function checklistForCards(
  tx: Tx,
  userId: string,
  cardIds: readonly string[],
): Promise<ChecklistRow[]> {
  if (cardIds.length === 0) return [];
  return tx
    .select()
    .from(boardChecklistItems)
    .where(
      and(
        eq(boardChecklistItems.userId, userId),
        inArray(boardChecklistItems.cardId, [...cardIds]),
      ),
    )
    .orderBy(asc(boardChecklistItems.position), asc(boardChecklistItems.id));
}

export async function checklistForCard(
  tx: Tx,
  userId: string,
  cardId: string,
): Promise<ChecklistRow[]> {
  return tx
    .select()
    .from(boardChecklistItems)
    .where(and(eq(boardChecklistItems.userId, userId), eq(boardChecklistItems.cardId, cardId)))
    .orderBy(asc(boardChecklistItems.position), asc(boardChecklistItems.id));
}

export async function findChecklistItem(
  tx: Tx,
  userId: string,
  itemId: string,
): Promise<ChecklistRow | null> {
  const [row] = await tx
    .select()
    .from(boardChecklistItems)
    .where(and(eq(boardChecklistItems.userId, userId), eq(boardChecklistItems.id, itemId)))
    .limit(1);
  return row ?? null;
}

export async function insertChecklistItem(tx: Tx, row: NewChecklistRow): Promise<ChecklistRow> {
  const [inserted] = await tx.insert(boardChecklistItems).values(row).returning();
  if (!inserted) throw new Error("insertChecklistItem: no row returned");
  return inserted;
}

export async function updateChecklistRow(
  tx: Tx,
  userId: string,
  itemId: string,
  patch: Partial<NewChecklistRow>,
): Promise<ChecklistRow | null> {
  const [row] = await tx
    .update(boardChecklistItems)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(boardChecklistItems.userId, userId), eq(boardChecklistItems.id, itemId)))
    .returning();
  return row ?? null;
}

export async function deleteChecklistRow(tx: Tx, userId: string, itemId: string): Promise<boolean> {
  const removed = await tx
    .delete(boardChecklistItems)
    .where(and(eq(boardChecklistItems.userId, userId), eq(boardChecklistItems.id, itemId)))
    .returning({ id: boardChecklistItems.id });
  return removed.length === 1;
}

/* ---------- Rate limit ---------- */

/**
 * Counts one request in the current window. The upsert is atomic, so concurrent
 * requests cannot both pass a limit that only one of them should pass.
 * Returns true when the request is within the limit.
 */
export async function consumeRateToken(
  tx: Tx,
  userId: string,
  bucket: string,
  windowStart: Date,
  limit: number,
): Promise<boolean> {
  const [row] = await tx
    .insert(rateLimits)
    .values({ userId, bucket, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.userId, rateLimits.bucket],
      set: {
        count: sql`case when ${rateLimits.windowStart} = excluded.window_start then ${rateLimits.count} + 1 else 1 end`,
        windowStart: sql`excluded.window_start`,
      },
    })
    .returning({ count: rateLimits.count });
  return (row?.count ?? limit + 1) <= limit;
}
