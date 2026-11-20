// tests/server/db/timezone.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";

describe.skipIf(!RUN_DB_TESTS)("user time zone (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let user: typeof import("@/server/services/user");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "timezone");
    user = await import("@/server/services/user");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  it("stores a valid zone and reports it back with today's date", async () => {
    await user.setUserTimeZone(userId, { timeZone: "Asia/Makassar" });
    const day = await user.getUserDay(userId);
    expect(day.timeZone).toBe("Asia/Makassar");
    expect(day.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }, 30_000);

  it("rejects an unknown zone", async () => {
    await expect(user.setUserTimeZone(userId, { timeZone: "Mars/Base" })).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
  }, 30_000);
});
