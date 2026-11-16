// server/services/calendar.ts
import "server-only";
import { withUser } from "@/server/db/tx";
import { listBlocksInRange, type TimeBlockRow } from "@/server/db/repositories/time-blocks";
import { toCategory } from "@/domain/categories";
import type { Category } from "@/domain/scoring/types";

export interface CalendarRange {
  readonly from: string;
  readonly to: string;
}

export interface CalendarBlock {
  readonly id: string;
  readonly logDate: string;
  readonly startMinute: number;
  readonly endMinute: number;
  readonly category: Category;
  readonly activity: string;
  readonly source: string;
  readonly splitGroupId: string | null;
}

/** The route validates the range before calling this function. */
export async function getCalendarBlocks(
  userId: string,
  range: CalendarRange,
): Promise<CalendarBlock[]> {
  const rows = await withUser(userId, (tx) => listBlocksInRange(tx, userId, range.from, range.to));
  return rows.map(toBlock);
}

function toBlock(row: TimeBlockRow): CalendarBlock {
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
