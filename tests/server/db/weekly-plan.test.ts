import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";

describe.skipIf(!RUN_DB_TESTS)("weekly plan services (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let svc: typeof import("@/server/services/weekly-plan");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "plan");
    svc = await import("@/server/services/weekly-plan");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  const draft = (title: string) => ({
    weekday: 1,
    title,
    category: "WORSHIP",
    isRequired: true,
    isCore: true,
    plannedMinutes: null,
  });

  it("appends new items at the end of the day", async () => {
    const a = await svc.createPlanItem(userId, draft("Morning prayer"));
    const b = await svc.createPlanItem(userId, draft("Reading"));
    const monday = (await svc.getWeeklyPlan(userId)).filter((item) => item.weekday === 1);
    expect(monday.map((item) => item.id)).toEqual([a.id, b.id]);
  });

  it("reorders a day and rejects a stale order", async () => {
    const monday = (await svc.getWeeklyPlan(userId)).filter((item) => item.weekday === 1);
    const [first, second] = monday;
    if (!first || !second) throw new Error("expected two items");

    await svc.reorderPlanDay(userId, { weekday: 1, orderedIds: [second.id, first.id] });
    const reordered = (await svc.getWeeklyPlan(userId)).filter((item) => item.weekday === 1);
    expect(reordered.map((item) => item.id)).toEqual([second.id, first.id]);

    await expect(
      svc.reorderPlanDay(userId, { weekday: 1, orderedIds: [second.id] }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("hides deleted items from the plan", async () => {
    const item = await svc.createPlanItem(userId, draft("To be removed"));
    await svc.deletePlanItem(userId, { itemId: item.id });
    const ids = (await svc.getWeeklyPlan(userId)).map((row) => row.id);
    expect(ids).not.toContain(item.id);
  });
});
