// features/projects/use-projects.ts
"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiGet } from "@/client/api/fetch";
import { scopedKey } from "@/client/query/keys";
import { CACHE_POLICY } from "@/client/query/policy";
import {
  splitByLengths,
  withItemInserted,
  withoutItem,
  type Neighbours,
} from "@/domain/projects/placement";
import {
  createBoardAction,
  createCardAction,
  createChecklistItemAction,
  createLabelAction,
  createListAction,
  deleteChecklistItemAction,
  deleteLabelAction,
  moveCardAction,
  moveListAction,
  setCardLabelAction,
  updateBoardAction,
  updateCardAction,
  updateChecklistItemAction,
  updateLabelAction,
  updateListAction,
} from "./actions";
import {
  BoardSnapshotSchema,
  BoardsPageSchema,
  CardDetailSchema,
  CardsPageSchema,
  type BoardSnapshot,
  type Card,
  type CardDetail,
  type CardsPage,
  type List,
} from "./schemas";
import { failureCode } from "./format";

export interface CardFilters {
  readonly q: string;
  readonly label: string;
  readonly due: string;
}

export const NO_FILTERS: CardFilters = { q: "", label: "", due: "" };

export function hasActiveFilters(filters: CardFilters): boolean {
  return filters.q !== "" || filters.label !== "" || filters.due !== "";
}

type CardsSnapshot = Array<[QueryKey, InfiniteData<CardsPage> | undefined]>;

export interface MoveCardInput {
  readonly cardId: string;
  readonly listId: string;
  readonly beforeId: string | null;
  readonly afterId: string | null;
  readonly placement?: "TOP" | "BOTTOM";
}

const WRITE_SCOPE = { id: "projects-writes" } as const;

const boardsKey = (userId: string) => scopedKey(userId, "boards");
const boardKey = (userId: string, boardId: string) => scopedKey(userId, "board", boardId);
const cardsPrefix = (userId: string) => scopedKey(userId, "cards");
const cardsKey = (userId: string, listId: string, filters: CardFilters) =>
  scopedKey(userId, "cards", listId, JSON.stringify(filters));
const cardKey = (userId: string, cardId: string) => scopedKey(userId, "card", cardId);

function unwrap<T>(result: { ok: true; data: T } | { ok: false; code: string }): T {
  if (!result.ok) throw new Error(result.code);
  return result.data;
}

function cardParams(filters: CardFilters, cursor: string | null): Record<string, string> {
  const params: Record<string, string> = { archived: "0" };
  if (filters.q) params.q = filters.q;
  if (filters.label) params.label = filters.label;
  if (filters.due) params.due = filters.due;
  if (cursor) params.cursor = cursor;
  return params;
}

/* ---------- Reads ---------- */

export function useBoardsIndex(userId: string, archived: boolean) {
  return useInfiniteQuery({
    queryKey: scopedKey(userId, "boards", archived ? "archived" : "active"),
    queryFn: ({ pageParam, signal }) => {
      const params: Record<string, string> = { archived: archived ? "1" : "0" };
      if (pageParam) params.cursor = pageParam;
      return apiGet("/api/v1/projects/boards", params, BoardsPageSchema, signal);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    ...CACHE_POLICY.standard,
  });
}

export function useBoardSnapshot(userId: string, boardId: string) {
  return useQuery({
    queryKey: boardKey(userId, boardId),
    queryFn: ({ signal }) =>
      apiGet(`/api/v1/projects/boards/${boardId}`, {}, BoardSnapshotSchema, signal),
    ...CACHE_POLICY.standard,
  });
}

export function useListCards(userId: string, listId: string, filters: CardFilters) {
  return useInfiniteQuery({
    queryKey: cardsKey(userId, listId, filters),
    queryFn: ({ pageParam, signal }) =>
      apiGet(
        `/api/v1/projects/lists/${listId}/cards`,
        cardParams(filters, pageParam),
        CardsPageSchema,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    ...CACHE_POLICY.standard,
  });
}

export function useCardDetail(userId: string, cardId: string | null) {
  return useQuery({
    queryKey: cardKey(userId, cardId ?? ""),
    queryFn: ({ signal }) =>
      apiGet(`/api/v1/projects/cards/${cardId ?? ""}`, {}, CardDetailSchema, signal),
    enabled: cardId !== null,
    ...CACHE_POLICY.standard,
  });
}

/* ---------- Boards ---------- */

export function useCreateBoard(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { title: string; hue: string }) =>
      unwrap(await createBoardAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: boardsKey(userId) }),
  });
}

export function useUpdateBoard(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: {
      boardId: string;
      title?: string;
      hue?: string;
      starred?: boolean;
      archived?: boolean;
    }) => unwrap(await updateBoardAction(input)),
    onSettled: (_data, _error, input) => {
      void client.invalidateQueries({ queryKey: boardsKey(userId) });
      void client.invalidateQueries({ queryKey: boardKey(userId, input.boardId) });
    },
  });
}

/* ---------- Lists ---------- */

export function useCreateList(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { boardId: string; title: string }) =>
      unwrap(await createListAction(input)),
    onSettled: (_data, _error, input) =>
      client.invalidateQueries({ queryKey: boardKey(userId, input.boardId) }),
  });
}

export function useUpdateList(userId: string, boardId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { listId: string; title?: string; archived?: boolean }) =>
      unwrap(await updateListAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: boardKey(userId, boardId) }),
  });
}

/** Moves a list. The new order appears at once and is rolled back if the server rejects it. */
export function useMoveList(userId: string, boardId: string) {
  const client = useQueryClient();
  const key = boardKey(userId, boardId);

  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: {
      listId: string;
      beforeId: string | null;
      afterId: string | null;
    }) => unwrap(await moveListAction(input)),

    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<BoardSnapshot>(key);

      client.setQueryData<BoardSnapshot>(key, (data) => {
        if (!data) return data;
        const moving = data.lists.find((list: List) => list.id === input.listId);
        if (!moving) return data;
        const rest = withoutItem(data.lists, input.listId);
        return { ...data, lists: withItemInserted(rest, moving, input, false) };
      });
      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },

    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}

/* ---------- Cards ---------- */

export function useCreateCard(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: {
      listId: string;
      title: string;
      beforeId: string | null;
      afterId: string | null;
    }) => unwrap(await createCardAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: cardsPrefix(userId) }),
  });
}

export function useUpdateCard(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: {
      cardId: string;
      title?: string;
      description?: string | null;
      dueOn?: string | null;
      dueComplete?: boolean;
      archived?: boolean;
    }) => unwrap(await updateCardAction(input)),
    onSettled: (_data, _error, input) => {
      void client.invalidateQueries({ queryKey: cardsPrefix(userId) });
      void client.invalidateQueries({ queryKey: cardKey(userId, input.cardId) });
    },
  });
}

function flatten(data: InfiniteData<CardsPage>): Card[] {
  return data.pages.flatMap((page) => page.items);
}

/** Keeps the page sizes of the cached data, so pagination still lines up after an edit. */
function rebuildPages(data: InfiniteData<CardsPage>, items: Card[]): InfiniteData<CardsPage> {
  const parts = splitByLengths(
    items,
    data.pages.map((page) => page.items.length),
  );
  return {
    ...data,
    pages: data.pages.map((page, index) => ({ ...page, items: parts[index] ?? [] })),
  };
}

function findCard(snapshot: CardsSnapshot, cardId: string): Card | undefined {
  for (const [, data] of snapshot) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((card) => card.id === cardId);
      if (hit) return hit;
    }
  }
  return undefined;
}

function applyOptimisticMove(
  client: QueryClient,
  prefix: QueryKey,
  input: MoveCardInput,
  snapshot: CardsSnapshot,
): void {
  const moving = findCard(snapshot, input.cardId);
  if (!moving) return;

  const sourceListId = moving.listId;
  const targetListId = input.listId;
  const neighbours: Neighbours = { beforeId: input.beforeId, afterId: input.afterId };

  // The target list gets the card at the computed index.
  client.setQueriesData<InfiniteData<CardsPage>>(
    { queryKey: prefix, predicate: (query) => query.queryKey.includes(targetListId) },
    (data) => {
      if (!data || data.pages.length === 0) return data;
      const rest = withoutItem(flatten(data), input.cardId);
      return rebuildPages(
        data,
        withItemInserted(rest, { ...moving, listId: targetListId }, neighbours, false),
      );
    },
  );

  // The source list only loses the card when the list actually changes.
  if (sourceListId !== targetListId) {
    client.setQueriesData<InfiniteData<CardsPage>>(
      { queryKey: prefix, predicate: (query) => query.queryKey.includes(sourceListId) },
      (data) =>
        data && data.pages.length > 0
          ? rebuildPages(data, withoutItem(flatten(data), input.cardId))
          : data,
    );
  }
}

/**
 * Moves a card. Drag moves are optimistic. Moves with `placement` (from the dialog) wait
 * for the server, because the final position is computed there.
 */
export function useMoveCard(userId: string) {
  const client = useQueryClient();
  const prefix = cardsPrefix(userId);

  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: MoveCardInput) => unwrap(await moveCardAction(input)),

    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: prefix });
      const snapshot = client.getQueriesData<InfiniteData<CardsPage>>({ queryKey: prefix });
      if (input.placement === undefined) applyOptimisticMove(client, prefix, input, snapshot);
      return { snapshot };
    },

    onError: (_error, _input, context) => {
      context?.snapshot.forEach(([key, data]) => client.setQueryData(key, data));
    },

    onSettled: () => client.invalidateQueries({ queryKey: prefix }),
  });
}

/* ---------- Labels ---------- */

export function useSetCardLabel(userId: string) {
  const client = useQueryClient();

  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { cardId: string; labelId: string; on: boolean }) =>
      unwrap(await setCardLabelAction(input)),

    onMutate: async (input) => {
      const key = cardKey(userId, input.cardId);
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<CardDetail>(key);

      client.setQueryData<CardDetail>(key, (card) => {
        if (!card) return card;
        const labelIds = input.on
          ? [...new Set([...card.labelIds, input.labelId])]
          : card.labelIds.filter((id) => id !== input.labelId);
        return { ...card, labelIds };
      });
      return { key, previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(context.key, context.previous);
    },

    onSettled: (_data, _error, input) => {
      void client.invalidateQueries({ queryKey: cardKey(userId, input.cardId) });
      void client.invalidateQueries({ queryKey: cardsPrefix(userId) });
    },
  });
}

export function useCreateLabel(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { boardId: string; name: string; hue: string }) =>
      unwrap(await createLabelAction(input)),
    onSettled: (_data, _error, input) =>
      client.invalidateQueries({ queryKey: boardKey(userId, input.boardId) }),
  });
}

export function useUpdateLabel(userId: string, boardId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { labelId: string; name?: string; hue?: string }) =>
      unwrap(await updateLabelAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: boardKey(userId, boardId) }),
  });
}

export function useDeleteLabel(userId: string, boardId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { labelId: string }) => unwrap(await deleteLabelAction(input)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: boardKey(userId, boardId) });
      void client.invalidateQueries({ queryKey: cardsPrefix(userId) });
    },
  });
}

/* ---------- Checklist ---------- */

export function useCreateChecklistItem(userId: string, cardId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { cardId: string; title: string }) =>
      unwrap(await createChecklistItemAction(input)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: cardKey(userId, cardId) });
      void client.invalidateQueries({ queryKey: cardsPrefix(userId) });
    },
  });
}

/** Toggling an item updates the card at once. The counts on the list cards refresh after the server answers. */
export function useUpdateChecklistItem(userId: string, cardId: string) {
  const client = useQueryClient();
  const key = cardKey(userId, cardId);

  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { itemId: string; title?: string; done?: boolean }) =>
      unwrap(await updateChecklistItemAction(input)),

    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<CardDetail>(key);
      if (input.done !== undefined) {
        client.setQueryData<CardDetail>(key, (card) =>
          card
            ? {
                ...card,
                items: card.items.map((item) =>
                  item.id === input.itemId ? { ...item, done: input.done ?? item.done } : item,
                ),
              }
            : card,
        );
      }
      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },

    onSettled: () => {
      void client.invalidateQueries({ queryKey: key });
      void client.invalidateQueries({ queryKey: cardsPrefix(userId) });
    },
  });
}

export function useDeleteChecklistItem(userId: string, cardId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { itemId: string }) => unwrap(await deleteChecklistItemAction(input)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: cardKey(userId, cardId) });
      void client.invalidateQueries({ queryKey: cardsPrefix(userId) });
    },
  });
}

export { failureCode };
