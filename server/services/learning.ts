// server/services/learning.ts
import "server-only";
import { withUser } from "@/server/db/tx";
import { decodeCursor, toPage, type Page } from "@/server/db/cursor";
import { definedFields } from "@/server/db/patch";
import { env } from "@/server/config/env";
import {
  completedUnitsByItem,
  countActiveSubjects,
  insertItem,
  insertReviewCard,
  insertSubject,
  selectDueCards,
  selectItem,
  selectItemsPage,
  selectSubject,
  selectSubjectByName,
  selectSubjects,
  updateItemRow,
  updateReviewCardRow,
  updateSubjectRow,
  upsertProgress,
  lockReviewCard,
  detachReviewCards,
  deleteItemRow,
  type ItemPosition,
  type ItemRow,
  type ReviewRow,
  type SubjectRow,
} from "@/server/db/repositories/learning";
import {
  CreateItemInput,
  CreateReviewInput,
  CreateSubjectInput,
  DueQuery,
  ItemsQuery,
  LogProgressInput,
  SubmitReviewInput,
  UpdateItemInput,
  UpdateSubjectInput,
  PurgeItemInput,
} from "@/server/validation/learning";
import {
  WIP_LIMIT,
  exceedsTotal,
  wipExceeded,
  type ItemStatus,
  type SubjectStatus,
} from "@/domain/learning/model";
import { INITIAL_SM2_STATE, nextSm2State, toQuality } from "@/domain/learning/sm2";
import { addDays } from "@/domain/time/logical-date";
import { localIsoDate } from "@/domain/time/local-date";
import { DomainError } from "./errors";
import { parse } from "./parse";

/* ---------- DTOs ---------- */

export interface SubjectDto {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly status: SubjectStatus;
  readonly updatedAt: string;
}

export interface SubjectListDto {
  readonly items: SubjectDto[];
  readonly activeCount: number;
  readonly wipLimit: number;
}

export interface ItemDto {
  readonly id: string;
  readonly subjectId: string;
  readonly title: string;
  readonly kind: string;
  readonly sourceUrl: string | null;
  readonly totalUnits: number | null;
  readonly completedUnits: number;
  readonly status: ItemStatus;
  readonly updatedAt: string;
}

export interface ReviewDto {
  readonly id: string;
  readonly itemId: string | null;
  readonly prompt: string;
  readonly dueOn: string;
  readonly ef: number;
  readonly intervalDays: number;
  readonly repetitions: number;
  readonly lastQuality: number | null;
}

function todayIso(): string {
  return localIsoDate(new Date(), env.DEFAULT_TIMEZONE);
}

/** Empty text from a form is stored as null, so "no value" has one representation. */
function blankToNull(value: string): string | null {
  return value === "" ? null : value;
}

function toSubjectDto(row: SubjectRow): SubjectDto {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    status: row.status as SubjectStatus,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toItemDto(row: ItemRow, completedUnits: number): ItemDto {
  return {
    id: row.id,
    subjectId: row.subjectId,
    title: row.title,
    kind: row.kind,
    sourceUrl: row.sourceUrl,
    totalUnits: row.totalUnits,
    completedUnits,
    status: row.status as ItemStatus,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toReviewDto(row: ReviewRow): ReviewDto {
  return {
    id: row.id,
    itemId: row.itemId,
    prompt: row.prompt,
    dueOn: row.dueOn,
    ef: row.ef,
    intervalDays: row.intervalDays,
    repetitions: row.repetitions,
    lastQuality: row.lastQuality,
  };
}

function parseItemCursor(key: string): ItemPosition {
  const [iso, id] = key.split("|");
  const at = new Date(iso ?? "");
  if (!id || Number.isNaN(at.getTime())) {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
  return { at, id };
}

/* ---------- Subjects ---------- */

export async function listSubjects(userId: string): Promise<SubjectListDto> {
  return withUser(userId, async (tx) => {
    const rows = await selectSubjects(tx, userId);
    return {
      items: rows.map(toSubjectDto),
      activeCount: rows.filter((row) => row.status === "ACTIVE").length,
      wipLimit: WIP_LIMIT,
    };
  });
}

/** Returns warning: true when the subject was saved as ACTIVE beyond the soft limit. */
export async function createSubject(
  userId: string,
  input: unknown,
): Promise<{ subject: SubjectDto; warning: boolean }> {
  const parsed = parse(CreateSubjectInput, input);

  return withUser(userId, async (tx) => {
    if (await selectSubjectByName(tx, userId, parsed.name)) {
      throw new DomainError("CONFLICT", "A subject with this name already exists");
    }
    const warning =
      parsed.status === "ACTIVE" && wipExceeded(await countActiveSubjects(tx, userId));

    const row = await insertSubject(tx, {
      userId,
      name: parsed.name,
      kind: parsed.kind,
      status: parsed.status,
    });
    return { subject: toSubjectDto(row), warning };
  });
}

export async function updateSubject(userId: string, input: unknown): Promise<{ warning: boolean }> {
  const { subjectId, ...fields } = parse(UpdateSubjectInput, input);

  return withUser(userId, async (tx) => {
    const current = await selectSubject(tx, userId, subjectId);
    if (!current) throw new DomainError("NOT_FOUND", "Subject not found");

    if (fields.name !== undefined) {
      const clash = await selectSubjectByName(tx, userId, fields.name);
      if (clash && clash.id !== subjectId) {
        throw new DomainError("CONFLICT", "A subject with this name already exists");
      }
    }

    const becomesActive = fields.status === "ACTIVE" && current.status !== "ACTIVE";
    const warning = becomesActive && wipExceeded(await countActiveSubjects(tx, userId));

    const row = await updateSubjectRow(tx, userId, subjectId, definedFields(fields));
    if (!row) throw new DomainError("NOT_FOUND", "Subject not found");
    return { warning };
  });
}

/* ---------- Items ---------- */

export async function listItems(userId: string, input: unknown): Promise<Page<ItemDto>> {
  const query = parse(ItemsQuery, input);
  const cursor = decodeCursor(query.cursor);
  const position = cursor ? parseItemCursor(cursor.key) : null;

  return withUser(userId, async (tx) => {
    const rows = await selectItemsPage(
      tx,
      userId,
      { subjectId: query.subjectId, status: query.status },
      position,
      query.limit + 1,
    );
    const page = toPage(rows, query.limit, (row) => ({
      key: `${row.updatedAt.toISOString()}|${row.id}`,
      id: row.id,
    }));
    const completed = await completedUnitsByItem(
      tx,
      userId,
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) => toItemDto(row, completed.get(row.id) ?? 0)),
      nextCursor: page.nextCursor,
    };
  });
}

export async function createItem(userId: string, input: unknown): Promise<ItemDto> {
  const parsed = parse(CreateItemInput, input);

  return withUser(userId, async (tx) => {
    const subject = await selectSubject(tx, userId, parsed.subjectId);
    if (!subject || subject.status === "ARCHIVED") {
      throw new DomainError("NOT_FOUND", "Subject not found");
    }

    const row = await insertItem(tx, {
      userId,
      subjectId: subject.id,
      title: parsed.title,
      kind: parsed.kind,
      sourceUrl: blankToNull(parsed.sourceUrl),
      totalUnits: parsed.totalUnits,
      status: parsed.status,
    });
    return toItemDto(row, 0);
  });
}

export async function updateItem(userId: string, input: unknown): Promise<void> {
  const { itemId, sourceUrl, ...fields } = parse(UpdateItemInput, input);

  await withUser(userId, async (tx) => {
    const current = await selectItem(tx, userId, itemId);
    if (!current) throw new DomainError("NOT_FOUND", "Item not found");

    // A new total cannot be smaller than what is already logged.
    if (fields.totalUnits !== undefined && fields.totalUnits !== null) {
      const completed = (await completedUnitsByItem(tx, userId, [itemId])).get(itemId) ?? 0;
      if (exceedsTotal(completed, fields.totalUnits)) {
        throw new DomainError("VALIDATION_FAILED", "Total is below the progress already logged");
      }
    }

    const row = await updateItemRow(
      tx,
      userId,
      itemId,
      definedFields({
        ...fields,
        sourceUrl: sourceUrl === undefined ? undefined : blankToNull(sourceUrl),
      }),
    );
    if (!row) throw new DomainError("NOT_FOUND", "Item not found");
  });
}

/**
 * Records progress for one day. The day's figures are replaced, not added to.
 * The total check runs after the write, inside the same transaction, so a refused
 * value leaves nothing behind.
 */
export async function logProgress(
  userId: string,
  input: unknown,
): Promise<{ completedUnits: number }> {
  const parsed = parse(LogProgressInput, input);

  return withUser(userId, async (tx) => {
    const item = await selectItem(tx, userId, parsed.itemId);
    if (!item) throw new DomainError("NOT_FOUND", "Item not found");
    if (item.status === "ARCHIVED") throw new DomainError("CONFLICT", "Item is archived");

    await upsertProgress(tx, userId, item.id, parsed.logDate, parsed.units, parsed.minutes);

    const completed = (await completedUnitsByItem(tx, userId, [item.id])).get(item.id) ?? 0;
    if (exceedsTotal(completed, item.totalUnits)) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "Progress would exceed the total units. Nothing was saved.",
      );
    }

    if (item.status === "QUEUED") {
      await updateItemRow(tx, userId, item.id, { status: "ACTIVE" });
    }
    return { completedUnits: completed };
  });
}

/**
 * Permanent deletion. Only archived items can be purged, so an accidental click never
 * destroys data directly. Review cards are detached first, because the foreign key does
 * not cascade to them.
 */
export async function purgeItem(
  userId: string,
  input: unknown,
): Promise<{ detachedCards: number }> {
  const parsed = parse(PurgeItemInput, input);

  return withUser(userId, async (tx) => {
    const item = await selectItem(tx, userId, parsed.itemId);
    if (!item) throw new DomainError("NOT_FOUND", "Item not found");
    if (item.status !== "ARCHIVED") {
      throw new DomainError("CONFLICT", "Archive the item before deleting it permanently");
    }

    const detachedCards = await detachReviewCards(tx, userId, item.id);
    const removed = await deleteItemRow(tx, userId, item.id);
    if (!removed) throw new DomainError("NOT_FOUND", "Item not found");
    return { detachedCards };
  });
}

/* ---------- Review cards ---------- */

export async function createReviewCard(userId: string, input: unknown): Promise<ReviewDto> {
  const parsed = parse(CreateReviewInput, input);
  const today = todayIso();

  return withUser(userId, async (tx) => {
    if (parsed.itemId !== null) {
      const item = await selectItem(tx, userId, parsed.itemId);
      if (!item) throw new DomainError("NOT_FOUND", "Item not found");
    }

    const row = await insertReviewCard(tx, {
      userId,
      itemId: parsed.itemId,
      prompt: parsed.prompt,
      ef: INITIAL_SM2_STATE.ef,
      intervalDays: INITIAL_SM2_STATE.intervalDays,
      repetitions: INITIAL_SM2_STATE.repetitions,
      dueOn: today,
    });
    return toReviewDto(row);
  });
}

export async function listDueReviews(userId: string, input: unknown): Promise<ReviewDto[]> {
  const query = parse(DueQuery, input);
  const today = todayIso();

  return withUser(userId, async (tx) => {
    const rows = await selectDueCards(tx, userId, today, query.limit);
    return rows.map(toReviewDto);
  });
}

/**
 * Applies one SM-2 step. A card can only be reviewed on or after its due date.
 * The row is locked first, so two answers for the same card run one after the other,
 * and the second one is refused.
 */
export async function submitReview(userId: string, input: unknown): Promise<ReviewDto> {
  const parsed = parse(SubmitReviewInput, input);
  const today = todayIso();

  return withUser(userId, async (tx) => {
    const card = await lockReviewCard(tx, userId, parsed.cardId);
    if (!card) throw new DomainError("NOT_FOUND", "Review card not found");
    if (card.dueOn > today) throw new DomainError("CONFLICT", "This card is not due yet");

    const quality = toQuality(parsed.quality);
    const next = nextSm2State(
      { ef: card.ef, intervalDays: card.intervalDays, repetitions: card.repetitions },
      quality,
    );

    const row = await updateReviewCardRow(tx, userId, card.id, {
      ef: next.ef,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueOn: addDays(today, next.intervalDays),
      lastQuality: quality,
      lastReviewedAt: new Date(),
    });
    if (!row) throw new DomainError("NOT_FOUND", "Review card not found");
    return toReviewDto(row);
  });
}
