import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";
import postgres from "postgres";

describe.skipIf(!RUN_DB_TESTS)("daily services (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let createTimeBlock: typeof import("@/lib/services/daily").createTimeBlock;

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "block");
    ({ createTimeBlock } = await import("@/lib/services/daily"));
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  // Read rows as the owner of the test user, inside a transaction with app.user_id set.
  const rowsFor = (uid: string) =>
    sql.begin(async (tx) => {
      await tx`select set_config('app.user_id', ${uid}, true)`;
      return tx<
        {
          log_date: string;
          start_minute: number;
          end_minute: number;
          split_group_id: string | null;
          category: string;
        }[]
      >`
            select to_char(log_date, 'YYYY-MM-DD') as log_date,
                start_minute, end_minute, split_group_id, category
            from time_blocks
            where user_id = ${uid} and deleted_at is null
            order by log_date, start_minute`;
    });

  it("stores a 23:00 to 01:00 block as two linked rows on two logical days", async () => {
    await createTimeBlock(userId, {
      logDate: "2026-10-06",
      startMinute: 1380,
      durationMinutes: 120,
      category: "LEARNING",
      activity: "Night study",
      source: "MANUAL",
    });

    const rows = (await rowsFor(userId)).filter((r) => r.log_date >= "2026-10-06");
    expect(rows).toHaveLength(2);

    const [tuesday, wednesday] = rows;
    expect(tuesday).toMatchObject({
      log_date: "2026-10-06",
      start_minute: 1380,
      end_minute: 1440,
    });
    expect(wednesday).toMatchObject({
      log_date: "2026-10-07",
      start_minute: 0,
      end_minute: 60,
    });
    expect(tuesday?.split_group_id).not.toBeNull();
    expect(tuesday?.split_group_id).toBe(wednesday?.split_group_id);
    expect(tuesday?.category).toBe("LEARNING");
  });

  it("stores a block inside one day without a split group", async () => {
    await createTimeBlock(userId, {
      logDate: "2026-10-10",
      startMinute: 540,
      durationMinutes: 90,
      category: "WORK",
      activity: "Deep work",
      source: "MANUAL",
    });

    const rows = (await rowsFor(userId)).filter((r) => r.log_date === "2026-10-10");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.split_group_id).toBeNull();
  });

  it("rejects an invalid payload before touching the database", async () => {
    await expect(
      createTimeBlock(userId, {
        logDate: "2026-10-06",
        startMinute: 1380,
        durationMinutes: 120,
        category: "LEARNING",
        activity: "x",
        userId: "someone-else",
      }),
    ).rejects.toThrow(/invalid/i);
  });

  it("keeps one user's blocks invisible to another user", async () => {
    const otherId = await createTestUser(sql, "other");
    try {
      const rows = await sql.begin(async (tx) => {
        await tx`select set_config('app.user_id', ${otherId}, true)`;
        return tx`select id from time_blocks`;
      });
      expect(rows).toHaveLength(0);
    } finally {
      await deleteTestUser(sql, otherId);
    }
  });
});
