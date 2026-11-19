// tests/server/db/learning.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";

describe.skipIf(!RUN_DB_TESTS)("learning services (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let svc: typeof import("@/server/services/learning");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "learning");
    svc = await import("@/server/services/learning");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  it("saves a second active subject with a warning and keeps it", async () => {
    const first = await svc.createSubject(userId, {
      name: "AI Agentic",
      kind: "STUDY",
      status: "ACTIVE",
    });
    expect(first.warning).toBe(false);

    const second = await svc.createSubject(userId, {
      name: "DevOps",
      kind: "STUDY",
      status: "ACTIVE",
    });
    expect(second.warning).toBe(true);

    const list = await svc.listSubjects(userId);
    expect(list.items.map((row) => row.name)).toEqual(
      expect.arrayContaining(["AI Agentic", "DevOps"]),
    );
  }, 30_000);

  it("rejects a duplicate subject name", async () => {
    await expect(
      svc.createSubject(userId, { name: "DevOps", kind: "STUDY", status: "QUEUED" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  }, 30_000);

  it("replaces a day's progress instead of adding to it", async () => {
    const subject = await svc.createSubject(userId, {
      name: "Physics",
      kind: "STUDY",
      status: "QUEUED",
    });
    const item = await svc.createItem(userId, {
      subjectId: subject.subject.id,
      title: "Textbook",
      kind: "BOOK",
      totalUnits: 100,
    });

    await svc.logProgress(userId, {
      itemId: item.id,
      logDate: "2026-11-03",
      units: 10,
      minutes: 30,
    });
    const again = await svc.logProgress(userId, {
      itemId: item.id,
      logDate: "2026-11-03",
      units: 15,
      minutes: 40,
    });
    expect(again.completedUnits).toBe(15);
  }, 30_000);

  it("rejects progress above the total and keeps the previous figures", async () => {
    const subject = await svc.createSubject(userId, {
      name: "Chemistry",
      kind: "STUDY",
      status: "QUEUED",
    });
    const item = await svc.createItem(userId, {
      subjectId: subject.subject.id,
      title: "Notes",
      kind: "COURSE",
      totalUnits: 100,
    });

    await svc.logProgress(userId, {
      itemId: item.id,
      logDate: "2026-11-03",
      units: 15,
      minutes: 20,
    });

    await expect(
      svc.logProgress(userId, { itemId: item.id, logDate: "2026-11-04", units: 90, minutes: 60 }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

    const page = await svc.listItems(userId, { subjectId: subject.subject.id, limit: 25 });
    expect(page.items.find((row) => row.id === item.id)?.completedUnits).toBe(15);
  }, 30_000);

  it("moves a queued item to active on first progress", async () => {
    const subject = await svc.createSubject(userId, {
      name: "Biology",
      kind: "STUDY",
      status: "QUEUED",
    });
    const item = await svc.createItem(userId, {
      subjectId: subject.subject.id,
      title: "Cell biology",
      kind: "RESEARCH",
    });

    await svc.logProgress(userId, { itemId: item.id, logDate: "2026-11-05", units: 1, minutes: 5 });

    const page = await svc.listItems(userId, { subjectId: subject.subject.id, limit: 25 });
    expect(page.items.find((row) => row.id === item.id)?.status).toBe("ACTIVE");
  }, 30_000);

  it("creates a review card due today and lists it", async () => {
    const card = await svc.createReviewCard(userId, { itemId: null, prompt: "Explain queues" });
    expect(card.repetitions).toBe(0);

    const due = await svc.listDueReviews(userId, { limit: 50 });
    expect(due.map((row) => row.id)).toContain(card.id);
  }, 30_000);

  it("moves a card to tomorrow after a good answer", async () => {
    const card = await svc.createReviewCard(userId, { itemId: null, prompt: "Explain locks" });
    const reviewed = await svc.submitReview(userId, { cardId: card.id, quality: 5 });
    expect(reviewed.repetitions).toBe(1);
    expect(reviewed.intervalDays).toBe(1);

    const due = await svc.listDueReviews(userId, { limit: 50 });
    expect(due.map((row) => row.id)).not.toContain(card.id);
  }, 30_000);

  it("lets only one of two simultaneous reviews through", async () => {
    const card = await svc.createReviewCard(userId, { itemId: null, prompt: "Explain indexes" });

    const results = await Promise.allSettled([
      svc.submitReview(userId, { cardId: card.id, quality: 5 }),
      svc.submitReview(userId, { cardId: card.id, quality: 5 }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatchObject({ code: "CONFLICT" });
  }, 60_000);

  it("keeps another user's subjects invisible", async () => {
    await svc.createSubject(userId, { name: "Private subject", kind: "FAITH", status: "QUEUED" });
    const other = await createTestUser(sql, "learning-other");
    try {
      const list = await svc.listSubjects(other);
      expect(list.items).toHaveLength(0);
    } finally {
      await deleteTestUser(sql, other);
    }
  }, 30_000);
});
