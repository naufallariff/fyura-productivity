// tests/server/db/projects.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { RUN_DB_TESTS, createTestSql, createTestUser, deleteTestUser } from "./helpers";
import { consumeRateToken } from "@/server/db/repositories/projects";
import { withUser } from "@/server/db/tx";

describe.skipIf(!RUN_DB_TESTS)("projects services (requires database)", () => {
  let sql: postgres.Sql;
  let userId = "";
  let svc: typeof import("@/server/services/projects");

  beforeAll(async () => {
    sql = createTestSql();
    userId = await createTestUser(sql, "projects");
    svc = await import("@/server/services/projects");
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(sql, userId);
    await sql.end();
  });

  async function fixture() {
    const board = await svc.createBoard(userId, { title: "Test board", hue: "teal" });
    const todo = await svc.createList(userId, { boardId: board.id, title: "To do" });
    const done = await svc.createList(userId, { boardId: board.id, title: "Done" });
    const a = await svc.createCard(userId, {
      listId: todo.id,
      title: "A",
      beforeId: null,
      afterId: null,
    });
    const b = await svc.createCard(userId, {
      listId: todo.id,
      title: "B",
      beforeId: a.id,
      afterId: null,
    });
    return { board, todo, done, a, b };
  }

  async function allCardIds(listId: string): Promise<string[]> {
    const ids: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await svc.listCards(userId, listId, { limit: 50, archived: "0", cursor });
      ids.push(...page.items.map((card) => card.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    return ids;
  }

  it("appends cards in order", async () => {
    const { todo, a, b } = await fixture();
    expect(await allCardIds(todo.id)).toEqual([a.id, b.id]);
  });

  it("moves a card to another list between two neighbours", async () => {
    const { done, a } = await fixture();
    const finished = await svc.createCard(userId, {
      listId: done.id,
      title: "Finished",
      beforeId: null,
      afterId: null,
    });

    // beforeId is the card that ends up above the moved card.
    await svc.moveCard(userId, {
      cardId: a.id,
      listId: done.id,
      beforeId: finished.id,
      afterId: null,
    });

    expect(await allCardIds(done.id)).toEqual([finished.id, a.id]);
  });

  it("rejects a move whose neighbour is no longer in the target list", async () => {
    const { todo, done, a, b } = await fixture();
    await svc.moveCard(userId, { cardId: b.id, listId: done.id, beforeId: null, afterId: null });
    await expect(
      svc.moveCard(userId, { cardId: a.id, listId: todo.id, beforeId: b.id, afterId: null }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects placing a card next to itself", async () => {
    const { todo, a } = await fixture();
    await expect(
      svc.moveCard(userId, { cardId: a.id, listId: todo.id, beforeId: a.id, afterId: null }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("keeps order correct when repeated inserts exhaust the gap and force a respace", async () => {
    const { todo, a, b } = await fixture();

    // Each new card lands between A and the previous insert. The gap halves every time,
    // so after enough inserts positionBetween returns null and the list must be respaced.
    let after = b.id;
    const inserted: string[] = [];
    for (let index = 0; index < 60; index += 1) {
      const card = await svc.createCard(userId, {
        listId: todo.id,
        title: `Between ${index}`,
        beforeId: a.id,
        afterId: after,
      });
      inserted.push(card.id);
      after = card.id;
    }

    const ids = await allCardIds(todo.id);
    expect(ids).toEqual([a.id, ...inserted.reverse(), b.id]);
  }, 120_000);

  it("rejects a card that would move to a list on another board", async () => {
    const first = await fixture();
    const second = await svc.createBoard(userId, { title: "Other", hue: "rose" });
    const otherList = await svc.createList(userId, { boardId: second.id, title: "Elsewhere" });
    await expect(
      svc.moveCard(userId, {
        cardId: first.a.id,
        listId: otherList.id,
        beforeId: null,
        afterId: null,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("refuses to attach a label from another board", async () => {
    const first = await fixture();
    const second = await svc.createBoard(userId, { title: "Second", hue: "amber" });
    const foreignLabel = await svc.createLabel(userId, {
      boardId: second.id,
      name: "Urgent",
      hue: "rose",
    });
    await expect(
      svc.setCardLabel(userId, { cardId: first.a.id, labelId: foreignLabel.id, on: true }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("counts checklist progress on each card", async () => {
    const { todo, a } = await fixture();
    const one = await svc.createChecklistItem(userId, { cardId: a.id, title: "First" });
    await svc.createChecklistItem(userId, { cardId: a.id, title: "Second" });
    await svc.updateChecklistItem(userId, { itemId: one.id, done: true });

    const page = await svc.listCards(userId, todo.id, { limit: 25, archived: "0" });
    const card = page.items.find((row) => row.id === a.id);
    expect(card?.checklist).toEqual({ done: 1, total: 2 });
  });

  it("paginates boards without skipping or repeating any", async () => {
    await fixture();
    await fixture();
    await fixture();

    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await svc.listBoards(userId, { archived: "0", limit: 1, cursor });
      seen.push(...page.items.map((board) => board.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps another user's boards invisible", async () => {
    await fixture();
    const other = await createTestUser(sql, "projects-other");
    try {
      const page = await svc.listBoards(other, { archived: "0", limit: 25 });
      expect(page.items).toHaveLength(0);
    } finally {
      await deleteTestUser(sql, other);
    }
  });

  it("counts requests per window and refuses the request above the limit", async () => {
    const windowStart = new Date(Math.floor(Date.now() / 60_000) * 60_000);
    const bucket = `test-${Date.now()}`;
    const results: boolean[] = [];
    for (let index = 0; index < 3; index += 1) {
      results.push(
        await withUser(userId, (tx) => consumeRateToken(tx, userId, bucket, windowStart, 2)),
      );
    }
    expect(results).toEqual([true, true, false]);
  });

  it("moves a card to the bottom of a list with placement BOTTOM", async () => {
    const { todo, a, b } = await fixture();
    await svc.moveCard(userId, {
      cardId: a.id,
      listId: todo.id,
      beforeId: null,
      afterId: null,
      placement: "BOTTOM",
    });
    expect(await allCardIds(todo.id)).toEqual([b.id, a.id]);
  });
});
