// server/services/projects.ts
import "server-only";
import { withUser, type Tx } from "@/server/db/tx";
import { decodeCursor, toPage, type Page } from "@/server/db/cursor";
import {
  checklistForCard,
  checklistForCards,
  deleteChecklistRow,
  deleteLabelRow,
  deleteListRow,
  findBoard,
  findCard,
  findChecklistItem,
  findLabel,
  findList,
  insertBoard,
  insertCard,
  insertChecklistItem,
  insertLabel,
  insertList,
  labelLinksForCards,
  listActiveCards,
  listActiveLists,
  listBoardsPage,
  listCardsPage,
  listLabels,
  setCardLabelLink,
  setCardPlacement,
  setCardPositions,
  setListPositions,
  sortActiveCardsByDueDate,
  updateBoardRow,
  updateCardRow,
  updateChecklistRow,
  updateLabelRow,
  updateListRow,
  type BoardRow,
  type CardRow,
  type ChecklistRow,
  type LabelRow,
  type ListRow,
} from "@/server/db/repositories/projects";
import {
  BoardsQuery,
  CardsQuery,
  CreateBoardInput,
  CreateCardInput,
  CreateChecklistItemInput,
  CreateLabelInput,
  CreateListInput,
  DeleteChecklistItemInput,
  DeleteLabelInput,
  ListIdInput,
  MoveCardInput,
  MoveListInput,
  SetCardLabelInput,
  UpdateBoardInput,
  UpdateCardInput,
  UpdateChecklistItemInput,
  UpdateLabelInput,
  UpdateListInput,
} from "@/server/validation/projects";
import { DomainError } from "@/server/services/errors";
import { parse } from "@/server/services/parse";
import { POSITION_STEP, positionBetween, respacedPositions } from "@/domain/projects/position";
import { dueState, type DueState } from "@/domain/projects/due";
import { addDays } from "@/domain/time/logical-date";
import { todayFor } from "@/server/services/user";

/* ---------- DTOs (what the client receives) ---------- */

export interface BoardDto {
  readonly id: string;
  readonly title: string;
  readonly hue: string;
  readonly starred: boolean;
  readonly archived: boolean;
  readonly updatedAt: string;
}

export interface ListDto {
  readonly id: string;
  readonly boardId: string;
  readonly title: string;
  readonly position: number;
  readonly archived: boolean;
}

export interface LabelDto {
  readonly id: string;
  readonly name: string;
  readonly hue: string;
}

export interface CardDto {
  readonly id: string;
  readonly boardId: string;
  readonly listId: string;
  readonly title: string;
  readonly position: number;
  readonly dueOn: string | null;
  readonly dueComplete: boolean;
  readonly dueState: DueState;
  readonly archived: boolean;
  readonly labelIds: string[];
  readonly checklist: { readonly done: number; readonly total: number };
}

export interface ChecklistItemDto {
  readonly id: string;
  readonly cardId: string;
  readonly title: string;
  readonly done: boolean;
  readonly position: number;
}

export interface CardDetailDto extends CardDto {
  readonly description: string | null;
  readonly items: ChecklistItemDto[];
}

/** Any row with an id and a position. Used by slot resolution. */
interface Sibling {
  readonly id: string;
  readonly position: number;
}

function toBoardDto(row: BoardRow): BoardDto {
  return {
    id: row.id,
    title: row.title,
    hue: row.hue,
    starred: row.starred,
    archived: row.archivedAt !== null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toListDto(row: ListRow): ListDto {
  return {
    id: row.id,
    boardId: row.boardId,
    title: row.title,
    position: row.position,
    archived: row.archivedAt !== null,
  };
}

function toLabelDto(row: LabelRow): LabelDto {
  return { id: row.id, name: row.name, hue: row.hue };
}

function toChecklistDto(row: ChecklistRow): ChecklistItemDto {
  return {
    id: row.id,
    cardId: row.cardId,
    title: row.title,
    done: row.isDone,
    position: row.position,
  };
}

/** Adds labels and checklist progress to a batch of card rows, using two queries in total. */
async function hydrateCards(
  tx: Tx,
  userId: string,
  rows: readonly CardRow[],
  today: string,
): Promise<CardDto[]> {
  const ids = rows.map((row) => row.id);
  const [links, items] = await Promise.all([
    labelLinksForCards(tx, userId, ids),
    checklistForCards(tx, userId, ids),
  ]);

  const labelsByCard = new Map<string, string[]>();
  for (const link of links) {
    const bucket = labelsByCard.get(link.cardId) ?? [];
    bucket.push(link.labelId);
    labelsByCard.set(link.cardId, bucket);
  }

  const checklistByCard = new Map<string, { done: number; total: number }>();
  for (const item of items) {
    const progress = checklistByCard.get(item.cardId) ?? { done: 0, total: 0 };
    progress.total += 1;
    if (item.isDone) progress.done += 1;
    checklistByCard.set(item.cardId, progress);
  }

  return rows.map((row) => ({
    id: row.id,
    boardId: row.boardId,
    listId: row.listId,
    title: row.title,
    position: row.position,
    dueOn: row.dueOn,
    dueComplete: row.dueComplete,
    dueState: dueState(row.dueOn, row.dueComplete, today),
    archived: row.archivedAt !== null,
    labelIds: labelsByCard.get(row.id) ?? [],
    checklist: checklistByCard.get(row.id) ?? { done: 0, total: 0 },
  }));
}

/* ---------- Slot resolution (shared by cards and lists) ---------- */

/**
 * Finds a position between the requested neighbours.
 * Each attempt reloads the siblings. After a respace the old positions are gone,
 * so a retry that reused them would never succeed.
 * A neighbour that is no longer in the target means the client view is stale.
 */
async function resolveSlot(options: {
  readonly load: () => Promise<readonly Sibling[]>;
  readonly respace: () => Promise<void>;
  readonly selfId: string | null;
  readonly beforeId: string | null;
  readonly afterId: string | null;
  readonly defaultEnd: boolean;
}): Promise<number> {
  const { load, respace, selfId, beforeId, afterId, defaultEnd } = options;

  if (selfId !== null && (beforeId === selfId || afterId === selfId)) {
    throw new DomainError("CONFLICT", "An item cannot be placed next to itself");
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const siblings = await load();
    const others = siblings.filter((row) => row.id !== selfId);

    const lookup = (id: string): number => {
      const match = others.find((row) => row.id === id);
      if (!match) throw new DomainError("CONFLICT", "The board changed. Refresh and try again.");
      return match.position;
    };

    let before = beforeId === null ? null : lookup(beforeId);
    let after = afterId === null ? null : lookup(afterId);

    if (before === null && after === null) {
      if (defaultEnd) before = others.at(-1)?.position ?? null;
      else after = others[0]?.position ?? null;
    }

    if (before !== null && after !== null && after <= before) {
      throw new DomainError("CONFLICT", "The board changed. Refresh and try again.");
    }

    const position = positionBetween(before, after);
    if (position !== null) return position;

    if (attempt === 0) await respace();
  }

  throw new DomainError("CONFLICT", "The board changed. Refresh and try again.");
}

async function respaceCards(tx: Tx, userId: string, listId: string): Promise<void> {
  const ordered = await listActiveCards(tx, userId, listId);
  const positions = respacedPositions(ordered.length);
  await setCardPositions(
    tx,
    userId,
    ordered.map((row, index) => ({ id: row.id, position: positions[index] ?? 0 })),
  );
}

async function respaceLists(tx: Tx, userId: string, boardId: string): Promise<void> {
  const ordered = await listActiveLists(tx, userId, boardId);
  const positions = respacedPositions(ordered.length);
  await setListPositions(
    tx,
    userId,
    ordered.map((row, index) => ({ id: row.id, position: positions[index] ?? 0 })),
  );
}

/* ---------- Boards ---------- */

function parseBoardCursor(key: string): { at: Date; id: string } {
  const [at, id] = key.split("|");
  const date = new Date(at ?? "");
  if (!id || Number.isNaN(date.getTime())) {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
  return { at: date, id };
}

export async function listBoards(userId: string, input: unknown): Promise<Page<BoardDto>> {
  const query = parse(BoardsQuery, input);
  const cursor = decodeCursor(query.cursor);
  const position = cursor ? parseBoardCursor(cursor.key) : null;

  return withUser(userId, async (tx) => {
    const rows = await listBoardsPage(
      tx,
      userId,
      query.archived === "1",
      position,
      query.limit + 1,
    );
    const page = toPage(rows, query.limit, (row) => ({
      key: `${row.updatedAt.toISOString()}|${row.id}`,
      id: row.id,
    }));
    return { items: page.items.map(toBoardDto), nextCursor: page.nextCursor };
  });
}

export async function createBoard(userId: string, input: unknown): Promise<BoardDto> {
  const parsed = parse(CreateBoardInput, input);
  return withUser(userId, async (tx) => {
    const row = await insertBoard(tx, { userId, title: parsed.title, hue: parsed.hue });
    return toBoardDto(row);
  });
}

export async function updateBoard(userId: string, input: unknown): Promise<void> {
  const { boardId, archived, ...rest } = parse(UpdateBoardInput, input);
  await withUser(userId, async (tx) => {
    const row = await updateBoardRow(tx, userId, boardId, {
      ...rest,
      ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
    });
    if (!row) throw new DomainError("NOT_FOUND", "Board not found");
  });
}

/** Board header, active lists, and labels in one transaction. Cards are loaded per list. */
export async function getBoardSnapshot(userId: string, boardId: string) {
  return withUser(userId, async (tx) => {
    const board = await findBoard(tx, userId, boardId);
    if (!board) throw new DomainError("NOT_FOUND", "Board not found");

    const [lists, labels] = await Promise.all([
      listActiveLists(tx, userId, boardId),
      listLabels(tx, userId, boardId),
    ]);
    return {
      board: toBoardDto(board),
      lists: lists.map(toListDto),
      labels: labels.map(toLabelDto),
    };
  });
}

/* ---------- Lists ---------- */

export async function createList(userId: string, input: unknown): Promise<ListDto> {
  const parsed = parse(CreateListInput, input);
  return withUser(userId, async (tx) => {
    const board = await findBoard(tx, userId, parsed.boardId);
    if (!board || board.archivedAt) throw new DomainError("NOT_FOUND", "Board not found");

    const lists = await listActiveLists(tx, userId, parsed.boardId);
    const position = positionBetween(lists.at(-1)?.position ?? null, null) ?? POSITION_STEP;

    const row = await insertList(tx, {
      userId,
      boardId: parsed.boardId,
      title: parsed.title,
      position,
    });
    return toListDto(row);
  });
}

export async function updateList(userId: string, input: unknown): Promise<void> {
  const { listId, archived, ...rest } = parse(UpdateListInput, input);
  await withUser(userId, async (tx) => {
    const row = await updateListRow(tx, userId, listId, {
      ...rest,
      ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
    });
    if (!row) throw new DomainError("NOT_FOUND", "List not found");
  });
}

export async function moveList(userId: string, input: unknown): Promise<void> {
  const parsed = parse(MoveListInput, input);

  await withUser(userId, async (tx) => {
    const list = await findList(tx, userId, parsed.listId);
    if (!list || list.archivedAt) throw new DomainError("NOT_FOUND", "List not found");

    const position = await resolveSlot({
      load: () => listActiveLists(tx, userId, list.boardId),
      respace: () => respaceLists(tx, userId, list.boardId),
      selfId: list.id,
      beforeId: parsed.beforeId,
      afterId: parsed.afterId,
      defaultEnd: false,
    });

    await updateListRow(tx, userId, list.id, { position });
  });
}

export async function deleteList(userId: string, input: unknown): Promise<void> {
  const { listId } = parse(ListIdInput, input);
  await withUser(userId, async (tx) => {
    if (!(await deleteListRow(tx, userId, listId))) {
      throw new DomainError("NOT_FOUND", "List not found");
    }
  });
}

export async function sortListByDueDate(userId: string, input: unknown): Promise<void> {
  const { listId } = parse(ListIdInput, input);
  await withUser(userId, async (tx) => {
    const list = await findList(tx, userId, listId);
    if (!list || list.archivedAt) throw new DomainError("NOT_FOUND", "List not found");
    await sortActiveCardsByDueDate(tx, userId, listId, POSITION_STEP);
  });
}

/* ---------- Cards ---------- */

function parseCardCursor(key: string): { position: number; id: string } {
  const [raw, id] = key.split("|");
  const position = Number(raw);
  if (!id || !Number.isFinite(position)) {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
  return { position, id };
}

export async function listCards(
  userId: string,
  listId: string,
  input: unknown,
): Promise<Page<CardDto>> {
  const query = parse(CardsQuery, input);
  const cursor = decodeCursor(query.cursor);
  const position = cursor ? parseCardCursor(cursor.key) : null;

  return withUser(userId, async (tx) => {
    const { today } = await todayFor(tx, userId);
    const list = await findList(tx, userId, listId);
    if (!list) throw new DomainError("NOT_FOUND", "List not found");

    const rows = await listCardsPage(
      tx,
      userId,
      listId,
      {
        archived: query.archived === "1",
        q: query.q ? query.q : undefined,
        labelId: query.label,
        due: query.due,
        today,
        weekEnd: addDays(today, 6),
      },
      position,
      query.limit + 1,
    );

    const page = toPage(rows, query.limit, (row) => ({
      key: `${row.position}|${row.id}`,
      id: row.id,
    }));
    return {
      items: await hydrateCards(tx, userId, page.items, today),
      nextCursor: page.nextCursor,
    };
  });
}

export async function getCard(userId: string, cardId: string): Promise<CardDetailDto> {
  return withUser(userId, async (tx) => {
    const { today } = await todayFor(tx, userId);
    const card = await findCard(tx, userId, cardId);
    if (!card) throw new DomainError("NOT_FOUND", "Card not found");

    const [dtos, items] = await Promise.all([
      hydrateCards(tx, userId, [card], today),
      checklistForCard(tx, userId, cardId),
    ]);
    const dto = dtos[0];
    if (!dto) throw new DomainError("NOT_FOUND", "Card not found");

    return {
      ...dto,
      description: card.description,
      items: items.map(toChecklistDto),
    };
  });
}

export async function createCard(userId: string, input: unknown): Promise<CardDto> {
  const parsed = parse(CreateCardInput, input);

  return withUser(userId, async (tx) => {
    const { today } = await todayFor(tx, userId);
    const list = await findList(tx, userId, parsed.listId);
    if (!list || list.archivedAt) throw new DomainError("NOT_FOUND", "List not found");

    const position = await resolveSlot({
      load: () => listActiveCards(tx, userId, list.id),
      respace: () => respaceCards(tx, userId, list.id),
      selfId: null,
      beforeId: parsed.beforeId,
      afterId: parsed.afterId,
      defaultEnd: true,
    });

    const row = await insertCard(tx, {
      userId,
      boardId: list.boardId,
      listId: list.id,
      title: parsed.title,
      position,
    });
    const [dto] = await hydrateCards(tx, userId, [row], today);
    if (!dto) throw new Error("createCard: hydration returned nothing");
    return dto;
  });
}

export async function updateCard(userId: string, input: unknown): Promise<void> {
  const { cardId, archived, ...rest } = parse(UpdateCardInput, input);
  await withUser(userId, async (tx) => {
    const row = await updateCardRow(tx, userId, cardId, {
      ...rest,
      ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
    });
    if (!row) throw new DomainError("NOT_FOUND", "Card not found");
  });
}

/**
 * Moves a card within its board, to another list or to another place in the same list.
 * The position is computed here from the neighbours. The client never sends a number.
 */
export async function moveCard(userId: string, input: unknown): Promise<void> {
  const parsed = parse(MoveCardInput, input);

  await withUser(userId, async (tx) => {
    const card = await findCard(tx, userId, parsed.cardId);
    if (!card || card.archivedAt) throw new DomainError("NOT_FOUND", "Card not found");

    const target = await findList(tx, userId, parsed.listId);
    if (!target || target.archivedAt) throw new DomainError("NOT_FOUND", "List not found");
    if (target.boardId !== card.boardId) {
      throw new DomainError("VALIDATION_FAILED", "A card can only move within its board");
    }

    const position = await resolveSlot({
      load: () => listActiveCards(tx, userId, target.id),
      respace: () => respaceCards(tx, userId, target.id),
      selfId: card.id,
      beforeId: parsed.beforeId,
      afterId: parsed.afterId,
      defaultEnd: parsed.placement === "BOTTOM",
    });

    await setCardPlacement(tx, userId, card.id, target.id, position);
  });
}

/* ---------- Labels ---------- */

export async function createLabel(userId: string, input: unknown): Promise<LabelDto> {
  const parsed = parse(CreateLabelInput, input);
  return withUser(userId, async (tx) => {
    const board = await findBoard(tx, userId, parsed.boardId);
    if (!board) throw new DomainError("NOT_FOUND", "Board not found");
    const row = await insertLabel(tx, {
      userId,
      boardId: board.id,
      name: parsed.name,
      hue: parsed.hue,
    });
    return toLabelDto(row);
  });
}

export async function updateLabel(userId: string, input: unknown): Promise<void> {
  const { labelId, ...rest } = parse(UpdateLabelInput, input);
  await withUser(userId, async (tx) => {
    const row = await updateLabelRow(tx, userId, labelId, rest);
    if (!row) throw new DomainError("NOT_FOUND", "Label not found");
  });
}

export async function deleteLabel(userId: string, input: unknown): Promise<void> {
  const parsed = parse(DeleteLabelInput, input);
  await withUser(userId, async (tx) => {
    const removed = await deleteLabelRow(tx, userId, parsed.labelId);
    if (!removed) throw new DomainError("NOT_FOUND", "Label not found");
  });
}

export async function setCardLabel(userId: string, input: unknown): Promise<void> {
  const parsed = parse(SetCardLabelInput, input);
  await withUser(userId, async (tx) => {
    const card = await findCard(tx, userId, parsed.cardId);
    if (!card) throw new DomainError("NOT_FOUND", "Card not found");

    const label = await findLabel(tx, userId, parsed.labelId);
    if (!label || label.boardId !== card.boardId) {
      throw new DomainError("VALIDATION_FAILED", "Label does not belong to this board");
    }
    await setCardLabelLink(tx, userId, card.boardId, card.id, label.id, parsed.on);
  });
}

/* ---------- Checklist ---------- */

export async function createChecklistItem(
  userId: string,
  input: unknown,
): Promise<ChecklistItemDto> {
  const parsed = parse(CreateChecklistItemInput, input);
  return withUser(userId, async (tx) => {
    const card = await findCard(tx, userId, parsed.cardId);
    if (!card) throw new DomainError("NOT_FOUND", "Card not found");

    const items = await checklistForCard(tx, userId, card.id);
    const position = positionBetween(items.at(-1)?.position ?? null, null) ?? POSITION_STEP;

    const row = await insertChecklistItem(tx, {
      userId,
      boardId: card.boardId,
      cardId: card.id,
      title: parsed.title,
      position,
    });
    return toChecklistDto(row);
  });
}

export async function updateChecklistItem(userId: string, input: unknown): Promise<void> {
  const { itemId, done, ...rest } = parse(UpdateChecklistItemInput, input);
  await withUser(userId, async (tx) => {
    const existing = await findChecklistItem(tx, userId, itemId);
    if (!existing) throw new DomainError("NOT_FOUND", "Checklist item not found");

    const doneFields = done === undefined ? {} : { isDone: done, doneAt: done ? new Date() : null };

    await updateChecklistRow(tx, userId, itemId, { ...rest, ...doneFields });
  });
}

export async function deleteChecklistItem(userId: string, input: unknown): Promise<void> {
  const parsed = parse(DeleteChecklistItemInput, input);
  await withUser(userId, async (tx) => {
    const removed = await deleteChecklistRow(tx, userId, parsed.itemId);
    if (!removed) throw new DomainError("NOT_FOUND", "Checklist item not found");
  });
}
