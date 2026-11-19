// server/db/repositories/dashboard.ts
import "server-only";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { checklistEntries, dayLogs, focusSessions, readingProgress } from "@/server/db/schema";

/** Completed deep work minutes in an inclusive date range. */
export async function sumDeepFocusMinutes(
  tx: Tx,
  userId: string,
  from: string,
  to: string,
): Promise<number> {
  const [row] = await tx
    .select({ total: sql<number>`coalesce(sum(${focusSessions.actualMinutes}), 0)::int` })
    .from(focusSessions)
    .where(
      and(
        eq(focusSessions.userId, userId),
        eq(focusSessions.kind, "DEEP"),
        eq(focusSessions.completed, true),
        gte(focusSessions.logDate, from),
        lte(focusSessions.logDate, to),
      ),
    );
  return row?.total ?? 0;
}

/** Units and minutes logged in reading progress for an inclusive date range. */
export async function sumReading(
  tx: Tx,
  userId: string,
  from: string,
  to: string,
): Promise<{ units: number; minutes: number }> {
  const [row] = await tx
    .select({
      units: sql<number>`coalesce(sum(${readingProgress.units}), 0)::int`,
      minutes: sql<number>`coalesce(sum(${readingProgress.minutes}), 0)::int`,
    })
    .from(readingProgress)
    .where(
      and(
        eq(readingProgress.userId, userId),
        gte(readingProgress.logDate, from),
        lte(readingProgress.logDate, to),
      ),
    );
  return { units: row?.units ?? 0, minutes: row?.minutes ?? 0 };
}

/**
 * Required checklist items left unchecked on days whose status is NORMAL.
 * Sick, flexible, and off days are excluded, so rest never shows up as a miss.
 */
export async function requiredMissesByTitle(
  tx: Tx,
  userId: string,
  from: string,
  to: string,
): Promise<Array<{ title: string; count: number }>> {
  return tx
    .select({ title: checklistEntries.title, count: sql<number>`count(*)::int` })
    .from(checklistEntries)
    .leftJoin(
      dayLogs,
      and(
        eq(dayLogs.userId, checklistEntries.userId),
        eq(dayLogs.logDate, checklistEntries.logDate),
      ),
    )
    .where(
      and(
        eq(checklistEntries.userId, userId),
        gte(checklistEntries.logDate, from),
        lte(checklistEntries.logDate, to),
        eq(checklistEntries.isRequired, true),
        eq(checklistEntries.isDone, false),
        sql`coalesce(${dayLogs.status}, 'NORMAL') = 'NORMAL'`,
      ),
    )
    .groupBy(checklistEntries.title)
    .orderBy(sql`count(*) desc`, checklistEntries.title)
    .limit(3);
}
