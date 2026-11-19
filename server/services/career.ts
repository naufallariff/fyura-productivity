// server/services/career.ts
import "server-only";
import { withUser } from "@/server/db/tx";
import { decodeCursor, toPage, type Page } from "@/server/db/cursor";
import { definedFields } from "@/server/db/patch";
import { env } from "@/server/config/env";
import {
  bumpActivity,
  findJob,
  insertJob,
  insertJobEvent,
  lastStatusChanges,
  listActiveJobsForSummary,
  listActivitiesInRange,
  listJobEvents,
  listJobsPage,
  updateJobRow,
  type JobEventRow,
  type JobPosition,
  type JobRow,
  type NewJobRow,
} from "@/server/db/repositories/career";
import {
  ActivityRangeQuery,
  CreateJobInput,
  JobsQuery,
  LogActivityInput,
  UpdateJobInput,
} from "@/server/validation/career";
import { JOB_STATUSES, asJobStatus, needsFollowUp, type JobStatus } from "@/domain/career/status";
import { asActivityKind, totalsByKind } from "@/domain/career/activity";
import { localIsoDate } from "@/domain/time/local-date";
import { DomainError } from "./errors";
import { parse } from "./parse";

export interface JobSummaryDto {
  readonly id: string;
  readonly company: string;
  readonly role: string;
  readonly source: string | null;
  readonly status: JobStatus;
  readonly appliedAt: string | null;
  readonly nextAction: string | null;
  readonly nextActionDate: string | null;
  readonly archived: boolean;
  readonly needsFollowUp: boolean;
  readonly updatedAt: string;
}

export interface JobEventDto {
  readonly id: string;
  readonly fromStatus: JobStatus | null;
  readonly toStatus: JobStatus;
  readonly occurredAt: string;
}

export interface JobDetailDto extends JobSummaryDto {
  readonly link: string | null;
  readonly salaryInfo: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly events: JobEventDto[];
}

function todayIso(): string {
  return localIsoDate(new Date(), env.DEFAULT_TIMEZONE);
}

/** Empty text from a form is stored as null, so "no value" has one representation. */
function blankToNull(value: string): string | null {
  return value === "" ? null : value;
}

function toSummary(row: JobRow, lastChange: Date | undefined, today: string): JobSummaryDto {
  const status = asJobStatus(row.status);
  const lastChangedOn = localIsoDate(lastChange ?? row.createdAt, env.DEFAULT_TIMEZONE);
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    source: row.source,
    status,
    appliedAt: row.appliedAt,
    nextAction: row.nextAction,
    nextActionDate: row.nextActionDate,
    archived: row.archivedAt !== null,
    needsFollowUp: needsFollowUp(status, lastChangedOn, today),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toEventDto(row: JobEventRow): JobEventDto {
  return {
    id: row.id,
    fromStatus: row.fromStatus === null ? null : asJobStatus(row.fromStatus),
    toStatus: asJobStatus(row.toStatus),
    occurredAt: row.occurredAt.toISOString(),
  };
}

function parseJobCursor(key: string): JobPosition {
  const [iso, id] = key.split("|");
  const at = new Date(iso ?? "");
  if (!id || Number.isNaN(at.getTime())) {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
  return { at, id };
}

/* ---------- Jobs ---------- */

export async function listJobs(userId: string, input: unknown): Promise<Page<JobSummaryDto>> {
  const query = parse(JobsQuery, input);
  const cursor = decodeCursor(query.cursor);
  const position = cursor ? parseJobCursor(cursor.key) : null;
  const today = todayIso();

  return withUser(userId, async (tx) => {
    const rows = await listJobsPage(
      tx,
      userId,
      {
        status: query.status,
        q: query.q ? query.q : undefined,
        archived: query.archived === "1",
      },
      position,
      query.limit + 1,
    );
    const page = toPage(rows, query.limit, (row) => ({
      key: `${row.updatedAt.toISOString()}|${row.id}`,
      id: row.id,
    }));
    const changes = await lastStatusChanges(
      tx,
      userId,
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) => toSummary(row, changes.get(row.id), today)),
      nextCursor: page.nextCursor,
    };
  });
}

/** Every active job, for the board. The count is bounded in practice, so no pagination. */
export async function listActiveJobsBoard(userId: string): Promise<JobSummaryDto[]> {
  const today = todayIso();
  return withUser(userId, async (tx) => {
    const rows = await listJobsPage(tx, userId, { archived: false }, null, 500);
    const changes = await lastStatusChanges(
      tx,
      userId,
      rows.map((row) => row.id),
    );
    return rows.map((row) => toSummary(row, changes.get(row.id), today));
  });
}

export async function getJob(userId: string, jobId: string): Promise<JobDetailDto> {
  const today = todayIso();
  return withUser(userId, async (tx) => {
    const row = await findJob(tx, userId, jobId);
    if (!row) throw new DomainError("NOT_FOUND", "Job not found");

    const [events, changes] = await Promise.all([
      listJobEvents(tx, userId, jobId),
      lastStatusChanges(tx, userId, [jobId]),
    ]);

    return {
      ...toSummary(row, changes.get(jobId), today),
      link: row.link,
      salaryInfo: row.salaryInfo,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      events: events.map(toEventDto),
    };
  });
}

export async function createJob(userId: string, input: unknown): Promise<JobSummaryDto> {
  const parsed = parse(CreateJobInput, input);
  const today = todayIso();

  return withUser(userId, async (tx) => {
    const row = await insertJob(tx, {
      userId,
      company: parsed.company,
      role: parsed.role,
      source: blankToNull(parsed.source),
      link: blankToNull(parsed.link),
      status: "APPLIED",
      appliedAt: parsed.appliedAt,
      nextAction: blankToNull(parsed.nextAction),
      nextActionDate: parsed.nextActionDate,
      salaryInfo: blankToNull(parsed.salaryInfo),
      notes: blankToNull(parsed.notes),
    });
    await insertJobEvent(tx, {
      userId,
      jobId: row.id,
      fromStatus: null,
      toStatus: "APPLIED",
    });
    return toSummary(row, undefined, today);
  });
}

/**
 * Updates a job. A status change is recorded as an event. Setting the same status again
 * changes nothing and records nothing.
 */
export async function updateJob(userId: string, input: unknown): Promise<void> {
  const { jobId, status, archived, ...fields } = parse(UpdateJobInput, input);

  await withUser(userId, async (tx) => {
    const existing = await findJob(tx, userId, jobId);
    if (!existing) throw new DomainError("NOT_FOUND", "Job not found");

    const current = asJobStatus(existing.status);
    const nextStatus = status !== undefined && status !== current ? status : undefined;

    const patch: Partial<NewJobRow> = definedFields({
      company: fields.company,
      role: fields.role,
      source: fields.source === undefined ? undefined : blankToNull(fields.source),
      link: fields.link === undefined ? undefined : blankToNull(fields.link),
      appliedAt: fields.appliedAt,
      nextAction: fields.nextAction === undefined ? undefined : blankToNull(fields.nextAction),
      nextActionDate: fields.nextActionDate,
      salaryInfo: fields.salaryInfo === undefined ? undefined : blankToNull(fields.salaryInfo),
      notes: fields.notes === undefined ? undefined : blankToNull(fields.notes),
      archivedAt: archived === undefined ? undefined : archived ? new Date() : null,
    });

    const row = await updateJobRow(
      tx,
      userId,
      jobId,
      nextStatus === undefined ? patch : { ...patch, status: nextStatus },
      nextStatus === undefined ? undefined : current,
    );

    if (!row) {
      if (nextStatus !== undefined) {
        throw new DomainError("CONFLICT", "The job changed. Refresh and try again.");
      }
      throw new DomainError("NOT_FOUND", "Job not found");
    }

    if (nextStatus !== undefined) {
      await insertJobEvent(tx, {
        userId,
        jobId,
        fromStatus: current,
        toStatus: nextStatus,
      });
    }
  });
}

/* ---------- Activities ---------- */

/** Adds (or subtracts) to one day's count. Returns the new count for that day and kind. */
export async function logActivity(userId: string, input: unknown): Promise<number> {
  const parsed = parse(LogActivityInput, input);
  return withUser(userId, (tx) =>
    bumpActivity(tx, userId, parsed.activityDate, parsed.kind, parsed.delta),
  );
}

export async function getActivityRange(userId: string, input: unknown) {
  const query = parse(ActivityRangeQuery, input);
  return withUser(userId, async (tx) => {
    const rows = await listActivitiesInRange(tx, userId, query.from, query.to);
    return {
      items: rows.map((row) => ({
        date: row.activityDate,
        kind: asActivityKind(row.kind),
        count: row.count,
      })),
      totals: totalsByKind(rows),
    };
  });
}

/* ---------- Summary ---------- */

/**
 * Job counts by status for active jobs, and how many open jobs need a follow-up.
 * Dates are taken in the caller's time zone.
 */
export async function careerSummary(
  userId: string,
  timeZone: string,
): Promise<{ counts: Record<JobStatus, number>; followUp: number }> {
  const today = localIsoDate(new Date(), timeZone);

  return withUser(userId, async (tx) => {
    const rows = await listActiveJobsForSummary(tx, userId);
    const changes = await lastStatusChanges(
      tx,
      userId,
      rows.map((row) => row.id),
    );

    const counts = Object.fromEntries(JOB_STATUSES.map((status) => [status, 0])) as Record<
      JobStatus,
      number
    >;
    let followUp = 0;

    for (const row of rows) {
      const status = asJobStatus(row.status);
      counts[status] += 1;
      const lastChangedOn = localIsoDate(changes.get(row.id) ?? row.createdAt, timeZone);
      if (needsFollowUp(status, lastChangedOn, today)) followUp += 1;
    }

    return { counts, followUp };
  });
}
