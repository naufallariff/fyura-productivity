import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";

// 2026-11-02 is a Monday. 2026-11-03 is a Tuesday.
const MONDAY = "2026-11-02";
const TUESDAY = "2026-11-03";

describe.skipIf(!RUN_DB_TESTS)("checklist services (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let plan: typeof import("@/server/services/weekly-plan");
  let checklist: typeof import("@/server/services/checklist");
  let daily: typeof import("@/server/services/daily");
  let history: typeof import("@/server/services/history");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "checklist");
    plan = await import("@/server/services/weekly-plan");
    checklist = await import("@/server/services/checklist");
    daily = await import("@/server/services/daily");
    history = await import("@/server/services/history");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  it("freezes the day on the first check and ignores later plan additions", async () => {
    const prayer = await plan.createPlanItem(userId, {
      weekday: 1,
      title: "Prayer",
      category: "WORSHIP",
      isRequired: true,
      isCore: true,
      plannedMinutes: null,
    });
    await plan.createPlanItem(userId, {
      weekday: 1,
      title: "Reading",
      category: "LEARNING",
      isRequired: true,
      isCore: false,
      plannedMinutes: 30,
    });

    const before = await checklist.getChecklist(userId, MONDAY);
    expect(before.frozen).toBe(false);
    expect(before.items).toHaveLength(2);

    await checklist.setChecklistItem(userId, {
      logDate: MONDAY,
      sourceItemId: prayer.id,
      done: true,
    });
    await plan.createPlanItem(userId, {
      weekday: 1,
      title: "Added later",
      category: "WORK",
      isRequired: true,
      isCore: false,
      plannedMinutes: null,
    });

    const after = await checklist.getChecklist(userId, MONDAY);
    expect(after.frozen).toBe(true);
    expect(after.items).toHaveLength(2);
    expect(after.items.find((item) => item.sourceItemId === prayer.id)?.isDone).toBe(true);
  }, 30_000);

  it("rejects a toggle for an item that is not part of the frozen day", async () => {
    await expect(
      checklist.setChecklistItem(userId, {
        logDate: MONDAY,
        sourceItemId: randomUUID(),
        done: true,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("scores a sick day as unplanned and a normal day from its checklist", async () => {
    await daily.setDayStatus(userId, { logDate: TUESDAY, status: "SICK" });

    const scores = await checklist.getChecklistScores(userId, MONDAY, TUESDAY);
    expect(scores[0]).toMatchObject({ date: MONDAY, planned: 2, completed: 1 });
    expect(scores[1]).toMatchObject({ date: TUESDAY, planned: 0, ratio: null });
  });

  it("searches history literally, so a percent sign is not a wildcard", async () => {
    await daily.createTimeBlock(userId, {
      logDate: "2026-11-04",
      startMinute: 600,
      durationMinutes: 30,
      category: "WORK",
      activity: "100% focus",
      source: "MANUAL",
    });
    await daily.createTimeBlock(userId, {
      logDate: "2026-11-04",
      startMinute: 700,
      durationMinutes: 30,
      category: "WORK",
      activity: "Planning",
      source: "MANUAL",
    });

    const page = await history.listTimeBlockHistory(userId, { q: "%", limit: 25 });
    expect(page.items.map((item) => item.activity)).toEqual(["100% focus"]);
  });

  it("pages history with a cursor and returns no duplicate rows", async () => {
    const first = await history.listTimeBlockHistory(userId, { limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).not.toBeNull();

    const second = await history.listTimeBlockHistory(userId, {
      limit: 1,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it("keeps one user's checklist invisible to another user", async () => {
    const other = await createTestUser(sql, "checklist-other");
    try {
      const rows = await sql.begin(async (tx) => {
        await tx`select set_config('app.user_id', ${other}, true)`;
        return tx`select id from checklist_entries`;
      });
      expect(rows).toHaveLength(0);
    } finally {
      await deleteTestUser(sql, other);
    }
  });
});
