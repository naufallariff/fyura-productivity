// features/journal/journal-day.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BookText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { JOURNAL_KINDS, type JournalKind } from "@/domain/journal/kinds";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import type { JournalEntryDto } from "@/server/services/journal";
import { createJournalAction, deleteJournalAction } from "./actions";

const CONTROL =
  "min-h-11 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";
const TEXTAREA =
  "min-h-32 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 py-2.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

function journalHref(date: string, kind: JournalKind | undefined): string {
  const params = new URLSearchParams({ tab: "jurnal", date });
  if (kind) params.set("kind", kind);
  return `/journal?${params.toString()}`;
}

function errorText(code: string): string {
  if (code === "RATE_LIMITED") return t("journal.error.rateLimited");
  if (code === "VALIDATION_FAILED") return t("journal.error.invalid");
  return t("journal.error.generic");
}

export function JournalDay({
  entries,
  logDate,
  kind,
}: {
  readonly entries: readonly JournalEntryDto[];
  readonly logDate: string;
  readonly kind: JournalKind | undefined;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [entryKind, setEntryKind] = useState<JournalKind>("DAILY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = body.trim();
    if (text === "") {
      setError(t("journal.error.invalid"));
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createJournalAction({
      logDate,
      kind: entryKind,
      title: title.trim(),
      body: text,
    });
    setSaving(false);
    if (!result.ok) {
      setError(errorText(result.code));
      return;
    }
    setTitle("");
    setBody("");
    router.refresh();
  };

  const onDelete = async (entryId: string) => {
    if (confirmId !== entryId) {
      setConfirmId(entryId);
      return;
    }
    setBusyId(entryId);
    setError(null);
    const result = await deleteJournalAction({ entryId });
    setBusyId(null);
    setConfirmId(null);
    if (!result.ok) {
      setError(errorText(result.code));
      return;
    }
    router.refresh();
  };

  return (
    <section aria-labelledby="journal-day-title" className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h3 id="journal-day-title" className="text-sm font-semibold">
          {t("journal.list.title")}
        </h3>
        <Field id="journal-date" label={t("journal.date")}>
          <Input
            id="journal-date"
            type="date"
            value={logDate}
            onChange={(event) => {
              if (event.target.value) router.push(journalHref(event.target.value, kind));
            }}
          />
        </Field>
      </header>

      <nav aria-label={t("journal.filter.label")}>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={journalHref(logDate, undefined)}
              aria-current={kind === undefined ? "true" : undefined}
              className={cn(
                "focus-visible:ring-accent inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium focus-visible:ring-2",
                kind === undefined ? "border-accent bg-accent-soft" : "border-line text-ink-muted",
              )}
            >
              {t("journal.filter.all")}
            </Link>
          </li>
          {JOURNAL_KINDS.map((option) => (
            <li key={option}>
              <Link
                href={journalHref(logDate, option)}
                aria-current={kind === option ? "true" : undefined}
                className={cn(
                  "focus-visible:ring-accent inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium focus-visible:ring-2",
                  kind === option ? "border-accent bg-accent-soft" : "border-line text-ink-muted",
                )}
              >
                {t(`journal.kind.${option}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form onSubmit={onSave} className="glass grid gap-4 p-4">
        <p className="text-ink-muted text-xs leading-relaxed">{t("journal.form.body")}</p>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field id="journal-title" label={t("journal.form.titleField")}>
            <Input
              id="journal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
            />
          </Field>
          <Field id="journal-kind" label={t("journal.form.kind")}>
            <select
              id="journal-kind"
              value={entryKind}
              onChange={(event) => setEntryKind(event.target.value as JournalKind)}
              className={CONTROL}
            >
              {JOURNAL_KINDS.map((option) => (
                <option key={option} value={option}>
                  {t(`journal.kind.${option}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field id="journal-body" label={t("journal.form.title")}>
          <textarea
            id="journal-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={20000}
            required
            className={TEXTAREA}
          />
        </Field>
        {error && (
          <p role="alert" className="text-negative text-sm">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" pending={saving}>
            {t("journal.form.submit")}
          </Button>
        </div>
      </form>

      {entries.length === 0 ? (
        <EmptyState icon={BookText} title={t("journal.list.empty")} />
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="glass space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill>{t(`journal.kind.${entry.kind}`)}</Pill>
                {entry.late && <Pill tone="warning">{t("journal.late")}</Pill>}
                {entry.title && <p className="text-sm font-semibold">{entry.title}</p>}
              </div>
              <p className="text-ink text-sm leading-relaxed whitespace-pre-line">{entry.body}</p>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  pending={busyId === entry.id}
                  className={cn(confirmId === entry.id && "text-negative")}
                  onClick={() => onDelete(entry.id)}
                >
                  {confirmId === entry.id ? t("tadabur.confirmDelete") : t("journal.delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
