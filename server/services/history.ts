import "server-only";
import { withUser } from "@/server/db/tx";
import {
  findBlockById,
  listBlockHistory,
  updateBlockDetails,
  type HistoryCursor,
  type TimeBlockRow,
} from "@/server/db/repositories/time-blocks";
import { decodeCursor, toPage, type Page } from "@/server/db/cursor";
import { toCategory } from "@/domain/categories";
import { isValidIsoDate } from "@/domain/time/local-date";
import { DomainError } from "./errors";
import { parse } from "./parse";
import { UpdateBlockInput } from "@/server/validation/daily-tracker";

export interface HistoryItem {
  readonly id: string;
  readonly logDate: string;
  readonly startMinute: number;
  readonly endMinute: number;
  readonly category: string;
  readonly activity: string;
  readonly source: string;
  readonly splitGroupId: string | null;
}

export interface HistoryInput {
  readonly from?: string;
  readonly to?: string;
  readonly category?: string;
  readonly q?: string;
  readonly cursor?: string;
  readonly limit: number;
}

/** Sort key: date and start minute. The minute is zero-padded so text order matches time order. */
function keyOf(row: { logDate: string; startMinute: number }): string {
  return `${row.logDate}|${String(row.startMinute).padStart(4, "0")}`;
}

function readKey(key: string): { date: string; minute: number } {
  const [date, minuteText] = key.split("|");
  const minute = Number(minuteText);
  if (!date || !isValidIsoDate(date) || !Number.isInteger(minute)) {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
  return { date, minute };
}

function toItem(row: TimeBlockRow): HistoryItem {
  return {
    id: row.id,
    logDate: row.logDate,
    startMinute: row.startMinute,
    endMinute: row.endMinute,
    category: toCategory(row.category),
    activity: row.activity,
    source: row.source,
    splitGroupId: row.splitGroupId,
  };
}

export async function listTimeBlockHistory(
  userId: string,
  input: HistoryInput,
): Promise<Page<HistoryItem>> {
  const cursor = decodeCursor(input.cursor);
  let position: HistoryCursor | null = null;
  if (cursor) {
    const { date, minute } = readKey(cursor.key);
    position = { date, minute, id: cursor.id };
  }

  return withUser(userId, async (tx) => {
    const rows = await listBlockHistory(
      tx,
      userId,
      {
        from: input.from,
        to: input.to,
        category: input.category,
        q: input.q ? input.q : undefined,
      },
      position,
      input.limit + 1,
    );

    const page = toPage(rows, input.limit, (row) => ({ key: keyOf(row), id: row.id }));
    return { items: page.items.map(toItem), nextCursor: page.nextCursor };
  });
}

export async function updateTimeBlockDetails(userId: string, input: unknown): Promise<void> {
  const parsed = parse(UpdateBlockInput, input);

  await withUser(userId, async (tx) => {
    const block = await findBlockById(tx, userId, parsed.blockId);
    if (!block) throw new DomainError("NOT_FOUND", "Time block not found");

    await updateBlockDetails(tx, userId, block, {
      activity: parsed.activity ?? block.activity,
      category: parsed.category ?? block.category,
    });
  });
}
