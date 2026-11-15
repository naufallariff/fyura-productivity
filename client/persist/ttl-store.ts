// Local storage with a time to live. Pure logic is separated from the browser
// adapter so it can be tested with an in-memory store.

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

export const CACHE_PREFIX = "fyura:cache:v1:";

const PRIVATE_PREFIX = "private";

/** Throws for private scopes. Private data must never reach local storage. */
export function assertPersistable(scope: string): void {
  if (scope === PRIVATE_PREFIX || scope.startsWith(`${PRIVATE_PREFIX}:`)) {
    throw new Error(`Scope "${scope}" is private and cannot be persisted`);
  }
}

export function cacheKey(userId: string, scope: string): string {
  assertPersistable(scope);
  return `${CACHE_PREFIX}${userId}:${scope}`;
}

interface Entry {
  readonly savedAt: number;
  readonly value: unknown;
}

/**
 * Returns the stored value only when it is fresh and passes validation.
 * Anything stale, malformed, or invalid is removed.
 */
export function readFresh<T>(
  store: KeyValueStore,
  key: string,
  ttlMs: number,
  now: number,
  parse: (value: unknown) => T,
): { readonly value: T; readonly savedAt: number } | null {
  const raw = store.getItem(key);
  if (raw === null) return null;

  try {
    const entry = JSON.parse(raw) as Partial<Entry>;
    if (typeof entry.savedAt !== "number" || !("value" in entry)) {
      throw new Error("Malformed cache entry");
    }
    const age = now - entry.savedAt;
    if (age < 0 || age > ttlMs) {
      store.removeItem(key);
      return null;
    }
    return { value: parse(entry.value), savedAt: entry.savedAt };
  } catch {
    store.removeItem(key);
    return null;
  }
}

export function writeFresh(store: KeyValueStore, key: string, value: unknown, now: number): void {
  const entry: Entry = { savedAt: now, value };
  store.setItem(key, JSON.stringify(entry));
}

/** Removes one user's entries, or every entry when no user id is given. */
export function clearCache(store: KeyValueStore, userId?: string): void {
  const prefix = userId ? `${CACHE_PREFIX}${userId}:` : CACHE_PREFIX;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.removeItem(key);
  }
}

/** Browser adapter. Returns null on the server, and when storage is blocked by the browser. */
export function browserStore(): KeyValueStore | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    return {
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: (key) => storage.removeItem(key),
      keys: () =>
        Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(
          (key): key is string => key !== null,
        ),
    };
  } catch {
    return null;
  }
}
