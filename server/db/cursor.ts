import "server-only";
import { z } from "zod";
import { DomainError } from "@/server/services/errors";

export const PAGE_SIZE = 25;

const CursorPayload = z
  .object({
    at: z.iso.datetime(),
    id: z.uuid(),
  })
  .strict();

export interface Cursor {
  readonly at: string;
  readonly id: string;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

/** Opaque to clients. Encodes the sort key so the next page starts exactly after the last row. */
export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const json: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    return CursorPayload.parse(json);
  } catch {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
}

/**
 * Takes limit + 1 rows from the query. The extra row only proves that another page exists.
 */
export function toPage<T extends { readonly id: string }>(
  rows: readonly T[],
  limit: number,
  cursorOf: (row: T) => Cursor,
): Page<T> {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  const hasMore = rows.length > limit;
  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(cursorOf(last)) : null,
  };
}
