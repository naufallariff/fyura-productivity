// domain/projects/placement.ts
// Pure helpers for drag and drop and optimistic updates. No framework imports.

export interface Neighbours {
  readonly beforeId: string | null;
  readonly afterId: string | null;
}

/** Neighbours of the item at `index` in a list that does not contain the moving item. */
export function neighboursAt(ids: readonly string[], index: number): Neighbours {
  return { beforeId: ids[index - 1] ?? null, afterId: ids[index] ?? null };
}

/**
 * Insertion index for the given neighbours. Mirrors the server rule: an explicit neighbour
 * wins. With no neighbours, nullMeansEnd chooses the end (create) or the top (move).
 */
export function insertionIndex(
  ids: readonly string[],
  n: Neighbours,
  nullMeansEnd: boolean,
): number {
  if (n.beforeId !== null) {
    const found = ids.indexOf(n.beforeId);
    return found < 0 ? ids.length : found + 1;
  }
  if (n.afterId !== null) {
    const found = ids.indexOf(n.afterId);
    return found < 0 ? ids.length : found;
  }
  return nullMeansEnd ? ids.length : 0;
}

export function withoutItem<T extends { readonly id: string }>(
  items: readonly T[],
  id: string,
): T[] {
  return items.filter((item) => item.id !== id);
}

/** Inserts an item into a list that does not contain it yet. */
export function withItemInserted<T extends { readonly id: string }>(
  items: readonly T[],
  item: T,
  n: Neighbours,
  nullMeansEnd: boolean,
): T[] {
  const index = insertionIndex(
    items.map((row) => row.id),
    n,
    nullMeansEnd,
  );
  return [...items.slice(0, index), item, ...items.slice(index)];
}

/** Array move: remove the item at `from`, then insert it at `to` in the list after removal. */
export function moveIndex<T>(list: readonly T[], from: number, to: number): T[] {
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return next;
  next.splice(to, 0, moved);
  return next;
}

export interface DropInput {
  readonly activeId: string;
  readonly sourceListId: string;
  readonly sourceIds: readonly string[];
  readonly overId: string;
  readonly targetListId: string;
  readonly targetIds: readonly string[];
  /** True when the card was dropped on the list area rather than on another card. */
  readonly overIsList: boolean;
}

/** Neighbours for a dropped card. Null means nothing changed and no request is needed. */
export function dropNeighbours(d: DropInput): Neighbours | null {
  const sameList = d.sourceListId === d.targetListId;

  if (d.overIsList) {
    if (sameList) return null;
    const rest = d.targetIds.filter((id) => id !== d.activeId);
    return { beforeId: rest.at(-1) ?? null, afterId: null };
  }

  if (sameList) {
    const from = d.sourceIds.indexOf(d.activeId);
    const to = d.sourceIds.indexOf(d.overId);
    if (from < 0 || to < 0 || from === to) return null;
    const next = moveIndex(d.sourceIds, from, to);
    const rest = next.filter((id) => id !== d.activeId);
    return neighboursAt(rest, next.indexOf(d.activeId));
  }

  const rest = d.targetIds.filter((id) => id !== d.activeId);
  const index = rest.indexOf(d.overId);
  if (index < 0) return null;
  return neighboursAt(rest, index);
}

/**
 * Splits a flat list back into pages of the original sizes. The last page takes any
 * extra items, so an optimistic insert never loses an item from the cache.
 */
export function splitByLengths<T>(flat: readonly T[], lengths: readonly number[]): T[][] {
  const pages: T[][] = [];
  let cursor = 0;
  lengths.forEach((length, index) => {
    const isLast = index === lengths.length - 1;
    const end = isLast ? flat.length : cursor + length;
    pages.push(flat.slice(cursor, end));
    cursor = end;
  });
  return pages;
}
