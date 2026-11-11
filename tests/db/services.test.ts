import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";

describe.skipIf(!RUN_DB_TESTS)("daily services (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let createTimeBlock: typeof import("@/lib/services/daily").createTimeBlock;

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "block");
    const svc = await import("@/lib/services/daily");
    await svc.ensureDefaultHabits(userId);
    ({ createTimeBlock } = await import("@/lib/services/daily"));
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  const habitIdOf = (uid: string, key: string) =>
    sql.begin(async (tx) => {
      await tx`select set_config('app.user_id', ${uid}, true)`;
      const [row] = await tx<{ id: string }[]>`
      select id from habits where user_id = ${uid} and key = ${key}`;
      return row?.id ?? "";
    });

  const checkOf = (uid: string, date: string, key: string) =>
    sql.begin(async (tx) => {
      await tx`select set_config('app.user_id', ${uid}, true)`;
      const [row] = await tx<{ value: number; source: string }[]>`
      select hc.value, hc.source
      from habit_checks hc
      join habits h on h.id = hc.habit_id
      where hc.user_id = ${uid} and h.key = ${key} and hc.log_date = ${date}`;
      return row ?? null;
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

  it("rejects a block that overlaps an existing block on the same day", async () => {
    await createTimeBlock(userId, {
      logDate: "2026-10-12",
      startMinute: 540,
      durationMinutes: 60,
      category: "WORK",
      activity: "First",
      source: "MANUAL",
    });

    await expect(
      createTimeBlock(userId, {
        logDate: "2026-10-12",
        startMinute: 570,
        durationMinutes: 60,
        category: "WORK",
        activity: "Second",
        source: "MANUAL",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("moves a block and rejects a move that overlaps another block", async () => {
    const { moveTimeBlock } = await import("@/lib/services/daily");

    const first = await createTimeBlock(userId, {
      logDate: "2026-10-14",
      startMinute: 540,
      durationMinutes: 60,
      category: "WORK",
      activity: "A",
      source: "MANUAL",
    });
    await createTimeBlock(userId, {
      logDate: "2026-10-14",
      startMinute: 720,
      durationMinutes: 60,
      category: "WORK",
      activity: "B",
      source: "MANUAL",
    });

    await moveTimeBlock(userId, { blockId: first, startMinute: 600, endMinute: 660 });
    await expect(
      moveTimeBlock(userId, { blockId: first, startMinute: 700, endMinute: 760 }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("derives the quran habit from a worship block", async () => {
    const svc = await import("@/lib/services/daily");
    await svc.createTimeBlock(userId, {
      logDate: "2026-10-20",
      startMinute: 360,
      durationMinutes: 15,
      category: "WORSHIP",
      activity: "Quran",
      source: "MANUAL",
    });
    expect(await checkOf(userId, "2026-10-20", "quran")).toMatchObject({
      value: 15,
      source: "BLOCK",
    });
  });

  it("keeps a manual entry when a matching block is added later", async () => {
    const svc = await import("@/lib/services/daily");
    await svc.setHabitCheck(userId, {
      habitId: await habitIdOf(userId, "quran"),
      logDate: "2026-10-21",
      value: 0,
    });
    await svc.createTimeBlock(userId, {
      logDate: "2026-10-21",
      startMinute: 360,
      durationMinutes: 15,
      category: "WORSHIP",
      activity: "Quran",
      source: "MANUAL",
    });
    expect(await checkOf(userId, "2026-10-21", "quran")).toMatchObject({
      value: 0,
      source: "MANUAL",
    });
  });

  it("clears the derived value when its block is deleted", async () => {
    const svc = await import("@/lib/services/daily");
    const blockId = await svc.createTimeBlock(userId, {
      logDate: "2026-10-22",
      startMinute: 360,
      durationMinutes: 15,
      category: "WORSHIP",
      activity: "Quran",
      source: "MANUAL",
    });
    expect(await checkOf(userId, "2026-10-22", "quran")).not.toBeNull();

    await svc.deleteTimeBlock(userId, blockId);
    expect(await checkOf(userId, "2026-10-22", "quran")).toBeNull();
  });

  it("a completed deep session creates a deep work block and counts toward habits", async () => {
    const { logFocusSession } = await import("@/lib/services/focus");
    const start = new Date("2026-10-25T01:00:00Z");
    await logFocusSession(userId, {
      logDate: "2026-10-25",
      kind: "DEEP",
      plannedMinutes: 25,
      startedAt: start.toISOString(),
      endedAt: new Date(start.getTime() + 25 * 60_000).toISOString(),
    });

    const rows = await sql.begin(async (tx) => {
      await tx`select set_config('app.user_id', ${userId}, true)`;
      return tx`select activity, source from time_blocks
        where user_id = ${userId} and log_date = '2026-10-25' and deleted_at is null`;
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ activity: "Deep work", source: "TIMER" });
  });

  it("a stopped deep session is recorded but creates no block", async () => {
    const { logFocusSession } = await import("@/lib/services/focus");
    const start = new Date("2026-10-26T01:00:00Z");
    await logFocusSession(userId, {
      logDate: "2026-10-26",
      kind: "DEEP",
      plannedMinutes: 50,
      startedAt: start.toISOString(),
      endedAt: new Date(start.getTime() + 10 * 60_000).toISOString(),
    });

    const rows = await sql.begin(async (tx) => {
      await tx`select set_config('app.user_id', ${userId}, true)`;
      return tx`select id from time_blocks
        where user_id = ${userId} and log_date = '2026-10-26' and deleted_at is null`;
    });
    expect(rows).toHaveLength(0);
  });
});
