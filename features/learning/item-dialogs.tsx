// features/learning/item-dialogs.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { t } from "@/lib/i18n";
import { errorText, failureCode } from "./errors";
import type { Item } from "./schemas";
import { useCreateItem, useLogProgress, useUpdateItem } from "./use-learning";

const SELECT =
  "min-h-11 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

/* ---------- Create or edit an item ---------- */

export function ItemDialog({
  userId,
  subjectId,
  item,
  open,
  onClose,
}: {
  readonly userId: string;
  readonly subjectId: string;
  readonly item: Item | null;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={item ? t("learning.items.dialogEdit") : t("learning.items.dialogCreate")}
      closeLabel={t("shell.close")}
    >
      {open && (
        <ItemForm
          key={item?.id ?? "new"}
          userId={userId}
          subjectId={subjectId}
          item={item}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function ItemForm({
  userId,
  subjectId,
  item,
  onClose,
}: {
  readonly userId: string;
  readonly subjectId: string;
  readonly item: Item | null;
  readonly onClose: () => void;
}) {
  const create = useCreateItem(userId);
  const update = useUpdateItem(userId);
  const [title, setTitle] = useState(item?.title ?? "");
  type ItemKind = "BOOK" | "COURSE" | "RESEARCH";
  const [kind, setKind] = useState<ItemKind>(item?.kind ?? "BOOK");
  const [sourceUrl, setSourceUrl] = useState(item?.sourceUrl ?? "");
  const [totalUnits, setTotalUnits] = useState(item?.totalUnits?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const busy = create.isPending || update.isPending;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "") {
      setError(t("learning.error.invalid"));
      return;
    }
    const units = totalUnits.trim() === "" ? null : Number(totalUnits);
    if (units !== null && (!Number.isInteger(units) || units < 1)) {
      setError(t("learning.error.invalid"));
      return;
    }
    setError(null);

    const onError = (failure: unknown) => setError(errorText(failureCode(failure)));
    const onSuccess = () => onClose();

    if (item) {
      update.mutate(
        { itemId: item.id, title: value, kind, sourceUrl: sourceUrl.trim(), totalUnits: units },
        { onSuccess, onError },
      );
    } else {
      create.mutate(
        { subjectId, title: value, kind, sourceUrl: sourceUrl.trim(), totalUnits: units },
        { onSuccess, onError },
      );
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field id="item-title" label={t("learning.field.title")}>
        <Input
          id="item-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={160}
          required
          autoFocus
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="item-kind" label={t("learning.field.itemKind")}>
          <select
            id="item-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as ItemKind)}
            className={SELECT}
          >
            {["BOOK", "COURSE", "RESEARCH"].map((option) => (
              <option key={option} value={option}>
                {t(`learning.itemKind.${option}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="item-total" label={t("learning.field.totalUnits")}>
          <Input
            id="item-total"
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            step={1}
            value={totalUnits}
            onChange={(event) => setTotalUnits(event.target.value)}
          />
        </Field>
      </div>
      <Field id="item-source" label={t("learning.field.source")}>
        <Input
          id="item-source"
          type="url"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          maxLength={2000}
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

/* ---------- Log progress for one day ---------- */

export function ProgressDialog({
  userId,
  item,
  today,
  open,
  onClose,
}: {
  readonly userId: string;
  readonly item: Item | null;
  readonly today: string;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("learning.progress.title")}
      closeLabel={t("shell.close")}
    >
      {open && item && (
        <ProgressForm key={item.id} userId={userId} item={item} today={today} onClose={onClose} />
      )}
    </Dialog>
  );
}

function ProgressForm({
  userId,
  item,
  today,
  onClose,
}: {
  readonly userId: string;
  readonly item: Item;
  readonly today: string;
  readonly onClose: () => void;
}) {
  const log = useLogProgress(userId);
  const [logDate, setLogDate] = useState(today);
  const [units, setUnits] = useState("");
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const unitValue = Number(units || "0");
    const minuteValue = Number(minutes || "0");
    if (
      !Number.isInteger(unitValue) ||
      unitValue < 0 ||
      !Number.isInteger(minuteValue) ||
      minuteValue < 0
    ) {
      setError(t("learning.error.invalid"));
      return;
    }
    setError(null);
    log.mutate(
      { itemId: item.id, logDate, units: unitValue, minutes: minuteValue },
      {
        onSuccess: () => onClose(),
        onError: (failure) => {
          const code = failureCode(failure);
          setError(code === "VALIDATION_FAILED" ? t("learning.error.total") : errorText(code));
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <p className="text-ink-muted text-sm">{item.title}</p>
      <Field id="progress-date" label={t("learning.field.date")}>
        <Input
          id="progress-date"
          type="date"
          value={logDate}
          onChange={(event) => setLogDate(event.target.value)}
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="progress-units" label={t("learning.field.dayUnits")}>
          <Input
            id="progress-units"
            type="number"
            inputMode="numeric"
            min={0}
            max={100000}
            step={1}
            value={units}
            onChange={(event) => setUnits(event.target.value)}
          />
        </Field>
        <Field id="progress-minutes" label={t("learning.field.dayMinutes")}>
          <Input
            id="progress-minutes"
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            step={1}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          />
        </Field>
      </div>
      <p className="text-ink-muted text-xs leading-relaxed">{t("learning.progress.replaceHint")}</p>
      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" pending={log.isPending}>
          {t("learning.items.log")}
        </Button>
      </div>
    </form>
  );
}
