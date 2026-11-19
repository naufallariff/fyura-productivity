// server/db/repositories/career.ts
import "server-only";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { careerActivities, jobEvents, jobs } from "@/server/db/schema";
import { escapeLike } from "@/server/db/like";
import { MAX_DAILY_COUNT, clampCount } from "@/domain/career/activity";
import type { JobStatus } from "@/domain/career/status";

export type JobRow = typeof jobs.$inferSelect;
export type NewJobRow = typeof jobs.$inferInsert;
export type JobEventRow = typeof jobEvents.$inferSelect;
export type ActivityRow = typeof careerActivities.$inferSelect;

export interface JobFilter {
  readonly status?: JobStatus;
  readonly q?: string;
  readonly archived: boolean;
}

export interface JobPosition {
  readonly at: Date;
  readonly id: string;
}

export async function listJobsPage(
  tx: Tx,
  userId: string,
  filter: JobFilter,
  position: JobPosition | null,
  limit: number,
): Promise<JobRow[]> {
  const conditions: SQL[] = [
    eq(jobs.userId, userId),
    filter.archived ? isNotNull(jobs.archivedAt) : isNull(jobs.archivedAt),
  ];

  if (filter.status) conditions.push(eq(jobs.status, filter.status));

  if (filter.q) {
    const pattern = `%${escapeLike(filter.q)}%`;
    const text = or(ilike(jobs.company, pattern), ilike(jobs.role, pattern));
    if (text) conditions.push(text);
  }

  if (position) {
    const after = or(
      lt(jobs.updatedAt, position.at),
      and(eq(jobs.updatedAt, position.at), lt(jobs.id, position.id)),
    );
    if (after) conditions.push(after);
  }

  return tx
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(desc(jobs.updatedAt), desc(jobs.id))
    .limit(limit);
}

export async function findJob(tx: Tx, userId: string, jobId: string): Promise<JobRow | null> {
  const [row] = await tx
    .select()
    .from(jobs)
    .where(and(eq(jobs.userId, userId), eq(jobs.id, jobId)))
    .limit(1);
  return row ?? null;
}

export async function insertJob(
  tx: Tx,
  row: Omit<NewJobRow, "createdAt" | "updatedAt">,
): Promise<JobRow> {
  // Millisecond timestamps keep the ISO cursor exact.
  const now = new Date();
  const [inserted] = await tx
    .insert(jobs)
    .values({ ...row, createdAt: now, updatedAt: now })
    .returning();
  if (!inserted) throw new Error("insertJob: no row returned");
  return inserted;
}

/**
 * Updates a job. When expectedStatus is given, the update only applies if the stored
 * status still matches. Two tabs changing the status at once cannot both win.
 */
export async function updateJobRow(
  tx: Tx,
  userId: string,
  jobId: string,
  patch: Partial<NewJobRow>,
  expectedStatus?: JobStatus,
): Promise<JobRow | null> {
  const guard = expectedStatus ? eq(jobs.status, expectedStatus) : undefined;
  const [row] = await tx
    .update(jobs)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(jobs.userId, userId), eq(jobs.id, jobId), guard))
    .returning();
  return row ?? null;
}

/** Id, status, and creation time of every active job. Used by the summary. */
export async function listActiveJobsForSummary(
  tx: Tx,
  userId: string,
): Promise<Array<{ id: string; status: string; createdAt: Date }>> {
  return tx
    .select({ id: jobs.id, status: jobs.status, createdAt: jobs.createdAt })
    .from(jobs)
    .where(and(eq(jobs.userId, userId), isNull(jobs.archivedAt)));
}

export async function insertJobEvent(
  tx: Tx,
  row: { userId: string; jobId: string; fromStatus: string | null; toStatus: string },
): Promise<void> {
  await tx.insert(jobEvents).values(row);
}

export async function listJobEvents(tx: Tx, userId: string, jobId: string): Promise<JobEventRow[]> {
  return tx
    .select()
    .from(jobEvents)
    .where(and(eq(jobEvents.userId, userId), eq(jobEvents.jobId, jobId)))
    .orderBy(jobEvents.occurredAt, jobEvents.id)
    .limit(200);
}

/** Latest status change per job. Jobs without events are missing from the map. */
export async function lastStatusChanges(
  tx: Tx,
  userId: string,
  jobIds: readonly string[],
): Promise<Map<string, Date>> {
  if (jobIds.length === 0) return new Map();
  const rows = await tx
    .select({
      jobId: jobEvents.jobId,
      last: sql<Date>`max(${jobEvents.occurredAt})`,
    })
    .from(jobEvents)
    .where(and(eq(jobEvents.userId, userId), inArray(jobEvents.jobId, [...jobIds])))
    .groupBy(jobEvents.jobId);
  return new Map(rows.map((row) => [row.jobId, new Date(row.last)]));
}

/**
 * Adds delta to one day's count for one kind. Runs as a single statement, so concurrent
 * taps cannot lose an increment. The result never drops below zero or above the maximum.
 */
export async function bumpActivity(
  tx: Tx,
  userId: string,
  activityDate: string,
  kind: string,
  delta: number,
): Promise<number> {
  const [row] = await tx
    .insert(careerActivities)
    .values({ userId, activityDate, kind, count: clampCount(delta) })
    .onConflictDoUpdate({
      target: [careerActivities.userId, careerActivities.activityDate, careerActivities.kind],
      set: {
        count: sql`greatest(0, least(${MAX_DAILY_COUNT}, ${careerActivities.count} + ${delta}))`,
        updatedAt: new Date(),
      },
    })
    .returning({ count: careerActivities.count });
  return row?.count ?? 0;
}

export async function listActivitiesInRange(
  tx: Tx,
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<ActivityRow[]> {
  return tx
    .select()
    .from(careerActivities)
    .where(
      and(
        eq(careerActivities.userId, userId),
        gte(careerActivities.activityDate, fromDate),
        lte(careerActivities.activityDate, toDate),
      ),
    )
    .orderBy(careerActivities.activityDate, careerActivities.kind);
}
