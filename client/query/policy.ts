// Named cache policies. Components pick one by name instead of inventing numbers.
export const CACHE_POLICY = {
  /** Data that changes under the user's hands, such as a timer. */
  live: { staleTime: 0, gcTime: 60_000 },
  /** Lists, history, and boards. Reopening a page shows cached data at once. */
  standard: { staleTime: 5 * 60_000, gcTime: 30 * 60_000 },
  /** Private data. Never kept after the component unmounts. */
  private: { staleTime: 0, gcTime: 0 },
} as const;

/** Local storage keeps non-private data for this long. */
export const PERSIST_TTL_MS = 5 * 60_000;
