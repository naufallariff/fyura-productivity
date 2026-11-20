import { browserStore, cacheKey, readFresh, writeFresh } from "./ttl-store";
import { PERSIST_TTL_MS } from "@/client/query/policy";

/**
 * Wraps a fetcher so the result is kept in local storage for PERSIST_TTL_MS.
 * Use it as a queryFn. A fresh local copy skips the network entirely.
 */
export function withPersistence<T>(options: {
  userId: string;
  scope: string;
  parse: (value: unknown) => T;
  fetch: (signal: AbortSignal) => Promise<T>;
}) {
  const key = cacheKey(options.userId, options.scope);

  return async ({ signal }: { signal: AbortSignal }): Promise<T> => {
    const store = browserStore();
    if (store) {
      const hit = readFresh(store, key, PERSIST_TTL_MS, Date.now(), options.parse);
      if (hit) return hit.value;
    }

    const value = await options.fetch(signal);
    if (store) writeFresh(store, key, value, Date.now());
    return value;
  };
}
