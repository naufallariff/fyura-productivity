// tests/server/db/capture-tadabur.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";

describe.skipIf(!RUN_DB_TESTS)("capture and tadabur services (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let capture: typeof import("@/server/services/capture");
  let tadabur: typeof import("@/server/services/tadabur");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "capture");
    capture = await import("@/server/services/capture");
    tadabur = await import("@/server/services/tadabur");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  it("stores normalized tags and finds the idea by tag", async () => {
    const idea = await capture.createIdea(userId, {
      title: "Learn queues",
      body: "",
      tags: ["Ai", "ai", "deep-work"],
    });
    expect(idea.tags).toEqual(["ai", "deep-work"]);

    const page = await capture.listIdeas(userId, { tag: "AI", limit: 25 });
    expect(page.items.map((row) => row.id)).toContain(idea.id);
  }, 30_000);

  it("matches search text literally", async () => {
    await capture.createIdea(userId, { title: "100% plan", body: "", tags: [] });
    await capture.createIdea(userId, { title: "planning", body: "", tags: [] });

    const page = await capture.listIdeas(userId, { q: "%", limit: 50 });
    expect(page.items.length).toBeGreaterThanOrEqual(1);
    expect(page.items.every((row) => row.title.includes("%"))).toBe(true);
  }, 30_000);

  it("hides archived ideas and removes their tags from the cloud", async () => {
    const idea = await capture.createIdea(userId, {
      title: "Old note",
      body: "",
      tags: ["archive-me"],
    });
    await capture.updateIdea(userId, { ideaId: idea.id, status: "ARCHIVED" });

    const page = await capture.listIdeas(userId, { limit: 50 });
    expect(page.items.map((row) => row.id)).not.toContain(idea.id);

    const cloud = await capture.listTagCloud(userId);
    expect(cloud.map((row) => row.tag)).not.toContain("archive-me");
  }, 30_000);

  it("pages ideas without skipping or repeating any", async () => {
    for (const title of ["A1", "A2", "A3"]) {
      await capture.createIdea(userId, { title, body: "", tags: [] });
    }

    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await capture.listIdeas(userId, { limit: 1, cursor });
      seen.push(...page.items.map((row) => row.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it("keeps another user's ideas invisible", async () => {
    await capture.createIdea(userId, { title: "Private idea", body: "", tags: [] });
    const other = await createTestUser(sql, "capture-other");
    try {
      const page = await capture.listIdeas(other, { limit: 50 });
      expect(page.items).toHaveLength(0);
    } finally {
      await deleteTestUser(sql, other);
    }
  }, 30_000);

  it("stores a tadabur entry and filters by surah", async () => {
    await tadabur.createTadabur(userId, {
      logDate: "2026-11-10",
      surah: 2,
      ayatFrom: 255,
      ayatTo: 255,
      reflection: "Ayat kursi",
    });
    await tadabur.createTadabur(userId, {
      logDate: "2026-11-10",
      surah: 1,
      ayatFrom: 1,
      ayatTo: 7,
      reflection: "Al-Fatihah",
    });

    const page = await tadabur.listTadabur(userId, { surah: 2, limit: 25 });
    expect(page.items.length).toBeGreaterThanOrEqual(1);
    expect(page.items.every((row) => row.surah === 2)).toBe(true);
  }, 30_000);

  it("rejects an ayat range that ends before it starts", async () => {
    await expect(
      tadabur.createTadabur(userId, {
        logDate: "2026-11-10",
        surah: 2,
        ayatFrom: 9,
        ayatTo: 3,
        reflection: "x",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("rejects an update that would invert the ayat range", async () => {
    const entry = await tadabur.createTadabur(userId, {
      logDate: "2026-11-10",
      surah: 2,
      ayatFrom: 1,
      ayatTo: 5,
      reflection: "x",
    });
    await expect(
      tadabur.updateTadabur(userId, { entryId: entry.id, ayatFrom: 9 }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("soft-deletes an entry and reports NOT_FOUND on a second delete", async () => {
    const entry = await tadabur.createTadabur(userId, {
      logDate: "2026-11-10",
      surah: 3,
      ayatFrom: 1,
      ayatTo: 2,
      reflection: "to remove",
    });
    await tadabur.deleteTadabur(userId, { entryId: entry.id });

    const page = await tadabur.listTadabur(userId, { limit: 50 });
    expect(page.items.map((row) => row.id)).not.toContain(entry.id);

    await expect(tadabur.deleteTadabur(userId, { entryId: entry.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  }, 30_000);
});
