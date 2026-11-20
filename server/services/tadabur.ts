// server/services/tadabur.ts
import "server-only";
import { withUser } from "@/server/db/tx";
import { decodeCursor, toPage, type Page } from "@/server/db/cursor";
import { definedFields } from "@/server/db/patch";
import {
  findTadabur,
  insertTadabur,
  listTadaburPage,
  softDeleteTadabur,
  updateTadaburRow,
  type TadaburPosition,
  type TadaburRow,
} from "@/server/db/repositories/tadabur";
import {
  CreateTadaburInput,
  DeleteTadaburInput,
  TadaburQuery,
  UpdateTadaburInput,
} from "@/server/validation/tadabur";
import { isValidIsoDate } from "@/domain/time/local-date";
import { DomainError } from "@/server/services/errors";
import { parse } from "@/server/services/parse";

export interface TadaburDto {
  readonly id: string;
  readonly logDate: string;
  readonly surah: number;
  readonly ayatFrom: number;
  readonly ayatTo: number;
  readonly reflection: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function toDto(row: TadaburRow): TadaburDto {
  return {
    id: row.id,
    logDate: row.logDate,
    surah: row.surah,
    ayatFrom: row.ayatFrom,
    ayatTo: row.ayatTo,
    reflection: row.reflection,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseCursor(key: string): TadaburPosition {
  const [date, id] = key.split("|");
  if (!date || !id || !isValidIsoDate(date)) {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
  return { date, id };
}

export async function listTadabur(userId: string, input: unknown): Promise<Page<TadaburDto>> {
  const query = parse(TadaburQuery, input);
  const cursor = decodeCursor(query.cursor);
  const position = cursor ? parseCursor(cursor.key) : null;

  return withUser(userId, async (tx) => {
    const rows = await listTadaburPage(
      tx,
      userId,
      { from: query.from, to: query.to, surah: query.surah },
      position,
      query.limit + 1,
    );
    const page = toPage(rows, query.limit, (row) => ({
      key: `${row.logDate}|${row.id}`,
      id: row.id,
    }));
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  });
}

export async function createTadabur(userId: string, input: unknown): Promise<TadaburDto> {
  const parsed = parse(CreateTadaburInput, input);
  return withUser(userId, async (tx) => toDto(await insertTadabur(tx, { userId, ...parsed })));
}

export async function updateTadabur(userId: string, input: unknown): Promise<void> {
  const { entryId, ...patch } = parse(UpdateTadaburInput, input);

  await withUser(userId, async (tx) => {
    const current = await findTadabur(tx, userId, entryId);
    if (!current) throw new DomainError("NOT_FOUND", "Entry not found");

    // The database also checks this, but a clear error is better than a failed write.
    const from = patch.ayatFrom ?? current.ayatFrom;
    const to = patch.ayatTo ?? current.ayatTo;
    if (to < from) {
      throw new DomainError("VALIDATION_FAILED", "Ayat end must not be before ayat start");
    }

    const row = await updateTadaburRow(tx, userId, entryId, definedFields(patch));
    if (!row) throw new DomainError("NOT_FOUND", "Entry not found");
  });
}

export async function deleteTadabur(userId: string, input: unknown): Promise<void> {
  const parsed = parse(DeleteTadaburInput, input);
  await withUser(userId, async (tx) => {
    const removed = await softDeleteTadabur(tx, userId, parsed.entryId);
    if (!removed) throw new DomainError("NOT_FOUND", "Entry not found");
  });
}
