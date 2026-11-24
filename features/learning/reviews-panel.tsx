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
import {
  useCreateReview,
  useDueReviews,
  useItems,
  useSubjects,
  useSubmitReview,
} from "./use-learning";

const QUALITIES = [0, 1, 2, 3, 4, 5] as const;
const SELECT =
  "min-h-11 w-full rounded-lg border border-(--border-control) bg-(--bg-surface) px-4 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

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
    <section aria-labelledby="reviews-title" className="space-y-4">
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
          <li
            key={card.id}
            className="space-y-3 rounded-xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)"
          >
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
                    className="min-h-12 flex-col gap-1"
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
  const subjects = useSubjects(userId);
  const [prompt, setPrompt] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [itemId, setItemId] = useState("");
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
      { itemId: itemId || null, prompt: value },
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
      <Field id="review-subject" label={t("learning.reviews.subject")}>
        <select
          id="review-subject"
          className={SELECT}
          value={subjectId}
          onChange={(event) => {
            setSubjectId(event.target.value);
            setItemId("");
          }}
        >
          <option value="">{t("learning.reviews.standalone")}</option>
          {subjects.data?.items
            .filter((subject) => subject.status !== "ARCHIVED")
            .map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
        </select>
      </Field>
      {subjects.isError && (
        <Button type="button" variant="secondary" onClick={() => subjects.refetch()}>
          {t("common.retry")}
        </Button>
      )}
      {subjectId && (
        <ReviewMaterialSelect
          userId={userId}
          subjectId={subjectId}
          itemId={itemId}
          onChange={setItemId}
        />
      )}
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

function ReviewMaterialSelect({
  userId,
  subjectId,
  itemId,
  onChange,
}: {
  readonly userId: string;
  readonly subjectId: string;
  readonly itemId: string;
  readonly onChange: (id: string) => void;
}) {
  const items = useItems(userId, { subjectId });
  const materials = items.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="grid gap-2">
      <Field id="review-material" label={t("learning.reviews.material")}>
        <select
          id="review-material"
          className={SELECT}
          aria-busy={items.isPending}
          value={itemId}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{t("learning.reviews.standalone")}</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.title}
            </option>
          ))}
        </select>
      </Field>
      {items.isSuccess && materials.length === 0 && (
        <p className="text-ink-muted text-xs">{t("learning.items.empty")}</p>
      )}
      {items.isError && !items.hasNextPage && (
        <Button type="button" variant="secondary" onClick={() => items.refetch()}>
          {t("common.retry")}
        </Button>
      )}
      {items.hasNextPage && (
        <Button
          type="button"
          variant="secondary"
          pending={items.isFetchingNextPage}
          onClick={() => items.fetchNextPage()}
        >
          {t(items.isFetchNextPageError ? "common.retry" : "learning.items.loadMore")}
        </Button>
      )}
    </div>
  );
}
