// features/learning/subject-dialog.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { t } from "@/lib/i18n";
import { errorText, failureCode } from "./errors";
import { useCreateSubject } from "./use-learning";

const SELECT =
  "min-h-11 w-full rounded-lg border border-(--border-control) bg-(--bg-surface) px-4 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

export function SubjectDialog({
  userId,
  open,
  onClose,
  onSaved,
}: {
  readonly userId: string;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSaved: (warning: boolean) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("learning.subject.dialogTitle")}
      closeLabel={t("shell.close")}
    >
      {open && <SubjectForm userId={userId} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function SubjectForm({
  userId,
  onClose,
  onSaved,
}: {
  readonly userId: string;
  readonly onClose: () => void;
  readonly onSaved: (warning: boolean) => void;
}) {
  const create = useCreateSubject(userId);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("STUDY");
  const [status, setStatus] = useState("QUEUED");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = name.trim();
    if (value === "") {
      setError(t("learning.error.invalid"));
      return;
    }
    setError(null);
    create.mutate(
      { name: value, kind, status },
      {
        onSuccess: (result) => {
          onSaved(result.warning);
          onClose();
        },
        onError: (failure) => setError(errorText(failureCode(failure))),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field id="subject-name" label={t("learning.field.name")}>
        <Input
          id="subject-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
          autoFocus
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="subject-kind" label={t("learning.field.kind")}>
          <select
            id="subject-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className={SELECT}
          >
            {["STUDY", "LANGUAGE", "FAITH"].map((option) => (
              <option key={option} value={option}>
                {t(`learning.kind.${option}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="subject-status" label={t("learning.field.status")}>
          <select
            id="subject-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={SELECT}
          >
            <option value="QUEUED">{t("learning.status.QUEUED")}</option>
            <option value="ACTIVE">{t("learning.status.ACTIVE")}</option>
          </select>
        </Field>
      </div>
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
