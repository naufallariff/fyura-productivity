"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet } from "@/client/api/fetch";
import { scopedKey } from "@/client/query/keys";
import { CACHE_POLICY } from "@/client/query/policy";
import { BLOCK_CATEGORIES } from "@/domain/categories";
import { DAY_STATUSES, type Category, type DayStatus } from "@/domain/scoring/types";
import type { ActionResult } from "@/server/api/action";
import {
  createBlockAction,
  deleteBlockAction,
  moveBlockAction,
  setDayStatusAction,
  updateBlockAction,
} from "./actions";

const BLOCKS = "blocks";
const HISTORY = "history";
const CHECKLIST = "checklist";
const SCORES = "checklist-scores";

const BlockSchema = z.object({
  id: z.string(),
  logDate: z.string(),
  startMinute: z.number().int(),
  endMinute: z.number().int(),
  category: z.enum(BLOCK_CATEGORIES),
  activity: z.string(),
  source: z.string(),
  splitGroupId: z.string().nullable(),
});

export type CalendarBlock = z.infer<typeof BlockSchema>;

const BlocksSchema = z.object({ items: z.array(BlockSchema) });

export interface CreateBlockInput {
  readonly logDate: string;
  readonly startMinute: number;
  readonly durationMinutes: number;
  readonly category: Category;
  readonly activity: string;
  readonly source: "MANUAL";
}

export interface UpdateBlockInput {
  readonly blockId: string;
  readonly activity?: string;
  readonly category?: Category;
}

export interface MoveBlockInput {
  readonly blockId: string;
  readonly startMinute: number;
  readonly endMinute: number;
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.code);
  return result.data;
}

function invalidateBlockData(client: QueryClient, userId: string): void {
  void client.invalidateQueries({ queryKey: scopedKey(userId, BLOCKS) });
  void client.invalidateQueries({ queryKey: scopedKey(userId, HISTORY) });
}

export function useCalendarBlocks(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: scopedKey(userId, BLOCKS, from, to),
    queryFn: ({ signal }) =>
      apiGet("/api/v1/daily-tracker/blocks", { from, to }, BlocksSchema, signal).then(
        (body) => body.items,
      ),
    ...CACHE_POLICY.standard,
  });
}

export function useCreateBlock(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBlockInput) => unwrap(await createBlockAction(input)),
    onSettled: () => invalidateBlockData(client, userId),
  });
}

export function useUpdateBlock(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateBlockInput) => unwrap(await updateBlockAction(input)),
    onSettled: () => invalidateBlockData(client, userId),
  });
}

/**
 * Moves or resizes a block. The change appears at once and is rolled back if the server
 * rejects it, for example because the new time overlaps another block.
 */
export function useMoveBlock(userId: string) {
  const client = useQueryClient();
  const key = scopedKey(userId, BLOCKS);

  return useMutation({
    mutationFn: async (input: MoveBlockInput) => unwrap(await moveBlockAction(input)),

    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: key });
      const snapshots = client.getQueriesData<CalendarBlock[]>({ queryKey: key });
      client.setQueriesData<CalendarBlock[]>({ queryKey: key }, (items) =>
        items?.map((block) =>
          block.id === input.blockId
            ? { ...block, startMinute: input.startMinute, endMinute: input.endMinute }
            : block,
        ),
      );
      return { snapshots };
    },

    onError: (_error, _input, context) => {
      context?.snapshots.forEach(([queryKey, data]) => client.setQueryData(queryKey, data));
    },

    onSettled: () => invalidateBlockData(client, userId),
  });
}

export function useDeleteBlock(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => unwrap(await deleteBlockAction(blockId)),
    onSettled: () => invalidateBlockData(client, userId),
  });
}

export function useSetDayStatus(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { logDate: string; status: DayStatus }) =>
      unwrap(await setDayStatusAction(input)),
    onSettled: (_data, _error, input) => {
      void client.invalidateQueries({ queryKey: scopedKey(userId, CHECKLIST, input.logDate) });
      void client.invalidateQueries({ queryKey: scopedKey(userId, SCORES) });
    },
  });
}

export { DAY_STATUSES };
