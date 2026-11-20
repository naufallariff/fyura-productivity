// server/db/like.ts
/** Escapes LIKE and ILIKE wildcards so user text is matched literally. The escape character is the Postgres default, backslash. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
