// features/journal/tadabur/entry-dialog.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { t } from "@/lib/i18n";
import { failureCode, tadaburErrorText } from "./errors";
import type { TadaburItem } from "./schemas";
import { useCreateTadabur, useUpdateTadabur, type TadaburDraft } from "./use-tadabur";

const TEXTAREA =
  "min-h-28 w-full rounded-lg border border-(--border-control) bg-(--bg-surface) px-4 py-2 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

/** Client-side check. The server repeats it, so a passing check is never the only protection. */
function checkDraft(draft: TadaburDraft): string | null {
  const valid =
    Number.isInteger(draft.surah) &&
    draft.surah >= 1 &&
    draft.surah <= 114 &&
    Number.isInteger(draft.ayatFrom) &&
    draft.ayatFrom >= 1 &&
    Number.isInteger(draft.ayatTo) &&
    draft.reflection.length > 0;
  if (!valid) return t("tadabur.error.invalid");
  if (draft.ayatTo < draft.ayatFrom) return t("tadabur.error.range");
  return null;
}

export function EntryDialog({
  userId,
  open,
  entry,
  defaultDate,
  onClose,
}: {
  readonly userId: string;
  readonly open: boolean;
  readonly entry: TadaburItem | null;
  readonly defaultDate: string;
  readonly onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={entry ? t("tadabur.dialog.editTitle") : t("tadabur.dialog.createTitle")}
      closeLabel={t("shell.close")}
    >
      {open && (
        <EntryForm
          key={entry?.id ?? "new"}
          userId={userId}
          entry={entry}
          defaultDate={defaultDate}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function EntryForm({
  userId,
  entry,
  defaultDate,
  onClose,
}: {
  readonly userId: string;
  readonly entry: TadaburItem | null;
  readonly defaultDate: string;
  readonly onClose: () => void;
}) {
  const [logDate, setLogDate] = useState(entry?.logDate ?? defaultDate);
  const [surah, setSurah] = useState(entry ? String(entry.surah) : "");
  const [from, setFrom] = useState(entry ? String(entry.ayatFrom) : "");
  const [to, setTo] = useState(entry ? String(entry.ayatTo) : "");
  const [reflection, setReflection] = useState(entry?.reflection ?? "");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateTadabur(userId);
  const update = useUpdateTadabur(userId);
  const busy = create.isPending || update.isPending;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft: TadaburDraft = {
      logDate,
      surah: Number(surah),
      ayatFrom: Number(from),
      ayatTo: Number(to),
      reflection: reflection.trim(),
    };

    const message = checkDraft(draft);
    if (message) {
      setError(message);
      return;
    }
    setError(null);

    const onError = (failure: unknown) => setError(tadaburErrorText(failureCode(failure)));
    if (entry) update.mutate({ entryId: entry.id, ...draft }, { onSuccess: onClose, onError });
    else create.mutate(draft, { onSuccess: onClose, onError });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field id="tadabur-date" label={t("tadabur.field.date")}>
        <Input
          id="tadabur-date"
          type="date"
          value={logDate}
          onChange={(event) => setLogDate(event.target.value)}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="tadabur-surah-input" label={t("tadabur.field.surah")}>
          <Input
            id="tadabur-surah-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={114}
            step={1}
            value={surah}
            onChange={(event) => setSurah(event.target.value)}
            required
          />
        </Field>
        <Field id="tadabur-from-input" label={t("tadabur.field.from")}>
          <Input
            id="tadabur-from-input"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            required
          />
        </Field>
        <Field id="tadabur-to-input" label={t("tadabur.field.to")}>
          <Input
            id="tadabur-to-input"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={to}
            onChange={(event) => setTo(event.target.value)}
            required
          />
        </Field>
      </div>

      <Field id="tadabur-reflection" label={t("tadabur.field.reflection")}>
        <textarea
          id="tadabur-reflection"
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          maxLength={10000}
          required
          className={TEXTAREA}
        />
      </Field>

      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" pending={busy}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
