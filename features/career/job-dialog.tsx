// features/career/job-dialog.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { JOB_STATUSES } from "@/domain/career/status";
import { t } from "@/lib/i18n";
import { ActivityCounters } from "./activity-counters";
import { useCreateJob, useJobDetail, useUpdateJob } from "./use-career";

const TEXTAREA =
  "min-h-24 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 py-2.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";
const SELECT =
  "min-h-11 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

export function JobDialog({
  userId,
  jobId,
  creating,
  onClose,
}: {
  readonly userId: string;
  readonly jobId: string | null;
  readonly creating: boolean;
  readonly onClose: () => void;
}) {
  const open = creating || jobId !== null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={creating ? t("career.dialog.createTitle") : t("career.dialog.editTitle")}
      closeLabel={t("shell.close")}
    >
      {open && creating && <JobCreateForm userId={userId} onClose={onClose} />}
      {open && !creating && jobId !== null && (
        <JobEditForm userId={userId} jobId={jobId} onClose={onClose} />
      )}
    </Dialog>
  );
}

function JobCreateForm({
  userId,
  onClose,
}: {
  readonly userId: string;
  readonly onClose: () => void;
}) {
  const create = useCreateJob(userId);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const company = String(form.get("company") ?? "").trim();
    const role = String(form.get("role") ?? "").trim();
    if (company === "" || role === "") {
      setError(t("career.error.required"));
      return;
    }
    setError(null);
    create.mutate(
      {
        company,
        role,
        source: String(form.get("source") ?? "").trim(),
        link: String(form.get("link") ?? "").trim(),
        appliedAt: String(form.get("appliedAt") ?? "") || null,
        nextAction: String(form.get("nextAction") ?? "").trim(),
        nextActionDate: String(form.get("nextActionDate") ?? "") || null,
        salaryInfo: String(form.get("salaryInfo") ?? "").trim(),
        notes: String(form.get("notes") ?? "").trim(),
      },
      { onSuccess: onClose, onError: () => setError(t("career.error.generic")) },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <JobFields />
      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" pending={create.isPending}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}

function JobEditForm({
  userId,
  jobId,
  onClose,
}: {
  readonly userId: string;
  readonly jobId: string;
  readonly onClose: () => void;
}) {
  const detail = useJobDetail(userId, jobId);
  if (detail.isPending) return <p className="text-ink-muted text-sm">{t("common.loading")}</p>;
  if (detail.isError || !detail.data) {
    return (
      <p role="alert" className="text-negative text-sm">
        {t("career.error.load")}
      </p>
    );
  }
  return <JobEditor key={detail.data.id} userId={userId} job={detail.data} onClose={onClose} />;
}

function JobEditor({
  userId,
  job,
  onClose,
}: {
  readonly userId: string;
  readonly job: NonNullable<ReturnType<typeof useJobDetail>["data"]>;
  readonly onClose: () => void;
}) {
  const update = useUpdateJob(userId);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(job.status);

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    update.mutate(
      {
        jobId: job.id,
        company: String(form.get("company") ?? "").trim(),
        role: String(form.get("role") ?? "").trim(),
        source: String(form.get("source") ?? "").trim(),
        link: String(form.get("link") ?? "").trim(),
        appliedAt: String(form.get("appliedAt") ?? "") || null,
        nextAction: String(form.get("nextAction") ?? "").trim(),
        nextActionDate: String(form.get("nextActionDate") ?? "") || null,
        salaryInfo: String(form.get("salaryInfo") ?? "").trim(),
        notes: String(form.get("notes") ?? "").trim(),
      },
      { onSuccess: onClose, onError: () => setError(t("career.error.generic")) },
    );
  };

  const changeStatus = (next: string) => {
    setStatus(next as typeof status);
    setError(null);
    update.mutate(
      { jobId: job.id, status: next },
      { onError: () => setError(t("career.error.generic")) },
    );
  };

  const toggleArchive = () => {
    update.mutate(
      { jobId: job.id, archived: !job.archived },
      { onSuccess: onClose, onError: () => setError(t("career.error.generic")) },
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSave} className="grid gap-4">
        <JobFields job={job} />
        {error && (
          <p role="alert" className="text-negative text-sm">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="danger" pending={update.isPending} onClick={toggleArchive}>
            {job.archived ? t("career.action.restore") : t("career.action.archive")}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" pending={update.isPending}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </form>

      <section aria-labelledby="job-status-title" className="space-y-2">
        <h3 id="job-status-title" className="text-sm font-semibold">
          {t("career.field.status")}
        </h3>
        <select
          value={status}
          onChange={(event) => changeStatus(event.target.value)}
          className={SELECT}
        >
          {JOB_STATUSES.map((option) => (
            <option key={option} value={option}>
              {t(`career.status.${option}`)}
            </option>
          ))}
        </select>
      </section>

      <section aria-labelledby="job-history-title" className="space-y-2">
        <h3 id="job-history-title" className="text-sm font-semibold">
          {t("career.history.title")}
        </h3>
        <ol className="space-y-2">
          {job.events.map((event) => (
            <li key={event.id} className="text-ink-muted text-xs tabular-nums">
              {new Date(event.occurredAt).toLocaleDateString("en", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {" - "}
              {event.fromStatus === null
                ? t("career.history.created")
                : t("career.history.change", {
                    from: t(`career.status.${event.fromStatus}`),
                    to: t(`career.status.${event.toStatus}`),
                  })}
            </li>
          ))}
        </ol>
      </section>

      <ActivityCounters userId={userId} />
    </div>
  );
}

function JobFields({
  job,
}: {
  readonly job?: NonNullable<ReturnType<typeof useJobDetail>["data"]>;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="job-company" label={t("career.field.company")}>
          <Input
            id="job-company"
            name="company"
            defaultValue={job?.company ?? ""}
            maxLength={120}
            required
          />
        </Field>
        <Field id="job-role" label={t("career.field.role")}>
          <Input
            id="job-role"
            name="role"
            defaultValue={job?.role ?? ""}
            maxLength={120}
            required
          />
        </Field>
        <Field id="job-source" label={t("career.field.source")}>
          <Input id="job-source" name="source" defaultValue={job?.source ?? ""} maxLength={80} />
        </Field>
        <Field id="job-link" label={t("career.field.link")}>
          <Input
            id="job-link"
            name="link"
            type="url"
            defaultValue={job?.link ?? ""}
            maxLength={2000}
          />
        </Field>
        <Field id="job-applied" label={t("career.field.appliedAt")}>
          <Input
            id="job-applied"
            name="appliedAt"
            type="date"
            defaultValue={job?.appliedAt ?? ""}
          />
        </Field>
        <Field id="job-next-date" label={t("career.field.nextActionDate")}>
          <Input
            id="job-next-date"
            name="nextActionDate"
            type="date"
            defaultValue={job?.nextActionDate ?? ""}
          />
        </Field>
      </div>
      <Field id="job-next" label={t("career.field.nextAction")}>
        <Input
          id="job-next"
          name="nextAction"
          defaultValue={job?.nextAction ?? ""}
          maxLength={200}
        />
      </Field>
      <Field id="job-salary" label={t("career.field.salary")}>
        <Input
          id="job-salary"
          name="salaryInfo"
          defaultValue={job?.salaryInfo ?? ""}
          maxLength={500}
        />
      </Field>
      <Field id="job-notes" label={t("career.field.notes")}>
        <textarea
          id="job-notes"
          name="notes"
          defaultValue={job?.notes ?? ""}
          maxLength={10000}
          className={TEXTAREA}
        />
      </Field>
    </>
  );
}
