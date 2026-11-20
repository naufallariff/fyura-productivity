import type { QueryClient } from "@tanstack/react-query";
import { browserStore, clearCache } from "@/client/persist/ttl-store";

/** Call before signing out so the next user never sees the previous user's data. */
export function clearClientSession(client: QueryClient): void {
  client.clear();
  const store = browserStore();
  if (store) clearCache(store);
}
