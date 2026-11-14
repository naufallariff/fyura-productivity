import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import type { Tx } from "@/lib/db/tx";
import { dayLogs } from "@/lib/db/schema";

export type DayLogRow = typeof dayLogs.$inferSelect;

export async function findDayLog(
  tx: Tx,
  userId: string,
  logDate: string,
): Promise<DayLogRow | null> {
  const [row] = await tx
    .select()
    .from(dayLogs)
    .where(and(eq(dayLogs.userId, userId), eq(dayLogs.logDate, logDate)))
    .limit(1);
  return row ?? null;
}

export async function listDayLogsInRange(
  tx: Tx,
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<DayLogRow[]> {
  return tx
    .select()
    .from(dayLogs)
    .where(
      and(eq(dayLogs.userId, userId), gte(dayLogs.logDate, fromDate), lte(dayLogs.logDate, toDate)),
    );
}

export async function upsertDayLog(
  tx: Tx,
  row: Pick<DayLogRow, "userId" | "logDate" | "status">,
): Promise<void> {
  await tx
    .insert(dayLogs)
    .values({ ...row, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [dayLogs.userId, dayLogs.logDate],
      set: { status: row.status, updatedAt: new Date() },
    });
}
