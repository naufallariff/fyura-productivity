import "server-only";
import { z } from "zod";
import { DomainError } from "@/server/services/errors";

export const PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 50;

const CursorPayload = z
  .object({
    k: z.string().min(1).max(64),
    id: z.uuid(),
  })
  .strict();

/** Sort key and row id. The key is opaque to the database layer and built by each service. */
export interface Cursor {
  readonly key: string;
  readonly id: string;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify({ k: cursor.key, id: cursor.id }), "utf8").toString(
    "base64url",
  );
}

export function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const json: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const parsed = CursorPayload.parse(json);
    return { key: parsed.k, id: parsed.id };
  } catch {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
}

/** Takes limit + 1 rows. The extra row only proves that another page exists. */
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
