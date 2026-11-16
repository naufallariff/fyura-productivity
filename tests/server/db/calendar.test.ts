import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";

describe.skipIf(!RUN_DB_TESTS)("calendar range (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let daily: typeof import("@/server/services/daily");
  let calendar: typeof import("@/server/services/calendar");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "calendar");
    daily = await import("@/server/services/daily");
    calendar = await import("@/server/services/calendar");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  it("returns only blocks inside the requested range", async () => {
    await daily.createTimeBlock(userId, {
      logDate: "2026-11-09",
      startMinute: 540,
      durationMinutes: 30,
      category: "WORK",
      activity: "Inside range",
      source: "MANUAL",
    });

    const inside = await calendar.getCalendarBlocks(userId, {
      from: "2026-11-09",
      to: "2026-11-15",
    });
    expect(inside.map((block) => block.activity)).toContain("Inside range");

    const outside = await calendar.getCalendarBlocks(userId, {
      from: "2026-11-02",
      to: "2026-11-08",
    });
    expect(outside.map((block) => block.activity)).not.toContain("Inside range");
  });

  it("keeps another user's blocks out of the range", async () => {
    const other = await createTestUser(sql, "calendar-other");
    try {
      const rows = await calendar.getCalendarBlocks(other, {
        from: "2026-11-09",
        to: "2026-11-15",
      });
      expect(rows).toHaveLength(0);
    } finally {
      await deleteTestUser(sql, other);
    }
  });
});
