import { QueryClient } from "@tanstack/react-query";
import { CACHE_POLICY } from "./policy";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        ...CACHE_POLICY.standard,
        retry: 1,
        // Focus events trigger refetches that users do not expect.
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: { retry: 0 },
    },
  });
}
