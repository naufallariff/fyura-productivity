import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Tx } from "@/lib/db/tx";
import { habits, habitChecks } from "@/lib/db/schema";

export type HabitRow = typeof habits.$inferSelect;
export type HabitCheckRow = typeof habitChecks.$inferSelect;

export async function listActiveHabits(tx: Tx, userId: string): Promise<HabitRow[]> {
  return tx
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), isNull(habits.archivedAt)))
    .orderBy(asc(habits.createdAt));
}

export async function findHabitById(
  tx: Tx,
  userId: string,
  habitId: string,
): Promise<HabitRow | null> {
  const [row] = await tx
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.id, habitId)))
    .limit(1);
  return row ?? null;
}

export async function insertHabit(
  tx: Tx,
  row: Omit<HabitRow, "id" | "createdAt" | "archivedAt" | "active">,
): Promise<HabitRow> {
  const [inserted] = await tx.insert(habits).values(row).returning();
  if (!inserted) throw new Error("insertHabit: no row returned");
  return inserted;
}

/** Inserts the habit only when its key does not exist yet. Returns true if inserted. */
export async function insertHabitIfMissing(
  tx: Tx,
  row: Omit<HabitRow, "id" | "createdAt" | "archivedAt" | "active">,
): Promise<boolean> {
  const inserted = await tx
    .insert(habits)
    .values(row)
    .onConflictDoNothing({ target: [habits.userId, habits.key] })
    .returning({ id: habits.id });
  return inserted.length === 1;
}

export async function listChecksForDate(
  tx: Tx,
  userId: string,
  logDate: string,
): Promise<HabitCheckRow[]> {
  return tx
    .select()
    .from(habitChecks)
    .where(and(eq(habitChecks.userId, userId), eq(habitChecks.logDate, logDate)));
}

export async function upsertCheck(
  tx: Tx,
  row: Pick<HabitCheckRow, "userId" | "habitId" | "logDate" | "value" | "source">,
): Promise<void> {
  await tx
    .insert(habitChecks)
    .values({ ...row, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [habitChecks.habitId, habitChecks.logDate],
      set: { value: row.value, source: row.source, updatedAt: new Date() },
    });
}
