// features/career/job-board.tsx
"use client";

import { useState } from "react";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { JOB_STATUSES, type JobStatus } from "@/domain/career/status";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { JobDialog } from "./job-dialog";
import type { JobSummary } from "./schemas";
import { useCareerBoard, useUpdateJob } from "./use-career";

export function JobBoard({ userId, today }: { readonly userId: string; readonly today: string }) {
  const board = useCareerBoard(userId);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  if (board.isPending) return <Skeleton className="h-96" />;

  if (board.isError) {
    return (
      <EmptyState
        icon={BriefcaseBusiness}
        title={t("career.board.loadError")}
        action={
          <Button variant="secondary" onClick={() => board.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  const jobs = board.data ?? [];

  return (
    <section aria-labelledby="board-title" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="board-title" className="text-sm font-semibold">
          {t("career.board.title")}
        </h2>
        <Button icon={Plus} onClick={() => setCreating(true)}>
          {t("career.add")}
        </Button>
      </header>

      {jobs.length === 0 && (
        <EmptyState
          icon={BriefcaseBusiness}
          title={t("career.board.empty")}
          body={t("career.board.emptyBody")}
        />
      )}

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {JOB_STATUSES.map((status) => (
          <Column
            key={status}
            userId={userId}
            status={status}
            jobs={jobs.filter((job) => job.status === status)}
            onOpen={setOpenId}
          />
        ))}
      </div>

      <JobDialog
        userId={userId}
        jobId={openId}
        creating={creating}
        today={today}
        onClose={() => {
          setOpenId(null);
          setCreating(false);
        }}
      />
    </section>
  );
}

function Column({
  userId,
  status,
  jobs,
  onOpen,
}: {
  readonly userId: string;
  readonly status: JobStatus;
  readonly jobs: readonly JobSummary[];
  readonly onOpen: (id: string) => void;
}) {
  return (
    <section
      aria-labelledby={`col-${status}`}
      className="glass flex w-64 shrink-0 snap-start flex-col gap-3 p-3"
    >
      <header className="flex items-center justify-between gap-2 px-1">
        <h3 id={`col-${status}`} className="text-xs font-semibold tracking-wide uppercase">
          {t(`career.status.${status}`)}
        </h3>
        <span className="text-ink-muted text-xs tabular-nums">{jobs.length}</span>
      </header>
      <ul className="flex min-h-16 flex-col gap-2">
        {jobs.map((job) => (
          <li key={job.id}>
            <JobCard userId={userId} job={job} onOpen={() => onOpen(job.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function JobCard({
  userId,
  job,
  onOpen,
}: {
  readonly userId: string;
  readonly job: JobSummary;
  readonly onOpen: () => void;
}) {
  const update = useUpdateJob(userId);

  return (
    <article className="rounded-control border-line space-y-2 border p-3 [background:var(--glass-solid)]">
      <button
        type="button"
        onClick={onOpen}
        className="focus-visible:ring-accent rounded-control block w-full space-y-1 text-left focus-visible:ring-2"
      >
        <span className="block truncate text-sm font-semibold">{job.company}</span>
        <span className="text-ink-muted block truncate text-xs">{job.role}</span>
      </button>

      {job.needsFollowUp && <Pill tone="warning">{t("career.followUp")}</Pill>}

      <label className="block">
        <span className="sr-only">{t("career.field.status")}</span>
        <select
          value={job.status}
          disabled={update.isPending}
          onChange={(event) => update.mutate({ jobId: job.id, status: event.target.value })}
          className={cn(
            "rounded-control border-line text-ink focus-visible:ring-accent min-h-9 w-full border bg-transparent px-2 text-xs outline-none focus-visible:ring-2",
          )}
        >
          {JOB_STATUSES.map((option) => (
            <option key={option} value={option}>
              {t(`career.status.${option}`)}
            </option>
          ))}
        </select>
      </label>

      {update.isError && (
        <p role="alert" className="text-negative text-xs">
          {t("career.error.generic")}
        </p>
      )}
    </article>
  );
}
