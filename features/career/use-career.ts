// features/career/use-career.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/client/api/fetch";
import { useCursorList } from "@/client/hooks/use-cursor-list";
import { scopedKey } from "@/client/query/keys";
import { CACHE_POLICY } from "@/client/query/policy";
import type { ActionResult } from "@/server/api/action";
import { createJobAction, logActivityAction, updateJobAction } from "./actions";
import {
  ActivityRangeSchema,
  BoardSchema,
  JobDetailSchema,
  JobSummarySchema,
  SummarySchema,
} from "./schemas";

const SCOPE = "career";
const WRITE_SCOPE = { id: "career-writes" } as const;

export type JobFilters = {
  readonly status?: string;
  readonly q?: string;
  readonly archived?: string;
};

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.code);
  return result.data;
}

export function useCareerBoard(userId: string) {
  return useQuery({
    queryKey: scopedKey(userId, SCOPE, "board"),
    queryFn: ({ signal }) =>
      apiGet("/api/v1/career/board", {}, BoardSchema, signal).then((body) => body.items),
    ...CACHE_POLICY.standard,
  });
}

export function useJobsTable(userId: string, filters: JobFilters) {
  return useCursorList({
    queryKey: scopedKey(userId, SCOPE, "table", JSON.stringify(filters)),
    path: "/api/v1/career/jobs",
    filters,
    item: JobSummarySchema,
  });
}

export function useJobDetail(userId: string, jobId: string | null) {
  return useQuery({
    queryKey: scopedKey(userId, SCOPE, "job", jobId ?? ""),
    queryFn: ({ signal }) =>
      apiGet(`/api/v1/career/jobs/${jobId ?? ""}`, {}, JobDetailSchema, signal),
    enabled: jobId !== null,
    ...CACHE_POLICY.standard,
  });
}

export function useCareerSummary(userId: string) {
  return useQuery({
    queryKey: scopedKey(userId, SCOPE, "summary"),
    queryFn: ({ signal }) => apiGet("/api/v1/career/summary", {}, SummarySchema, signal),
    ...CACHE_POLICY.standard,
  });
}

export function useActivityRange(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: scopedKey(userId, SCOPE, "activity", from, to),
    queryFn: ({ signal }) =>
      apiGet("/api/v1/career/activities", { from, to }, ActivityRangeSchema, signal),
    ...CACHE_POLICY.standard,
  });
}

export function useCreateJob(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: Record<string, unknown>) => unwrap(await createJobAction(input)),
    onSettled: () => client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) }),
  });
}

export function useUpdateJob(userId: string) {
  const client = useQueryClient();
  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: Record<string, unknown> & { jobId: string }) =>
      unwrap(await updateJobAction(input)),
    onSettled: (_data, _error, input) => {
      void client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE) });
      void client.invalidateQueries({ queryKey: scopedKey(userId, SCOPE, "job", input.jobId) });
    },
  });
}

/**
 * Activity counter. The new value appears at once and is rolled back when the server
 * rejects the change. Serialized through the write scope, so quick taps keep their order.
 */
export function useLogActivity(userId: string, from: string, to: string) {
  const client = useQueryClient();
  const key = scopedKey(userId, SCOPE, "activity", from, to);

  return useMutation({
    scope: WRITE_SCOPE,
    mutationFn: async (input: { activityDate: string; kind: string; delta: number }) =>
      unwrap(await logActivityAction(input)),

    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<ActivityRangeData>(key);
      client.setQueryData<ActivityRangeData>(key, (data) => {
        if (!data) return data;
        const exists = data.items.some(
          (row) => row.date === input.activityDate && row.kind === input.kind,
        );
        const items = exists
          ? data.items.map((row) =>
              row.date === input.activityDate && row.kind === input.kind
                ? { ...row, count: Math.max(0, Math.min(1000, row.count + input.delta)) }
                : row,
            )
          : data.items;
        return { ...data, items };
      });
      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },

    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}

type ActivityRangeData = {
  items: Array<{ date: string; kind: string; count: number }>;
  totals: Record<string, number>;
};
