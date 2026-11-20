"use client";

import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { z, type ZodType } from "zod";
import { apiGet } from "@/client/api/fetch";
import { CACHE_POLICY } from "@/client/query/policy";

export const LIST_PAGE_SIZE = 25;

export function pageOf<T>(item: ZodType<T>) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

/**
 * Paginated list with a cursor. The filters are part of the query key, so changing
 * a filter starts a new list and keeps the old one cached for a while.
 */
export function useCursorList<T, F extends Record<string, string | undefined>>(options: {
  queryKey: QueryKey;
  path: string;
  filters: F;
  item: ZodType<T>;
}) {
  const schema = pageOf(options.item);

  return useInfiniteQuery({
    queryKey: [...options.queryKey, options.filters],
    queryFn: ({ pageParam, signal }) =>
      apiGet(
        options.path,
        { ...options.filters, limit: LIST_PAGE_SIZE, cursor: pageParam ?? undefined },
        schema,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    ...CACHE_POLICY.standard,
  });
}
