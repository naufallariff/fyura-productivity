import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { weeklyPlanItems } from "@/server/db/schema";

export type PlanItemRow = typeof weeklyPlanItems.$inferSelect;
export type NewPlanItemRow = typeof weeklyPlanItems.$inferInsert;
export type PlanItemPatch = Partial<
  Pick<NewPlanItemRow, "title" | "category" | "isRequired" | "isCore" | "plannedMinutes">
>;

const active = (userId: string) =>
  and(eq(weeklyPlanItems.userId, userId), isNull(weeklyPlanItems.deletedAt));

export async function listPlanItems(tx: Tx, userId: string): Promise<PlanItemRow[]> {
  return tx
    .select()
    .from(weeklyPlanItems)
    .where(active(userId))
    .orderBy(asc(weeklyPlanItems.weekday), asc(weeklyPlanItems.position));
}

/** Position after the last active item of the day. */
export async function nextPosition(tx: Tx, userId: string, weekday: number): Promise<number> {
  const rows = await tx
    .select({ position: weeklyPlanItems.position })
    .from(weeklyPlanItems)
    .where(and(active(userId), eq(weeklyPlanItems.weekday, weekday)));
  return rows.reduce((max, row) => Math.max(max, row.position), -1) + 1;
}

export async function insertPlanItem(tx: Tx, row: NewPlanItemRow): Promise<PlanItemRow> {
  const [inserted] = await tx.insert(weeklyPlanItems).values(row).returning();
  if (!inserted) throw new Error("insertPlanItem: no row returned");
  return inserted;
}

export async function updatePlanItem(
  tx: Tx,
  userId: string,
  itemId: string,
  patch: PlanItemPatch,
): Promise<boolean> {
  const values = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as PlanItemPatch;

  const updated = await tx
    .update(weeklyPlanItems)
    .set({ ...values, updatedAt: new Date() })
    .where(and(active(userId), eq(weeklyPlanItems.id, itemId)))
    .returning({ id: weeklyPlanItems.id });
  return updated.length === 1;
}

export async function softDeletePlanItem(tx: Tx, userId: string, itemId: string): Promise<boolean> {
  const updated = await tx
    .update(weeklyPlanItems)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(active(userId), eq(weeklyPlanItems.id, itemId)))
    .returning({ id: weeklyPlanItems.id });
  return updated.length === 1;
}

/** Writes positions 0 to n-1 in the given order. Runs inside the caller's transaction. */
export async function applyOrder(
  tx: Tx,
  userId: string,
  weekday: number,
  orderedIds: readonly string[],
): Promise<void> {
  for (const [index, id] of orderedIds.entries()) {
    await tx
      .update(weeklyPlanItems)
      .set({ position: index, updatedAt: new Date() })
      .where(and(active(userId), eq(weeklyPlanItems.weekday, weekday), eq(weeklyPlanItems.id, id)));
  }
}
