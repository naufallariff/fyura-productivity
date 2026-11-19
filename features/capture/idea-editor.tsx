// features/capture/idea-editor.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { normalizeTags } from "@/domain/capture/tags";
import { t } from "@/lib/i18n";
import type { Idea } from "./schemas";
import { useUpdateIdea } from "./use-capture";

export function IdeaEditor({
  userId,
  idea,
  onClose,
}: {
  readonly userId: string;
  readonly idea: Idea | null;
  readonly onClose: () => void;
}) {
  return (
    <Dialog
      open={idea !== null}
      onClose={onClose}
      title={t("capture.editTitle")}
      closeLabel={t("shell.close")}
    >
      {idea && <IdeaForm key={idea.id} userId={userId} idea={idea} onClose={onClose} />}
    </Dialog>
  );
}

function IdeaForm({
  userId,
  idea,
  onClose,
}: {
  readonly userId: string;
  readonly idea: Idea;
  readonly onClose: () => void;
}) {
  const update = useUpdateIdea(userId);
  const [title, setTitle] = useState(idea.title);
  const [body, setBody] = useState(idea.body);
  const [tagText, setTagText] = useState(idea.tags.join(", "));
  const [error, setError] = useState<string | null>(null);

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "") {
      setError(t("capture.error.title"));
      return;
    }
    setError(null);
    update.mutate(
      {
        ideaId: idea.id,
        title: value,
        body: body.trim(),
        tags: normalizeTags(tagText.split(/[\s,]+/)),
      },
      {
        onSuccess: onClose,
        onError: () => setError(t("capture.error.generic")),
      },
    );
  };

  const setStatus = (status: "INBOX" | "ACTIVE" | "ARCHIVED") => {
    setError(null);
    update.mutate(
      { ideaId: idea.id, status },
      {
        onSuccess: onClose,
        onError: () => setError(t("capture.error.generic")),
      },
    );
  };

  return (
    <form onSubmit={onSave} className="grid gap-4">
      <Field id="edit-idea-title" label={t("capture.field.title")}>
        <Input
          id="edit-idea-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
        />
      </Field>
      <Field id="edit-idea-tags" label={t("capture.field.tags")} hint={t("capture.field.tagsHint")}>
        <Input
          id="edit-idea-tags"
          value={tagText}
          onChange={(event) => setTagText(event.target.value)}
        />
      </Field>
      <Field id="edit-idea-body" label={t("capture.field.body")}>
        <textarea
          id="edit-idea-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={20000}
          rows={6}
          className="rounded-control border-line text-ink focus-visible:ring-accent min-h-32 w-full border bg-(--glass-solid) px-3.5 py-2.5 text-base outline-none focus-visible:ring-2 sm:text-sm"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        {idea.status !== "ACTIVE" && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setStatus("ACTIVE")}>
            {t("capture.action.activate")}
          </Button>
        )}
        {idea.status !== "ARCHIVED" && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setStatus("ARCHIVED")}>
            {t("capture.action.archive")}
          </Button>
        )}
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
        <Button type="submit" pending={update.isPending}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
