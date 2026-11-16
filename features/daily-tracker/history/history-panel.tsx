"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { useDebouncedValue } from "@/client/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { BLOCK_CATEGORIES, categoryLabelKey } from "@/domain/categories";
import { formatMinute } from "@/domain/time/clock";
import { t } from "@/lib/i18n";
import { BlockDialog, type BlockDraft } from "../calendar/block-dialog";
import { CATEGORY_HUE } from "../category-hue";
import { useDeleteBlock } from "../use-daily-data";
import { useBlockHistory, type HistoryItem } from "../use-daily-tracker";

const SELECT =
  "min-h-11 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

function formatLogDate(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function setParam(params: URLSearchParams, key: string, value: string): void {
  if (value) params.set(key, value);
  else params.delete(key);
}

export function HistoryPanel({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [search, setSearch] = useState(params.get("q") ?? "");
  const query = useDebouncedValue(search.trim(), 300);

  // Filters live in the URL, so a link or the browser back button restores them.
  // The date and view parameters of the tracker are kept as they are.
  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    setParam(next, "from", from);
    setParam(next, "to", to);
    setParam(next, "category", category);
    setParam(next, "q", query);
    const text = next.toString();
    if (text !== params.toString()) {
      router.replace(`${pathname}?${text}`, { scroll: false });
    }
  }, [from, to, category, query, params, pathname, router]);

  const history = useBlockHistory(userId, {
    from: from || undefined,
    to: to || undefined,
    category: category || undefined,
    q: query || undefined,
  });

  const items: HistoryItem[] = history.data?.pages.flatMap((page) => page.items) ?? [];
  const filtersActive = from !== "" || to !== "" || category !== "" || search !== "";

  const [draft, setDraft] = useState<BlockDraft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const remove = useDeleteBlock(userId);

  const onDelete = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    remove.mutate(id, { onSettled: () => setConfirmId(null) });
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setCategory("");
    setSearch("");
  };

  return (
    <section aria-labelledby="history-title" className="space-y-5">
      <header className="space-y-1">
        <h2 id="history-title" className="text-sm font-semibold">
          {t("history.title")}
        </h2>
        <p className="text-ink-muted text-xs leading-relaxed">{t("history.lead")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Field id="history-from" label={t("history.from")}>
          <Input
            id="history-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </Field>
        <Field id="history-to" label={t("history.to")}>
          <Input
            id="history-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </Field>
        <Field id="history-category" label={t("history.category")}>
          <select
            id="history-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={SELECT}
          >
            <option value="">{t("history.all")}</option>
            {BLOCK_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {t(categoryLabelKey(option))}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2 xl:col-span-2">
          <Field id="history-search" label={t("history.search")}>
            <Input
              id="history-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              maxLength={60}
            />
          </Field>
        </div>
      </div>

      {filtersActive && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          {t("history.clear")}
        </Button>
      )}

      {history.isPending && (
        <div aria-busy="true" className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      )}

      {history.isError && (
        <EmptyState
          icon={History}
          title={t("history.error")}
          action={
            <Button variant="secondary" onClick={() => history.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      )}

      {!history.isPending && !history.isError && items.length === 0 && (
        <EmptyState icon={History} title={t("history.empty")} />
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm">
            <caption className="sr-only">{t("history.title")}</caption>
            <thead className="text-ink-muted text-xs tracking-wide uppercase">
              <tr className="border-line border-b">
                <th scope="col" className="py-2 pr-3 font-medium">
                  {t("history.col.date")}
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">
                  {t("history.col.time")}
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  {t("history.col.activity")}
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">
                  {t("history.col.category")}
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
                  {t("history.col.source")}
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  <span className="sr-only">{t("history.col.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-line/60 border-b">
                  <td className="py-3 pr-3 tabular-nums">{formatLogDate(item.logDate)}</td>
                  <td className="text-ink-muted hidden py-3 pr-3 tabular-nums md:table-cell">
                    {formatMinute(item.startMinute)} to {formatMinute(item.endMinute)}
                  </td>
                  <td className="max-w-[18rem] truncate py-3 pr-3 font-medium">{item.activity}</td>
                  <td className="hidden py-3 pr-3 sm:table-cell">
                    <Pill hue={CATEGORY_HUE[item.category]}>
                      {t(categoryLabelKey(item.category))}
                    </Pill>
                  </td>
                  <td className="hidden py-3 pr-3 lg:table-cell">
                    <Pill>{t(`dailyTracker.source.${item.source}`)}</Pill>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDraft({ mode: "edit", block: item })}
                      >
                        {t("history.edit")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        pending={remove.isPending && remove.variables === item.id}
                        className={confirmId === item.id ? "text-negative" : undefined}
                      >
                        {confirmId === item.id
                          ? t("dailyTracker.block.confirmDelete")
                          : t("history.delete")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {remove.isError && (
        <p role="alert" className="text-negative text-sm">
          {t("history.deleteError")}
        </p>
      )}

      {history.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            pending={history.isFetchingNextPage}
            onClick={() => history.fetchNextPage()}
          >
            {t("history.loadMore")}
          </Button>
        </div>
      )}

      <BlockDialog userId={userId} draft={draft} onClose={() => setDraft(null)} />
    </section>
  );
}
