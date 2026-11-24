// features/projects/board-dialogs.tsx
"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { neighboursAt, type Neighbours } from "@/domain/projects/placement";
import { t } from "@/lib/i18n";
import { CONTROL_CLASS, errorText, failureCode } from "./format";
import { BOARD_HUES, type Board, type BoardHueName, type Label, type List } from "./schemas";
import {
  useCreateBoard,
  useCreateLabel,
  useCreateList,
  useDeleteLabel,
  useDeleteList,
  useUpdateBoard,
  useUpdateLabel,
  useUpdateList,
} from "./use-projects";

function HueSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: BoardHueName;
  onChange: (value: BoardHueName) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as BoardHueName)}
      className={CONTROL_CLASS}
    >
      {BOARD_HUES.map((hue) => (
        <option key={hue} value={hue}>
          {t(`projects.hue.${hue}`)}
        </option>
      ))}
    </select>
  );
}

/* ---------- New board ---------- */

export function NewBoardDialog({
  userId,
  open,
  onClose,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const create = useCreateBoard(userId);
  const [title, setTitle] = useState("");
  const [hue, setHue] = useState<BoardHueName>("indigo");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "") {
      setError(errorText("VALIDATION_FAILED"));
      return;
    }
    setError(null);
    try {
      const board = await create.mutateAsync({ title: value, hue });
      setTitle("");
      onClose();
      router.push(`/projects/${board.id}`);
    } catch (failure) {
      setError(errorText(failureCode(failure)));
    }
  };

  return (
    <Dialog
      solid
      open={open}
      onClose={onClose}
      title={t("projects.board.new")}
      description={t("projects.board.newLead")}
      closeLabel={t("shell.close")}
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field id="board-title" label={t("projects.field.title")}>
          <Input
            id="board-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            required
            invalid={error !== null}
          />
        </Field>
        <Field id="board-hue" label={t("projects.field.hue")}>
          <HueSelect id="board-hue" value={hue} onChange={setHue} />
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
            {t("projects.board.create")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------- Board settings ---------- */

export function BoardSettingsDialog({
  userId,
  open,
  board,
  onClose,
}: {
  userId: string;
  open: boolean;
  board: Board;
  onClose: () => void;
}) {
  return (
    <Dialog
      solid
      open={open}
      onClose={onClose}
      title={t("projects.board.settings")}
      closeLabel={t("shell.close")}
    >
      {open && <BoardSettingsForm userId={userId} board={board} onClose={onClose} />}
    </Dialog>
  );
}

function BoardSettingsForm({
  userId,
  board,
  onClose,
}: {
  userId: string;
  board: Board;
  onClose: () => void;
}) {
  const router = useRouter();
  const update = useUpdateBoard(userId);
  const [title, setTitle] = useState(board.title);
  const [hue, setHue] = useState<BoardHueName>(board.hue);
  const [starred, setStarred] = useState(board.starred);
  const [error, setError] = useState<string | null>(null);

  const fail = (failure: unknown) => setError(errorText(failureCode(failure)));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "") {
      setError(errorText("VALIDATION_FAILED"));
      return;
    }
    update.mutate(
      { boardId: board.id, title: value, hue, starred },
      { onSuccess: onClose, onError: fail },
    );
  };

  const toggleArchive = () => {
    update.mutate(
      { boardId: board.id, archived: !board.archived },
      {
        onSuccess: () => {
          if (!board.archived) router.push("/projects");
          else onClose();
        },
        onError: fail,
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field id="settings-title" label={t("projects.field.title")}>
        <Input
          id="settings-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          required
        />
      </Field>
      <Field id="settings-hue" label={t("projects.field.hue")}>
        <HueSelect id="settings-hue" value={hue} onChange={setHue} />
      </Field>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={starred}
          onChange={(event) => setStarred(event.target.checked)}
        />
        {t("projects.field.starred")}
      </label>
      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="danger" pending={update.isPending} onClick={toggleArchive}>
          {board.archived ? t("projects.board.restore") : t("projects.board.archive")}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" pending={update.isPending}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ---------- List (create and edit) ---------- */

export function ListDialog({
  userId,
  open,
  boardId,
  list,
  onClose,
}: {
  userId: string;
  open: boolean;
  boardId: string;
  list: List | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      solid
      open={open}
      onClose={onClose}
      title={list ? t("projects.list.dialogEdit") : t("projects.list.dialogNew")}
      closeLabel={t("shell.close")}
    >
      {open && (
        <ListForm
          key={list?.id ?? "new"}
          userId={userId}
          boardId={boardId}
          list={list}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

export function ListActionDialog({
  action,
  list,
  lists,
  moveList,
  userId,
  onClose,
}: {
  action: "moveList" | "deleteList";
  list: List;
  lists: readonly List[];
  moveList: (input: { listId: string } & Neighbours) => Promise<unknown>;
  userId: string;
  onClose: () => void;
}) {
  const positionId = useId();
  const currentIndex = lists.findIndex((item) => item.id === list.id);
  const [position, setPosition] = useState(currentIndex);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = useDeleteList(userId, list.boardId);
  const deleting = action === "deleteList";
  const title = t(deleting ? "projects.list.delete" : "projects.list.moveAction");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (working) return;
    const dialog = event.currentTarget.closest("dialog");
    setError(null);
    setWorking(true);
    try {
      if (deleting) {
        await remove.mutateAsync(list.id);
      } else {
        const rest = lists.filter((item) => item.id !== list.id).map((item) => item.id);
        await moveList({ listId: list.id, ...neighboursAt(rest, position) });
      }
      dialog?.close();
    } catch (failure) {
      setError(errorText(failureCode(failure)));
      setWorking(false);
    }
  };

  return (
    <Dialog
      solid
      open
      onClose={onClose}
      title={title}
      description={deleting ? t("projects.list.confirmDelete", { title: list.title }) : undefined}
      closeLabel={t("shell.close")}
    >
      <form onSubmit={submit} className="space-y-4">
        {!deleting && (
          <Field id={positionId} label={t("projects.list.position")}>
            <select
              id={positionId}
              className={CONTROL_CLASS}
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
            >
              {lists.map((item, index) => (
                <option key={item.id} value={index}>
                  {index + 1}
                </option>
              ))}
            </select>
          </Field>
        )}
        {error && (
          <p role="alert" className="text-negative text-sm">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={(event) => event.currentTarget.closest("dialog")?.close()}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant={deleting ? "danger" : "primary"}
            disabled={
              !deleting &&
              (position === currentIndex || position >= lists.length || currentIndex < 0)
            }
            pending={working}
          >
            {title}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function ListForm({
  userId,
  boardId,
  list,
  onClose,
}: {
  userId: string;
  boardId: string;
  list: List | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(list?.title ?? "");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateList(userId);
  const update = useUpdateList(userId, boardId);
  const busy = create.isPending || update.isPending;

  const fail = (failure: unknown) => setError(errorText(failureCode(failure)));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "") {
      setError(errorText("VALIDATION_FAILED"));
      return;
    }
    if (list)
      update.mutate({ listId: list.id, title: value }, { onSuccess: onClose, onError: fail });
    else create.mutate({ boardId, title: value }, { onSuccess: onClose, onError: fail });
  };

  const archive = () => {
    if (!list) return;
    update.mutate({ listId: list.id, archived: true }, { onSuccess: onClose, onError: fail });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field id="list-title" label={t("projects.field.title")}>
        <Input
          id="list-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          required
          invalid={error !== null}
        />
      </Field>
      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {list ? (
          <Button type="button" variant="danger" pending={update.isPending} onClick={archive}>
            {t("projects.list.archive")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" pending={busy}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ---------- Labels ---------- */

export function LabelsDialog({
  userId,
  open,
  boardId,
  labels,
  onClose,
}: {
  userId: string;
  open: boolean;
  boardId: string;
  labels: readonly Label[];
  onClose: () => void;
}) {
  return (
    <Dialog
      solid
      open={open}
      onClose={onClose}
      title={t("projects.labels.title")}
      description={t("projects.labels.lead")}
      closeLabel={t("shell.close")}
    >
      {open && <LabelsManager userId={userId} boardId={boardId} labels={labels} />}
    </Dialog>
  );
}

function LabelsManager({
  userId,
  boardId,
  labels,
}: {
  userId: string;
  boardId: string;
  labels: readonly Label[];
}) {
  const create = useCreateLabel(userId);
  const [name, setName] = useState("");
  const [hue, setHue] = useState<BoardHueName>("indigo");
  const [error, setError] = useState<string | null>(null);

  const onCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = name.trim();
    if (value === "") return;
    setError(null);
    create.mutate(
      { boardId, name: value, hue },
      {
        onSuccess: () => setName(""),
        onError: (failure) => setError(errorText(failureCode(failure))),
      },
    );
  };

  return (
    <div className="space-y-6">
      {labels.length === 0 && (
        <p className="text-ink-muted text-sm">{t("projects.labels.empty")}</p>
      )}

      <ul className="space-y-4">
        {labels.map((label) => (
          <LabelRow key={label.id} userId={userId} boardId={boardId} label={label} />
        ))}
      </ul>

      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field id="label-new-name" label={t("projects.field.name")}>
          <Input
            id="label-new-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            required
          />
        </Field>
        <Field id="label-new-hue" label={t("projects.field.hue")}>
          <HueSelect id="label-new-hue" value={hue} onChange={setHue} />
        </Field>
        <Button type="submit" pending={create.isPending}>
          {t("projects.labels.create")}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

function LabelRow({ userId, boardId, label }: { userId: string; boardId: string; label: Label }) {
  const update = useUpdateLabel(userId, boardId);
  const remove = useDeleteLabel(userId, boardId);
  const [name, setName] = useState(label.name);
  const [hue, setHue] = useState<BoardHueName>(label.hue);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const value = name.trim();
    if (value === "") {
      setError(errorText("VALIDATION_FAILED"));
      return;
    }
    setError(null);
    update.mutate(
      { labelId: label.id, name: value, hue },
      { onError: (failure) => setError(errorText(failureCode(failure))) },
    );
  };

  const drop = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    remove.mutate(
      { labelId: label.id },
      { onError: (failure) => setError(errorText(failureCode(failure))) },
    );
  };

  return (
    <li className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
      <Field id={`label-name-${label.id}`} label={t("projects.field.name")}>
        <Input
          id={`label-name-${label.id}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
        />
      </Field>
      <Field id={`label-hue-${label.id}`} label={t("projects.field.hue")}>
        <HueSelect id={`label-hue-${label.id}`} value={hue} onChange={setHue} />
      </Field>
      <Button type="button" variant="secondary" pending={update.isPending} onClick={save}>
        {t("common.save")}
      </Button>
      <Button type="button" variant="danger" pending={remove.isPending} onClick={drop}>
        {confirming ? t("projects.labels.confirm") : t("projects.labels.delete")}
      </Button>
      {error && (
        <p role="alert" className="text-negative text-xs sm:col-span-4">
          {error}
        </p>
      )}
    </li>
  );
}
