// features/learning/reviews-panel.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { errorText, failureCode } from "./errors";
import { useCreateReview, useDueReviews, useSubmitReview } from "./use-learning";

const QUALITIES = [0, 1, 2, 3, 4, 5] as const;

export function ReviewsPanel({ userId }: { readonly userId: string }) {
  const due = useDueReviews(userId);
  const submit = useSubmitReview(userId);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const grade = (cardId: string, quality: number) => {
    setError(null);
    setPendingId(cardId);
    submit.mutate(
      { cardId, quality },
      {
        onSettled: () => setPendingId(null),
        onError: (failure) => setError(errorText(failureCode(failure))),
      },
    );
  };

  if (due.isPending) return <Skeleton className="h-48" />;

  if (due.isError) {
    return (
      <EmptyState
        icon={Layers}
        title={t("learning.reviews.loadError")}
        action={
          <Button variant="secondary" onClick={() => due.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  const cards = due.data ?? [];

  return (
    <section aria-labelledby="reviews-title" className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="reviews-title" className="text-sm font-semibold">
            {t("learning.reviews.title")}
          </h2>
          <p className="text-ink-muted text-xs leading-relaxed">{t("learning.reviews.lead")}</p>
        </div>
        <Button icon={Plus} onClick={() => setCreating(true)}>
          {t("learning.reviews.add")}
        </Button>
      </header>

      {cards.length === 0 && <EmptyState icon={Layers} title={t("learning.reviews.empty")} />}

      <ul className="space-y-3">
        {cards.map((card) => (
          <li key={card.id} className="glass space-y-3 p-4">
            <p className="text-sm leading-relaxed font-semibold">{card.prompt}</p>
            <p className="text-ink-muted text-xs tabular-nums">
              {t("learning.reviews.meta", { count: card.repetitions })}
            </p>
            <fieldset className="space-y-2" disabled={pendingId === card.id}>
              <legend className="text-ink-muted text-xs">{t("learning.quality.label")}</legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {QUALITIES.map((quality) => (
                  <Button
                    key={quality}
                    variant="secondary"
                    size="sm"
                    className="min-h-12 flex-col gap-0.5"
                    onClick={() => grade(card.id, quality)}
                  >
                    <span className="font-semibold tabular-nums">{quality}</span>
                    <span className="text-[11px] leading-tight">
                      {t(`learning.quality.${quality}`)}
                    </span>
                  </Button>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}

      <NewCardDialog userId={userId} open={creating} onClose={() => setCreating(false)} />
    </section>
  );
}

function NewCardDialog({
  userId,
  open,
  onClose,
}: {
  readonly userId: string;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("learning.reviews.dialogTitle")}
      closeLabel={t("shell.close")}
    >
      {open && <NewCardForm userId={userId} onClose={onClose} />}
    </Dialog>
  );
}

function NewCardForm({
  userId,
  onClose,
}: {
  readonly userId: string;
  readonly onClose: () => void;
}) {
  const create = useCreateReview(userId);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = prompt.trim();
    if (value === "") {
      setError(t("learning.error.invalid"));
      return;
    }
    setError(null);
    create.mutate(
      { itemId: null, prompt: value },
      {
        onSuccess: () => onClose(),
        onError: (failure) => setError(errorText(failureCode(failure))),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field id="review-prompt" label={t("learning.field.prompt")}>
        <Input
          id="review-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={500}
          required
          autoFocus
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
        <Button type="submit" pending={create.isPending}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
