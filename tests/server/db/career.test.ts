// tests/server/db/career.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";

describe.skipIf(!RUN_DB_TESTS)("career services (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let svc: typeof import("@/server/services/career");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "career");
    svc = await import("@/server/services/career");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  it("creates a job with one initial event from nothing to APPLIED", async () => {
    const job = await svc.createJob(userId, { company: "Acme", role: "Engineer" });
    const detail = await svc.getJob(userId, job.id);

    expect(detail.status).toBe("APPLIED");
    expect(detail.events).toHaveLength(1);
    expect(detail.events[0]).toMatchObject({ fromStatus: null, toStatus: "APPLIED" });
  }, 30_000);

  it("records a status change and ignores a repeated status", async () => {
    const job = await svc.createJob(userId, { company: "Beta", role: "Analyst" });
    await svc.updateJob(userId, { jobId: job.id, status: "SCREENING" });
    await svc.updateJob(userId, { jobId: job.id, status: "SCREENING" });

    const detail = await svc.getJob(userId, job.id);
    expect(detail.events.map((event) => [event.fromStatus, event.toStatus])).toEqual([
      [null, "APPLIED"],
      ["APPLIED", "SCREENING"],
    ]);
  }, 30_000);

  it("hides archived jobs by default and shows them with archived=1", async () => {
    const job = await svc.createJob(userId, { company: "Gamma", role: "Designer" });
    await svc.updateJob(userId, { jobId: job.id, archived: true });

    const active = await svc.listJobs(userId, { limit: 50 });
    expect(active.items.map((row) => row.id)).not.toContain(job.id);

    const archived = await svc.listJobs(userId, { archived: "1", limit: 50 });
    expect(archived.items.map((row) => row.id)).toContain(job.id);
  }, 30_000);

  it("matches company and role search literally", async () => {
    await svc.createJob(userId, { company: "100% Labs", role: "Engineer" });
    const page = await svc.listJobs(userId, { q: "%", limit: 50 });
    expect(page.items.length).toBeGreaterThanOrEqual(1);
    expect(page.items.every((row) => row.company.includes("%") || row.role.includes("%"))).toBe(
      true,
    );
  }, 30_000);

  it("adds and subtracts daily activity and never goes below zero", async () => {
    const date = "2026-11-20";
    expect(await svc.logActivity(userId, { activityDate: date, kind: "APPLY", delta: 2 })).toBe(2);
    expect(await svc.logActivity(userId, { activityDate: date, kind: "APPLY", delta: 3 })).toBe(5);
    expect(await svc.logActivity(userId, { activityDate: date, kind: "APPLY", delta: -10 })).toBe(
      0,
    );
  }, 30_000);

  it("sums activity totals over a date range by kind", async () => {
    await svc.logActivity(userId, { activityDate: "2026-12-01", kind: "APPLY", delta: 2 });
    await svc.logActivity(userId, { activityDate: "2026-12-02", kind: "NETWORKING", delta: 1 });

    const range = await svc.getActivityRange(userId, { from: "2026-12-01", to: "2026-12-02" });
    expect(range.totals.APPLY).toBe(2);
    expect(range.totals.NETWORKING).toBe(1);
  }, 30_000);

  it("counts active jobs by status in the summary", async () => {
    const before = await svc.careerSummary(userId);
    await svc.createJob(userId, { company: "Delta", role: "Engineer" });
    const after = await svc.careerSummary(userId);
    expect(after.counts.APPLIED).toBe(before.counts.APPLIED + 1);
  }, 30_000);

  it("keeps another user's jobs invisible", async () => {
    await svc.createJob(userId, { company: "Private Co", role: "Engineer" });
    const other = await createTestUser(sql, "career-other");
    try {
      const page = await svc.listJobs(other, { limit: 50 });
      expect(page.items).toHaveLength(0);
    } finally {
      await deleteTestUser(sql, other);
    }
  }, 30_000);
});
