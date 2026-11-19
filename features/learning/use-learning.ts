// features/learning/use-learning.ts
"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiGet } from "@/client/api/fetch";
import { useCursorList } from "@/client/hooks/use-cursor-list";
import { scopedKey } from "@/client/query/keys";
import { CACHE_POLICY } from "@/client/query/policy";
import type { ActionResult } from "@/server/api/action";
import {
  createItemAction,
  createReviewAction,
  createSubjectAction,
  logProgressAction,
  purgeItemAction,
  submitReviewAction,
  updateItemAction,
  updateSubjectAction,
} from "./actions";
import { DueSchema, ItemSchema, SubjectListSchema } from "./schemas";

const SCOPE = "learning";
const WRITE_SCOPE = { id: "learning-writes" } as const;

export type ItemFilters = {
  readonly subjectId: string;
  readonly status?: string;
};

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.code);
  return result.data;
}

/** Every learning query shares the prefix, so one invalidation refreshes all of them. */
function invalidateAll(client: QueryClient, userId: string) {
  return client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) });
}

/* ---------- Reads ---------- */

export function useSubjects(userId: string) {
  return useQuery({
    queryKey: scopedKey(userId, SCOPE, "subjects"),
    queryFn: ({ signal }) => apiGet("/api/v1/learning/subjects", {}, SubjectListSchema, signal),
    ...CACHE_POLICY.standard,
  });
}

export function useItems(userId: string, filters: ItemFilters) {
  return useCursorList({
    queryKey: scopedKey(userId, SCOPE, "items", JSON.stringify(filters)),
    path: "/api/v1/learning/items",
    filters,
    item: ItemSchema,
  });
}

export function useDueReviews(userId: string) {
  return useQuery({
    queryKey: scopedKey(userId, SCOPE, "due"),
    queryFn: ({ signal }) =>
      apiGet("/api/v1/learning/reviews/due", {}, DueSchema, signal).then((body) => body.items),
    ...CACHE_POLICY.standard,
  });
}

/* ---------- Writes ---------- */

export function useCreateSubject(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { name: string; kind: string; status: string }) =>
      unwrap(await createSubjectAction(input)),
    onSettled: () => invalidateAll(client, userId),
  });
}

export function useUpdateSubject(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { subjectId: string; name?: string; status?: string }) =>
      unwrap(await updateSubjectAction(input)),
    onSettled: () => invalidateAll(client, userId),
  });
}

export function useCreateItem(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: {
      subjectId: string;
      title: string;
      kind: string;
      sourceUrl: string;
      totalUnits: number | null;
    }) => unwrap(await createItemAction(input)),
    onSettled: () => invalidateAll(client, userId),
  });
}

export function useUpdateItem(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: {
      itemId: string;
      title?: string;
      kind?: string;
      sourceUrl?: string;
      totalUnits?: number | null;
      status?: string;
    }) => unwrap(await updateItemAction(input)),
    onSettled: () => invalidateAll(client, userId),
  });
}

export function useLogProgress(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: {
      itemId: string;
      logDate: string;
      units: number;
      minutes: number;
    }) => unwrap(await logProgressAction(input)),
    onSettled: () => invalidateAll(client, userId),
  });
}

export function usePurgeItem(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { itemId: string }) => unwrap(await purgeItemAction(input)),
    onSettled: () => invalidateAll(client, userId),
  });
}

export function useCreateReview(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { itemId: string | null; prompt: string }) =>
      unwrap(await createReviewAction(input)),
    onSettled: () => invalidateAll(client, userId),
  });
}

export function useSubmitReview(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { cardId: string; quality: number }) =>
      unwrap(await submitReviewAction(input)),
    onSettled: () => invalidateAll(client, userId),
  });
}
