"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet } from "@/client/api/fetch";
import { useCursorList } from "@/client/hooks/use-cursor-list";
import { scopedKey } from "@/client/query/keys";
import { CACHE_POLICY } from "@/client/query/policy";
import { BLOCK_CATEGORIES } from "@/domain/categories";
import { DAY_STATUSES, type DayStatus } from "@/domain/scoring/types";
import type { ActionResult } from "@/server/api/action";
import { setChecklistItemAction, setDayStatusAction } from "./actions";

const CHECKLIST = "checklist";
const SCORES = "checklist-scores";
const HISTORY = "history";
const CHECKLIST_WRITE = "checklist-write";

const ChecklistItemSchema = z.object({
  id: z.string(),
  sourceItemId: z.string().nullable(),
  title: z.string(),
  category: z.enum(BLOCK_CATEGORIES),
  isRequired: z.boolean(),
  isCore: z.boolean(),
  plannedMinutes: z.number().nullable(),
  isDone: z.boolean(),
  doneAt: z.string().nullable(),
});

const ChecklistSchema = z.object({
  logDate: z.string(),
  status: z.enum(DAY_STATUSES),
  frozen: z.boolean(),
  items: z.array(ChecklistItemSchema),
});

export type ChecklistView = z.infer<typeof ChecklistSchema>;

const ScoresSchema = z.object({
  days: z.array(
    z.object({
      date: z.string(),
      status: z.enum(DAY_STATUSES),
      planned: z.number().int(),
      completed: z.number(),
      ratio: z.number().nullable(),
    }),
  ),
});

const HistoryItemSchema = z.object({
  id: z.string(),
  logDate: z.string(),
  startMinute: z.number().int(),
  endMinute: z.number().int(),
  category: z.enum(BLOCK_CATEGORIES),
  activity: z.string(),
  source: z.string(),
  splitGroupId: z.string().nullable(),
});

export type HistoryItem = z.infer<typeof HistoryItemSchema>;

export function useChecklist(userId: string, date: string, initialData?: ChecklistView) {
  return useQuery({
    queryKey: scopedKey(userId, CHECKLIST, date),
    queryFn: ({ signal }) =>
      apiGet("/api/v1/daily-tracker/checklist", { date }, ChecklistSchema, signal),
    initialData,
    ...CACHE_POLICY.standard,
  });
}

export function useChecklistScores(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: scopedKey(userId, SCORES, from, to),
    queryFn: ({ signal }) =>
      apiGet("/api/v1/daily-tracker/scores", { from, to }, ScoresSchema, signal).then(
        (body) => body.days,
      ),
    ...CACHE_POLICY.standard,
  });
}

function refreshChecklistAfterWrite(client: QueryClient, userId: string, logDate: string) {
  // Keep any newer optimistic update in place until all writes for this day settle.
  const writesForDay = client.isMutating({
    mutationKey: scopedKey(userId, CHECKLIST_WRITE),
    predicate: ({ state: { variables } }) =>
      typeof variables === "object" &&
      variables !== null &&
      "logDate" in variables &&
      variables.logDate === logDate,
  });
  if (writesForDay > 1) return;
  void client.invalidateQueries({ queryKey: scopedKey(userId, CHECKLIST, logDate) });
  void client.invalidateQueries({ queryKey: scopedKey(userId, SCORES) });
}

export function useSetDayStatus(userId: string, logDate: string) {
  const client = useQueryClient();
  const key = scopedKey(userId, CHECKLIST, logDate);
  const mutationKey = scopedKey(userId, CHECKLIST_WRITE, logDate, "status");
  const mutation = useMutation({
    mutationKey,
    scope: { id: CHECKLIST_WRITE },
    mutationFn: async ({ logDate, status }: { logDate: string; status: DayStatus }) => {
      const result = await setDayStatusAction({ logDate, status });
      if (!result.ok) throw new Error(result.code);
    },
    onMutate: async ({ status }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<ChecklistView>(key)?.status;
      client.setQueryData<ChecklistView>(key, (view) => view && { ...view, status });
      return { key, previous };
    },
    onError: (_error, _input, context) => {
      if (!context?.previous) return;
      const { key, previous } = context;
      client.setQueryData<ChecklistView>(key, (view) => view && { ...view, status: previous });
    },
    onSettled: (_data, _error, input) => refreshChecklistAfterWrite(client, userId, input.logDate),
  });

  return {
    saving: mutation.isPending && mutation.variables?.logDate === logDate,
    failed: mutation.isError && mutation.variables?.logDate === logDate,
    change: (status: DayStatus) => {
      if (client.isMutating({ mutationKey }) === 0) mutation.mutate({ logDate, status });
    },
  };
}

/**
 * Writes checklist state. The scope makes writes run one after another, so the last tap
 * is always the last request the server receives.
 */
export function useSetChecklistItem(userId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationKey: scopedKey(userId, CHECKLIST_WRITE, "item"),
    scope: { id: CHECKLIST_WRITE },
    mutationFn: async (input: { logDate: string; sourceItemId: string; done: boolean }) => {
      const result: ActionResult<null> = await setChecklistItemAction(input);
      if (!result.ok) throw new Error(result.code);
    },

    onMutate: async ({ logDate, sourceItemId, done }) => {
      const key = scopedKey(userId, CHECKLIST, logDate);
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<ChecklistView>(key);

      client.setQueryData<ChecklistView>(key, (view) =>
        view
          ? {
              ...view,
              frozen: true,
              items: view.items.map((item) =>
                item.sourceItemId === sourceItemId
                  ? { ...item, isDone: done, doneAt: done ? new Date().toISOString() : null }
                  : item,
              ),
            }
          : view,
      );
      return { key, previous };
    },

    onError: (_error, { sourceItemId }, context) => {
      if (!context?.previous) return;
      const { key, previous } = context;
      const previousItem = previous.items.find((item) => item.sourceItemId === sourceItemId);
      if (!previousItem) return;
      client.setQueryData<ChecklistView>(
        key,
        (view) =>
          view && {
            ...view,
            items: view.items.map((item) =>
              item.sourceItemId === sourceItemId ? previousItem : item,
            ),
          },
      );
    },

    onSettled: (_data, _error, input) => refreshChecklistAfterWrite(client, userId, input.logDate),
  });
}

/**
 * Infinite history list. Pass the search text after debouncing it, so each keystroke
 * does not start a request.
 */
export function useBlockHistory(
  userId: string,
  filters: { from?: string; to?: string; category?: string; q?: string },
) {
  return useCursorList({
    queryKey: scopedKey(userId, HISTORY),
    path: "/api/v1/daily-tracker/history",
    filters,
    item: HistoryItemSchema,
  });
}
