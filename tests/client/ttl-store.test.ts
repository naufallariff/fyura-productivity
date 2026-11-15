import { describe, expect, it } from "vitest";
import {
  assertPersistable,
  cacheKey,
  clearCache,
  readFresh,
  writeFresh,
  type KeyValueStore,
} from "@/client/persist/ttl-store";

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    keys: () => [...data.keys()],
  };
}

const asNumber = (value: unknown): number => {
  if (typeof value !== "number") throw new Error("not a number");
  return value;
};

describe("ttl store", () => {
  it("returns a fresh value and removes an expired one", () => {
    const store = memoryStore();
    const key = cacheKey("user-1", "daily");
    writeFresh(store, key, 42, 1_000);

    expect(readFresh(store, key, 500, 1_200, asNumber)?.value).toBe(42);
    expect(readFresh(store, key, 500, 2_000, asNumber)).toBeNull();
    expect(store.data.has(key)).toBe(false);
  });

  it("removes entries that fail validation", () => {
    const store = memoryStore();
    const key = cacheKey("user-1", "daily");
    writeFresh(store, key, "not a number", 1_000);

    expect(readFresh(store, key, 500, 1_100, asNumber)).toBeNull();
    expect(store.data.has(key)).toBe(false);
  });

  it("removes corrupted JSON", () => {
    const store = memoryStore();
    const key = cacheKey("user-1", "daily");
    store.setItem(key, "{broken");

    expect(readFresh(store, key, 500, 1_000, asNumber)).toBeNull();
    expect(store.data.has(key)).toBe(false);
  });

  it("clears only the requested user's entries", () => {
    const store = memoryStore();
    writeFresh(store, cacheKey("user-1", "daily"), 1, 0);
    writeFresh(store, cacheKey("user-2", "daily"), 2, 0);

    clearCache(store, "user-1");
    expect([...store.data.keys()]).toEqual([cacheKey("user-2", "daily")]);
  });

  it("refuses private scopes", () => {
    expect(() => assertPersistable("private")).toThrow(/private/);
    expect(() => assertPersistable("private:recovery")).toThrow(/private/);
    expect(() => cacheKey("user-1", "private")).toThrow(/private/);
    expect(() => assertPersistable("daily")).not.toThrow();
  });
});
