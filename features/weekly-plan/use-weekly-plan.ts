"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet } from "@/client/api/fetch";
import { scopedKey } from "@/client/query/keys";
import { CACHE_POLICY } from "@/client/query/policy";
import type { ActionResult } from "@/server/api/action";
import type { PlanItem, PlanItemDraft } from "@/domain/plan/types";
import { BLOCK_CATEGORIES } from "@/domain/categories";
import {
  createPlanItemAction,
  deletePlanItemAction,
  reorderPlanDayAction,
  updatePlanItemAction,
} from "./actions";

const SCOPE = "weekly-plan";

const ResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      weekday: z.number().int().min(1).max(7),
      position: z.number().int().min(0),
      title: z.string(),
      category: z.enum(BLOCK_CATEGORIES),
      isRequired: z.boolean(),
      isCore: z.boolean(),
      plannedMinutes: z.number().int().nullable(),
    }),
  ),
});

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.code);
  return result.data;
}

export function useWeeklyPlan(userId: string) {
  return useQuery({
    queryKey: scopedKey(userId, SCOPE),
    queryFn: ({ signal }) =>
      apiGet("/api/v1/weekly-plan", {}, ResponseSchema, signal).then((body) => body.items),
    ...CACHE_POLICY.standard,
  });
}

export function useCreateItem(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlanItemDraft & { weekday: number }) =>
      unwrap(await createPlanItemAction(input)),
    onSuccess: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}

export function useUpdateItem(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PlanItemDraft> & { itemId: string }) =>
      unwrap(await updatePlanItemAction(input)),
    onSuccess: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}

export function useDeleteItem(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { itemId: string }) => unwrap(await deletePlanItemAction(input)),
    onSuccess: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}

/**
 * Reorders one day optimistically. The UI moves at once. If the server rejects the change,
 * the previous order is restored.
 */
export function useReorderDay(userId: string) {
  const client = useQueryClient();
  const key = scopedKey(userId, SCOPE);

  return useMutation({
    mutationFn: async (input: { weekday: number; orderedIds: string[] }) =>
      unwrap(await reorderPlanDayAction(input)),

    onMutate: async ({ weekday, orderedIds }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<PlanItem[]>(key);
      client.setQueryData<PlanItem[]>(key, (items) =>
        items?.map((item) =>
          item.weekday === weekday ? { ...item, position: orderedIds.indexOf(item.id) } : item,
        ),
      );
      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },

    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}
