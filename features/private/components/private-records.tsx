"use client";

import { FileLock2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { t } from "@/lib/i18n";
import type { PrivateRecordDto } from "@/server/services/private";
import {
  createPrivateRecordAction,
  deletePrivateRecordAction,
  listPrivateRecordsAction,
  updatePrivateRecordAction,
} from "../record-actions";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; records: PrivateRecordDto[] };

function errorText(code: string): string {
  switch (code) {
    case "NOT_FOUND":
      return t("privateSpace.records.notFound");
    case "VALIDATION_FAILED":
      return t("privateSpace.records.invalid");
    case "RATE_LIMITED":
      return t("privateSpace.records.rateLimited");
    default:
      return t("privateSpace.records.error");
  }
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function PrivateRecords({ onLocked }: { readonly onLocked: () => void }) {
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState<"new" | PrivateRecordDto | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    let active = true;
    void listPrivateRecordsAction().then(
      (result) => {
        if (!active) return;
        if (result.ok) setList({ status: "ready", records: result.data });
        else if (result.code === "PRIVATE_LOCKED") onLocked();
        else setList({ status: "error", message: errorText(result.code) });
      },
      () => {
        if (active) setList({ status: "error", message: errorText("INTERNAL") });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt, onLocked]);

  function onSaved(record: PrivateRecordDto) {
    setList((current) =>
      current.status === "ready"
        ? { ...current, records: [record, ...current.records.filter(({ id }) => id !== record.id)] }
        : current,
    );
    setDraft(null);
  }

  function onDelete() {
    if (!confirmId || deleting) return;
    setDeleteError(null);
    startDelete(async () => {
      try {
        const result = await deletePrivateRecordAction({ id: confirmId });
        if (!result.ok && result.code === "PRIVATE_LOCKED") return onLocked();
        if (!result.ok && result.code !== "NOT_FOUND") {
          setDeleteError(errorText(result.code));
          return;
        }
        setList((current) =>
          current.status === "ready"
            ? { ...current, records: current.records.filter(({ id }) => id !== confirmId) }
            : current,
        );
      } catch {
        setDeleteError(errorText("INTERNAL"));
      } finally {
        setConfirmId(null);
      }
    });
  }

  return (
    <section aria-labelledby="private-records-title" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="private-records-title" className="text-lg font-semibold">
          {t("privateSpace.records.title")}
        </h2>
        <Button icon={Plus} disabled={list.status !== "ready"} onClick={() => setDraft("new")}>
          {t("privateSpace.records.add")}
        </Button>
      </header>
      {list.status === "loading" && (
        <p role="status" className="text-ink-muted text-sm">
          {t("privateSpace.records.loading")}
        </p>
      )}
      {list.status === "error" && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-negative text-sm">
            {list.message}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setList({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            {t("common.retry")}
          </Button>
        </div>
      )}
      {list.status === "ready" &&
        (list.records.length === 0 ? (
          <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) shadow-(--shadow-card)">
            <EmptyState icon={FileLock2} title={t("privateSpace.records.empty")} />
          </div>
        ) : (
          <ul className="space-y-3">
            {list.records.map((record) => (
              <li
                key={record.id}
                className="min-w-0 space-y-3 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card) sm:p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold wrap-anywhere">{record.title}</h3>
                  <time
                    dateTime={record.updatedAt}
                    className="text-ink-muted shrink-0 text-xs tabular-nums"
                  >
                    {DATE_FORMAT.format(Date.parse(record.updatedAt))}
                  </time>
                </div>
                <RichTextContent body={record.body} isHtml />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setDraft(record)}>
                    {t("privateSpace.records.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    disabled={deleting}
                    onClick={() => setConfirmId(record.id)}
                  >
                    {t("privateSpace.records.delete")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      {deleteError && (
        <p role="alert" className="text-negative text-sm">
          {deleteError}
        </p>
      )}
      <Dialog
        open={draft !== null}
        title={t(draft === "new" ? "privateSpace.records.add" : "privateSpace.records.edit")}
        closeLabel={t("shell.close")}
        onClose={() => setDraft(null)}
        solid
      >
        {draft && (
          <RecordForm
            key={draft === "new" ? "new" : draft.id}
            record={draft === "new" ? null : draft}
            onSaved={onSaved}
            onLocked={onLocked}
          />
        )}
      </Dialog>
      <ConfirmDialog
        open={confirmId !== null}
        title={t("privateSpace.records.deleteTitle")}
        description={t("common.deleteDescription")}
        confirmLabel={t("privateSpace.records.delete")}
        onClose={() => setConfirmId(null)}
        pending={deleting}
        onConfirm={onDelete}
      />
    </section>
  );
}

function RecordForm({
  record,
  onSaved,
  onLocked,
}: {
  readonly record: PrivateRecordDto | null;
  readonly onSaved: (record: PrivateRecordDto) => void;
  readonly onLocked: () => void;
}) {
  const [title, setTitle] = useState(record?.title ?? "");
  const [body, setBody] = useState(record?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startSave] = useTransition();

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!title.trim() || !body.trim()) {
      setError(errorText("VALIDATION_FAILED"));
      return;
    }
    setError(null);
    startSave(async () => {
      try {
        const result = record
          ? await updatePrivateRecordAction({ id: record.id, title, body })
          : await createPrivateRecordAction({ title, body });
        if (result.ok) onSaved(result.data);
        else if (result.code === "PRIVATE_LOCKED") onLocked();
        else setError(errorText(result.code));
      } catch {
        setError(errorText("INTERNAL"));
      }
    });
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <Field id="private-record-title" label={t("privateSpace.records.titleField")}>
        <Input
          id="private-record-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          required
        />
      </Field>
      <RichTextEditor
        label={t("privateSpace.records.bodyField")}
        initialHtml={record?.body}
        onUpdate={setBody}
      />
      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" pending={pending}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
