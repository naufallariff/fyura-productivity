// features/career/job-table.tsx
"use client";

import { useState } from "react";
import { useDebouncedValue } from "@/client/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { JOB_STATUSES } from "@/domain/career/status";
import { BriefcaseBusinessIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import { JobDialog } from "./job-dialog";
import { useJobsTable, type JobFilters } from "./use-career";

const SELECT =
  "min-h-11 w-full rounded-lg border border-(--border-control) bg-(--bg-surface) px-4 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

export function JobTable({ userId, today }: { readonly userId: string; readonly today: string }) {
  const [status, setStatus] = useState("");
  const [archived, setArchived] = useState(false);
  const [searchText, setSearchText] = useState("");
  const q = useDebouncedValue(searchText.trim(), 300);
  const [openId, setOpenId] = useState<string | null>(null);

  const filters: JobFilters = {
    status: status || undefined,
    q: q || undefined,
    archived: archived ? "1" : undefined,
  };
  const table = useJobsTable(userId, filters);
  const items = table.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section aria-labelledby="table-title" className="space-y-4">
      <h2 id="table-title" className="text-sm font-semibold">
        {t("career.table.title")}
      </h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="job-search" label={t("career.table.search")}>
          <Input
            id="job-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            maxLength={80}
          />
        </Field>
        <Field id="job-status" label={t("career.field.status")}>
          <select
            id="job-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={SELECT}
          >
            <option value="">{t("career.table.anyStatus")}</option>
            {JOB_STATUSES.map((option) => (
              <option key={option} value={option}>
                {t(`career.status.${option}`)}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex min-h-11 items-end gap-3 pb-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={archived}
            onChange={(event) => setArchived(event.target.checked)}
          />
          {t("career.table.showArchived")}
        </label>
      </div>

      {table.isPending && <Skeleton className="h-40" />}

      {table.isError && (
        <EmptyState
          icon={BriefcaseBusinessIcon}
          title={t("career.table.loadError")}
          action={
            <Button variant="secondary" onClick={() => table.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      )}

      {table.isSuccess && items.length === 0 && (
        <EmptyState icon={BriefcaseBusinessIcon} title={t("career.table.empty")} />
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-lg text-left text-sm">
            <caption className="sr-only">{t("career.table.title")}</caption>
            <thead className="text-ink-muted text-xs tracking-wide uppercase">
              <tr className="border-line border-b">
                <th scope="col" className="py-2 pr-3 font-medium">
                  {t("career.field.company")}
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">
                  {t("career.field.role")}
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  {t("career.field.status")}
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">
                  {t("career.field.nextAction")}
                </th>
                <th scope="col" className="py-2 font-medium">
                  <span className="sr-only">{t("career.table.open")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((job) => (
                <tr key={job.id} className="border-line/60 border-b">
                  <td className="py-3 pr-3 font-medium">{job.company}</td>
                  <td className="text-ink-muted hidden py-3 pr-3 sm:table-cell">{job.role}</td>
                  <td className="py-3 pr-3">
                    <span className="flex flex-wrap items-center gap-2">
                      <Pill>{t(`career.status.${job.status}`)}</Pill>
                      {job.needsFollowUp && <Pill tone="warning">{t("career.followUp")}</Pill>}
                    </span>
                  </td>
                  <td className="text-ink-muted hidden py-3 pr-3 md:table-cell">
                    {job.nextActionDate ?? "-"}
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setOpenId(job.id)}>
                      {t("career.table.open")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {table.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            pending={table.isFetchingNextPage}
            onClick={() => table.fetchNextPage()}
          >
            {t("career.table.loadMore")}
          </Button>
        </div>
      )}

      <JobDialog
        userId={userId}
        jobId={openId}
        creating={false}
        today={today}
        onClose={() => setOpenId(null)}
      />
    </section>
  );
}
