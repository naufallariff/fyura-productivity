// features/capture/use-capture.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/client/api/fetch";
import { useCursorList } from "@/client/hooks/use-cursor-list";
import { scopedKey } from "@/client/query/keys";
import { CACHE_POLICY } from "@/client/query/policy";
import type { ActionResult } from "@/server/api/action";
import { createIdeaAction, updateIdeaAction } from "./actions";
import { IdeaSchema, TagCloudSchema } from "./schemas";

const SCOPE = "capture";
const WRITE_SCOPE = { id: "capture-writes" } as const;

export type IdeaFilters = {
  readonly status?: string;
  readonly tag?: string;
  readonly q?: string;
};

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.code);
  return result.data;
}

export function useIdeas(userId: string, filters: IdeaFilters) {
  return useCursorList({
    queryKey: scopedKey(userId, SCOPE, JSON.stringify(filters)),
    path: "/api/v1/capture/ideas",
    filters,
    item: IdeaSchema,
  });
}

export function useTagCloud(userId: string) {
  return useQuery({
    queryKey: scopedKey(userId, SCOPE, "tags"),
    queryFn: ({ signal }) =>
      apiGet("/api/v1/capture/tags", {}, TagCloudSchema, signal).then((body) => body.items),
    ...CACHE_POLICY.standard,
  });
}

export function useCreateIdea(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { title: string; body: string; tags: string[] }) =>
      unwrap(await createIdeaAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}

export function useUpdateIdea(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: {
      ideaId: string;
      title?: string;
      body?: string;
      status?: "INBOX" | "ACTIVE" | "ARCHIVED";
      tags?: string[];
    }) => unwrap(await updateIdeaAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}
