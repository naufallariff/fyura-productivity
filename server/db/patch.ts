// server/db/patch.ts
/** Drops keys whose value is undefined, so a partial update never overwrites a column with null or a default. */
export function definedFields<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}
