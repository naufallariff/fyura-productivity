import { useState } from "react";
import { Modal } from "@/components/ui/workspace-controls";
import {
  categories,
  sources,
  type Category,
  type Note,
  type NoteSource,
  type TimeBlock,
} from "@/models/daily";
import { clock, parseClock } from "@/utils/daily";

export function BlockEditor({
  block,
  onClose,
  onSave,
  onDelete,
}: {
  block: Omit<TimeBlock, "id"> & { id?: string };
  onClose: () => void;
  onSave: (block: Omit<TimeBlock, "id"> & { id?: string }) => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal title={block.id ? "Edit time block" : "Log time"} onClose={onClose}>
      <form
        className="editor"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const title = String(data.get("title")).trim();
          if (!title) return;
          const start = parseClock(String(data.get("start")));
          const end = data.get("midnight") ? 1440 : parseClock(String(data.get("end")));
          onSave({
            ...block,
            title,
            date: String(data.get("date")),
            category: data.get("category") as Category,
            start,
            end,
          });
        }}
      >
        <label>
          Activity
          <input
            name="title"
            autoFocus
            required
            maxLength={120}
            defaultValue={block.title}
            pattern=".*\S.*"
          />
        </label>
        <label>
          Date
          <input name="date" type="date" required defaultValue={block.date} />
        </label>
        <div className="form-pair">
          <label>
            Start
            <input name="start" type="time" required defaultValue={clock(block.start)} />
          </label>
          <label>
            End
            <input name="end" type="time" required defaultValue={clock(block.end % 1440)} />
          </label>
        </div>
        <label className="inline-check">
          <input name="midnight" type="checkbox" defaultChecked={block.end === 1440} /> End at
          midnight
        </label>
        <small>Earlier end times continue into the next day.</small>
        <label>
          Category
          <select name="category" defaultValue={block.category}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <div className="editor-actions">
          {block.id && (
            <button
              className="danger"
              type="button"
              onClick={() => (confirm ? onDelete() : setConfirm(true))}
            >
              {confirm ? "Confirm delete" : "Delete"}
            </button>
          )}
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save block
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function NoteEditor({
  notes,
  initial,
  date,
  onClose,
  onSave,
  onDelete,
}: {
  notes: Note[];
  initial?: Note;
  date: string;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
}) {
  const [selected, setSelected] = useState(initial?.id ?? "");
  const [confirm, setConfirm] = useState(false);
  const note = notes.find((item) => item.id === selected);
  return (
    <Modal title="Notepad" onClose={onClose}>
      <form
        key={selected}
        className="editor"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const title = String(data.get("title")).trim();
          if (!title) return;
          onSave({
            id: note?.id ?? crypto.randomUUID(),
            date: note?.date ?? date,
            source: data.get("source") as NoteSource,
            title,
            body: String(data.get("body")).trim(),
          });
        }}
      >
        <label>
          Open note
          <select
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value);
              setConfirm(false);
            }}
          >
            <option value="">New note</option>
            {notes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select name="source" defaultValue={note?.source ?? "Notes"}>
            {sources.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={note?.title}
            pattern=".*\S.*"
          />
        </label>
        <label>
          Note
          <textarea name="body" rows={8} maxLength={5000} defaultValue={note?.body} />
        </label>
        <div className="editor-actions">
          {note && (
            <button
              className="danger"
              type="button"
              onClick={() => (confirm ? onDelete(note.id) : setConfirm(true))}
            >
              {confirm ? "Confirm delete" : "Delete"}
            </button>
          )}
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save note
          </button>
        </div>
      </form>
    </Modal>
  );
}
