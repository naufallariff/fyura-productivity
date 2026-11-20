// features/journal/tadabur/tadabur-tab.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TadaburPanel } from "./tadabur-panel";
import type { TadaburFilters } from "./use-tadabur";

export function TadaburTab({ userId, today }: { readonly userId: string; readonly today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters: TadaburFilters = {
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    surah: params.get("surah") ?? undefined,
  };

  const onFiltersChange = (next: TadaburFilters) => {
    const search = new URLSearchParams({ tab: "tadabur" });
    if (next.from) search.set("from", next.from);
    if (next.to) search.set("to", next.to);
    if (next.surah) search.set("surah", next.surah);
    router.replace(`${pathname}?${search.toString()}`, { scroll: false });
  };

  return (
    <TadaburPanel
      userId={userId}
      today={today}
      filters={filters}
      onFiltersChange={onFiltersChange}
    />
  );
}
