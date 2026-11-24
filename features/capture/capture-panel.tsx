// features/capture/capture-panel.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Lightbulb, Plus } from "lucide-react";
import { useDebouncedValue } from "@/client/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeTags } from "@/domain/capture/tags";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { IdeaEditor } from "./idea-editor";
import type { Idea, IdeaStatus } from "./schemas";
import { useCreateIdea, useIdeas, useTagCloud, type IdeaFilters } from "./use-capture";

const STATUS_OPTIONS: SegmentedOption<"ALL" | IdeaStatus>[] = [
  { value: "ALL", label: t("capture.status.all") },
  { value: "INBOX", label: t("capture.status.inbox") },
  { value: "ACTIVE", label: t("capture.status.active") },
];

export function CapturePanel({ userId }: { readonly userId: string }) {
  const [status, setStatus] = useState<"ALL" | IdeaStatus>("ALL");
  const [tag, setTag] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const q = useDebouncedValue(searchText.trim(), 300);

  const filters: IdeaFilters = {
    status: status === "ALL" ? undefined : status,
    tag: tag || undefined,
    q: q || undefined,
  };

  const ideas = useIdeas(userId, filters);
  const cloud = useTagCloud(userId);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);

  const items = ideas.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section aria-labelledby="capture-title" className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="capture-title" className="text-sm font-semibold">
            {t("capture.listTitle")}
          </h2>
          <p className="text-ink-muted text-xs leading-relaxed">{t("capture.lead")}</p>
        </div>
        <Button icon={Plus} onClick={() => setCreating(true)}>
          {t("capture.add")}
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field id="capture-search" label={t("capture.search")}>
          <Input
            id="capture-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            maxLength={80}
          />
        </Field>
        <Segmented
          label={t("capture.status.label")}
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
      </div>

      {cloud.data && cloud.data.length > 0 && (
        <nav aria-label={t("capture.tags.label")}>
          <ul className="flex snap-x snap-mandatory scrollbar-none flex-nowrap gap-2 overflow-x-auto p-1 sm:flex-wrap sm:overflow-visible">
            {cloud.data.map((entry) => (
              <li key={entry.tag} className="shrink-0 snap-start">
                <button
                  type="button"
                  aria-pressed={tag === entry.tag}
                  onClick={() => setTag(tag === entry.tag ? "" : entry.tag)}
                  className={cn(
                    "focus-visible:ring-accent inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium focus-visible:ring-2",
                    tag === entry.tag
                      ? "border-accent bg-accent-soft"
                      : "border-line text-ink-muted",
                  )}
                >
                  #{entry.tag}
                  <span className="tabular-nums opacity-70">{entry.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {ideas.isPending && <Skeleton className="h-40" />}

      {ideas.isError && (
        <EmptyState
          icon={Lightbulb}
          title={t("capture.loadError")}
          action={
            <Button variant="secondary" onClick={() => ideas.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      )}

      {ideas.isSuccess && items.length === 0 && (
        <EmptyState icon={Lightbulb} title={t("capture.empty")} body={t("capture.emptyBody")} />
      )}

      <ul className="space-y-3">
        {items.map((idea) => (
          <li key={idea.id}>
            <button
              type="button"
              onClick={() => setEditing(idea)}
              className="focus-visible:ring-accent block w-full space-y-2 rounded-xl border border-(--border-subtle) bg-(--bg-surface) p-4 text-left shadow-(--shadow-card) focus-visible:ring-2"
            >
              <span className="flex flex-wrap items-center gap-2">
                <Pill>{t(`capture.status.${idea.status.toLowerCase()}`)}</Pill>
                <span className="text-sm font-semibold">{idea.title}</span>
              </span>
              {idea.body !== "" && (
                <span className="text-ink-muted line-clamp-2 block text-sm leading-relaxed">
                  {idea.body}
                </span>
              )}
              {idea.tags.length > 0 && (
                <span className="flex flex-wrap gap-2">
                  {idea.tags.map((value) => (
                    <Pill key={value}>#{value}</Pill>
                  ))}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {ideas.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            pending={ideas.isFetchingNextPage}
            onClick={() => ideas.fetchNextPage()}
          >
            {t("capture.loadMore")}
          </Button>
        </div>
      )}

      <NewIdeaDialog userId={userId} open={creating} onClose={() => setCreating(false)} />
      <IdeaEditor userId={userId} idea={editing} onClose={() => setEditing(null)} />
    </section>
  );
}

function NewIdeaDialog({
  userId,
  open,
  onClose,
}: {
  readonly userId: string;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const create = useCreateIdea(userId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagText, setTagText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "") {
      setError(t("capture.error.title"));
      return;
    }
    setError(null);
    create.mutate(
      { title: value, body: body.trim(), tags: normalizeTags(tagText.split(/[\s,]+/)) },
      {
        onSuccess: () => {
          setTitle("");
          setBody("");
          setTagText("");
          onClose();
        },
        onError: () => setError(t("capture.error.generic")),
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title={t("capture.add")} closeLabel={t("shell.close")}>
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field id="new-idea-title" label={t("capture.field.title")}>
          <Input
            id="new-idea-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
            autoFocus
          />
        </Field>
        <Field
          id="new-idea-tags"
          label={t("capture.field.tags")}
          hint={t("capture.field.tagsHint")}
        >
          <Input
            id="new-idea-tags"
            value={tagText}
            onChange={(event) => setTagText(event.target.value)}
          />
        </Field>
        <Field id="new-idea-body" label={t("capture.field.body")}>
          <textarea
            id="new-idea-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={20000}
            rows={4}
            className="text-ink focus-visible:ring-accent min-h-24 w-full rounded-lg border border-(--border-control) bg-(--bg-surface) px-4 py-2 text-base outline-none focus-visible:ring-2 sm:text-sm"
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
    </Dialog>
  );
}
