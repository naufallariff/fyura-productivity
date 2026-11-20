// features/journal/tadabur/use-tadabur.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCursorList } from "@/client/hooks/use-cursor-list";
import { scopedKey } from "@/client/query/keys";
import type { ActionResult } from "@/server/api/action";
import { createTadaburAction, deleteTadaburAction, updateTadaburAction } from "./actions";
import { TadaburItemSchema } from "./schemas";

const SCOPE = "tadabur";
const WRITE_SCOPE = { id: "tadabur-writes" } as const;

export type TadaburFilters = {
  readonly from?: string;
  readonly to?: string;
  readonly surah?: string;
};

export interface TadaburDraft {
  readonly logDate: string;
  readonly surah: number;
  readonly ayatFrom: number;
  readonly ayatTo: number;
  readonly reflection: string;
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.code);
  return result.data;
}

export function useTadaburList(userId: string, filters: TadaburFilters) {
  return useCursorList({
    queryKey: scopedKey(userId, SCOPE, JSON.stringify(filters)),
    path: "/api/v1/tadabur/entries",
    filters,
    item: TadaburItemSchema,
  });
}

export function useCreateTadabur(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: TadaburDraft) => unwrap(await createTadaburAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}

export function useUpdateTadabur(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: Partial<TadaburDraft> & { entryId: string }) =>
      unwrap(await updateTadaburAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}

export function useDeleteTadabur(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { entryId: string }) => unwrap(await deleteTadaburAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}
