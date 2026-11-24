// tests/server/db/dashboard.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";
import { isoWeekday } from "@/domain/time/logical-date";
import { localIsoDate } from "@/domain/time/local-date";

describe.skipIf(!RUN_DB_TESTS)("dashboard (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let plan: typeof import("@/server/services/weekly-plan");
  let checklist: typeof import("@/server/services/checklist");
  let dashboard: typeof import("@/server/services/dashboard");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "dashboard");
    plan = await import("@/server/services/weekly-plan");
    checklist = await import("@/server/services/checklist");
    dashboard = await import("@/server/services/dashboard");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  it("reports an unchecked required item as a miss on a normal day", async () => {
    const today = localIsoDate(new Date(), "Asia/Jakarta");
    const weekday = isoWeekday(today);

    const done = await plan.createPlanItem(userId, {
      weekday,
      title: "Done item",
      category: "WORSHIP",
      isRequired: true,
      isCore: true,
      plannedMinutes: null,
    });
    await plan.createPlanItem(userId, {
      weekday,
      title: "Forgotten item",
      category: "WORK",
      isRequired: true,
      isCore: false,
      plannedMinutes: null,
    });

    const before = await dashboard.getDashboard(userId);
    expect(before.calibration.recordedDays).toBe(0);
    expect(before.recordedDates).not.toContain(today);

    // The first check freezes today, so the second item stays unchecked in the snapshot.
    await checklist.setChecklistItem(userId, { logDate: today, sourceItemId: done.id, done: true });

    const data = await dashboard.getDashboard(userId);
    expect(data.timeZone).toBe("Asia/Jakarta");
    expect(data.today).toBe(today);
    expect(data.recordedDates).toContain(today);
    expect(data.calibration.recordedDays).toBe(1);
    expect(data.misses.map((miss) => miss.title)).toContain("Forgotten item");
  }, 60_000);

  it("returns a trend point list and a calibration state", async () => {
    const data = await dashboard.getDashboard(userId);
    expect(Array.isArray(data.trend.points)).toBe(true);
    expect(data.calibration.requiredDays).toBe(7);
  }, 60_000);
});
