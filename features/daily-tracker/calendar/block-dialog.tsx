"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { BLOCK_CATEGORIES, categoryLabelKey } from "@/domain/categories";
import type { Category } from "@/domain/scoring/types";
import { formatMinute, parseClock } from "@/domain/time/clock";
import { t } from "@/lib/i18n";
import { QUICK_CHIPS, type QuickChip } from "../quick-chips";
import {
  useCreateBlock,
  useDeleteBlock,
  useMoveBlock,
  useUpdateBlock,
  type CalendarBlock,
} from "../use-daily-data";

export type BlockDraft =
  | {
      readonly mode: "create";
      readonly logDate: string;
      readonly startMinute: number;
      readonly durationMinutes: number;
    }
  | { readonly mode: "edit"; readonly block: CalendarBlock };

const SELECT =
  "min-h-11 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 sm:text-sm";

function messageFor(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  if (code === "CONFLICT") return t("dailyTracker.block.overlap");
  if (code === "VALIDATION_FAILED") return t("dailyTracker.block.invalid");
  if (code === "NOT_FOUND") return t("dailyTracker.block.notFound");
  return t("dailyTracker.block.failed");
}

export function BlockDialog({
  userId,
  draft,
  onClose,
}: {
  readonly userId: string;
  readonly draft: BlockDraft | null;
  readonly onClose: () => void;
}) {
  return (
    <Dialog
      open={draft !== null}
      onClose={onClose}
      title={
        draft?.mode === "edit"
          ? t("dailyTracker.block.editTitle")
          : t("dailyTracker.block.createTitle")
      }
      description={t("dailyTracker.block.lead")}
      closeLabel={t("shell.close")}
    >
      {draft && <BlockForm userId={userId} draft={draft} onClose={onClose} />}
    </Dialog>
  );
}

function BlockForm({
  userId,
  draft,
  onClose,
}: {
  readonly userId: string;
  readonly draft: BlockDraft;
  readonly onClose: () => void;
}) {
  const block = draft.mode === "edit" ? draft.block : null;
  const locked = block !== null && block.splitGroupId !== null;

  const initial =
    draft.mode === "edit"
      ? {
          logDate: draft.block.logDate,
          startMinute: draft.block.startMinute,
          durationMinutes: draft.block.endMinute - draft.block.startMinute,
          category: draft.block.category as Category,
          activity: draft.block.activity,
        }
      : {
          logDate: draft.logDate,
          startMinute: draft.startMinute,
          durationMinutes: draft.durationMinutes,
          category: "WORK" as Category,
          activity: "",
        };

  const [logDate, setLogDate] = useState(initial.logDate);
  const [start, setStart] = useState(formatMinute(initial.startMinute));
  const [duration, setDuration] = useState(String(initial.durationMinutes));
  const [category, setCategory] = useState<Category>(initial.category);
  const [activity, setActivity] = useState(initial.activity);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const create = useCreateBlock(userId);
  const update = useUpdateBlock(userId);
  const move = useMoveBlock(userId);
  const remove = useDeleteBlock(userId);
  const busy = create.isPending || update.isPending || move.isPending;

  const applyChip = (chip: QuickChip) => {
    setActivity(t(chip.labelKey));
    setDuration(String(chip.minutes));
    setCategory(chip.category);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startMinute = parseClock(start);
    const durationMinutes = Number(duration);
    const text = activity.trim();

    if (
      startMinute === null ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 1440 ||
      text.length === 0 ||
      text.length > 120
    ) {
      setError(t("dailyTracker.block.invalid"));
      return;
    }

    setError(null);
    try {
      if (block) {
        if (text !== block.activity || category !== block.category) {
          await update.mutateAsync({ blockId: block.id, activity: text, category });
        }
        const timingChanged =
          startMinute !== block.startMinute || startMinute + durationMinutes !== block.endMinute;
        if (timingChanged && !locked) {
          await move.mutateAsync({
            blockId: block.id,
            startMinute,
            endMinute: startMinute + durationMinutes,
          });
        }
      } else {
        await create.mutateAsync({
          logDate,
          startMinute,
          durationMinutes,
          category,
          activity: text,
          source: "MANUAL",
        });
      }
      onClose();
    } catch (failure) {
      setError(messageFor(failure));
    }
  };

  const onDelete = () => {
    if (!block) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    remove.mutate(block.id, {
      onSuccess: onClose,
      onError: (failure) => setError(messageFor(failure)),
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {!block && (
        <div className="grid gap-2">
          <p className="text-ink text-sm font-medium">{t("dailyTracker.block.quick")}</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <Button key={chip.id} variant="secondary" size="sm" onClick={() => applyChip(chip)}>
                {t(chip.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {!block && (
        <Field id="block-date" label={t("dailyTracker.block.date")}>
          <Input
            id="block-date"
            type="date"
            value={logDate}
            onChange={(event) => setLogDate(event.target.value)}
            required
          />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="block-start" label={t("dailyTracker.block.start")}>
          <Input
            id="block-start"
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            disabled={locked}
            required
          />
        </Field>
        <Field id="block-duration" label={t("dailyTracker.block.duration")}>
          <Input
            id="block-duration"
            type="number"
            min={1}
            max={1440}
            step={1}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            disabled={locked}
            required
          />
        </Field>
      </div>

      {locked && <p className="text-ink-muted text-sm">{t("dailyTracker.block.splitLocked")}</p>}

      <Field id="block-activity" label={t("dailyTracker.block.activity")}>
        <Input
          id="block-activity"
          type="text"
          value={activity}
          onChange={(event) => setActivity(event.target.value)}
          maxLength={120}
          required
          invalid={error !== null}
        />
      </Field>

      <Field id="block-category" label={t("dailyTracker.block.category")}>
        <select
          id="block-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as Category)}
          className={SELECT}
        >
          {BLOCK_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {t(categoryLabelKey(option))}
            </option>
          ))}
        </select>
      </Field>

      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {block && (
          <Button
            variant="danger"
            onClick={onDelete}
            pending={remove.isPending}
            className="mr-auto"
          >
            {confirming ? t("dailyTracker.block.confirmDelete") : t("dailyTracker.block.delete")}
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" pending={busy}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
