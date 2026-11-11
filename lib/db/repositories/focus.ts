import "server-only";
import { and, desc, eq } from "drizzle-orm";
import type { Tx } from "@/lib/db/tx";
import { focusSessions } from "@/lib/db/schema";

export type FocusRow = typeof focusSessions.$inferSelect;

export async function insertFocusSession(
  tx: Tx,
  row: Omit<FocusRow, "id" | "createdAt">,
): Promise<FocusRow> {
  const [inserted] = await tx.insert(focusSessions).values(row).returning();
  if (!inserted) throw new Error("insertFocusSession: no row returned");
  return inserted;
}

export async function listRecentFocus(tx: Tx, userId: string, limit: number): Promise<FocusRow[]> {
  return tx
    .select()
    .from(focusSessions)
    .where(eq(focusSessions.userId, userId))
    .orderBy(desc(focusSessions.startedAt))
    .limit(limit);
}

export async function sumDeepMinutes(tx: Tx, userId: string, logDate: string): Promise<number> {
  const rows = await tx
    .select({ actualMinutes: focusSessions.actualMinutes })
    .from(focusSessions)
    .where(
      and(
        eq(focusSessions.userId, userId),
        eq(focusSessions.logDate, logDate),
        eq(focusSessions.kind, "DEEP"),
        eq(focusSessions.completed, true),
      ),
    );
  return rows.reduce((sum, row) => sum + row.actualMinutes, 0);
}
