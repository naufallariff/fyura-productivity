"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { BLOCK_CATEGORIES, categoryLabelKey } from "@/domain/categories";
import type { PlanItem } from "@/domain/plan/types";
import { t } from "@/lib/i18n";
import { useCreateItem, useDeleteItem, useUpdateItem } from "./use-weekly-plan";

const SELECT =
  "min-h-11 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

export function ItemDialog({
  userId,
  open,
  weekday,
  item,
  onClose,
}: {
  userId: string;
  open: boolean;
  weekday: number;
  item: PlanItem | null;
  onClose: () => void;
}) {
  const create = useCreateItem(userId);
  const update = useUpdateItem(userId);
  const remove = useDeleteItem(userId);
  const [error, setError] = useState<string | null>(null);
  const busy = create.isPending || update.isPending || remove.isPending;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const minutes = String(form.get("plannedMinutes") ?? "").trim();

    const draft = {
      title: String(form.get("title") ?? "").trim(),
      category: String(form.get("category")) as PlanItem["category"],
      isRequired: form.get("isRequired") === "on",
      isCore: form.get("isCore") === "on",
      plannedMinutes: minutes === "" ? null : Number(minutes),
    };

    setError(null);
    try {
      if (item) await update.mutateAsync({ itemId: item.id, ...draft });
      else await create.mutateAsync({ weekday, ...draft });
      onClose();
    } catch {
      setError(t("weeklyPlan.saveError"));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={item ? t("weeklyPlan.editTitle") : t("weeklyPlan.addTitle")}
      description={t("weeklyPlan.dialogLead")}
      closeLabel={t("shell.close")}
      footer={
        <>
          {item && (
            <Button
              variant="danger"
              pending={remove.isPending}
              onClick={() =>
                remove.mutate(
                  { itemId: item.id },
                  { onSuccess: onClose, onError: () => setError(t("weeklyPlan.saveError")) },
                )
              }
              className="mr-auto"
            >
              {t("weeklyPlan.delete")}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="plan-item-form" pending={busy}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="plan-item-form" onSubmit={onSubmit} className="grid gap-4">
        <Field id="plan-title" label={t("weeklyPlan.field.title")}>
          <Input
            id="plan-title"
            name="title"
            required
            maxLength={120}
            defaultValue={item?.title ?? ""}
            invalid={error !== null}
          />
        </Field>

        <Field id="plan-category" label={t("weeklyPlan.field.category")}>
          <select
            id="plan-category"
            name="category"
            defaultValue={item?.category ?? BLOCK_CATEGORIES[0]}
            className={SELECT}
          >
            {BLOCK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(categoryLabelKey(category))}
              </option>
            ))}
          </select>
        </Field>

        <Field id="plan-minutes" label={t("weeklyPlan.field.minutes")}>
          <Input
            id="plan-minutes"
            name="plannedMinutes"
            type="number"
            min={1}
            max={1440}
            step={1}
            defaultValue={item?.plannedMinutes ?? ""}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="isRequired"
              defaultChecked={item?.isRequired ?? true}
              className="size-4"
            />
            {t("weeklyPlan.field.required")}
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="isCore"
              defaultChecked={item?.isCore ?? false}
              className="size-4"
            />
            {t("weeklyPlan.field.core")}
          </label>
        </div>

        {error && (
          <p role="alert" className="text-negative text-sm">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
