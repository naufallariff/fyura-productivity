"use client";

import { useState } from "react";
import { ArrowDownToLine, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { BlockEditor, NoteEditor } from "@/components/daily/daily-editors";
import { AllocationPanel, DailyMetrics } from "@/components/daily/daily-summary";
import { FocusPanel } from "@/components/daily/focus-panel";
import { MonthWidget } from "@/components/daily/month-widget";
import { TimeTrack } from "@/components/daily/time-track";
import { IconButton, Panel } from "@/components/ui/workspace-controls";
import { previewDate, routine, sampleBlocks, sampleNotes } from "@/data/daily-fixture";
import { addDays } from "@/domain/time/logical-date";
import { splitBlock } from "@/domain/time/split-block";
import { useFocusTimer } from "@/hooks/use-focus-timer";
import {
  categories,
  modes,
  sources,
  type Category,
  type DayMode,
  type Note,
  type NoteSource,
  type TimeBlock,
} from "@/models/daily";
import { clock, formatDate } from "@/utils/daily";

type DraftBlock = Omit<TimeBlock, "id"> & { id?: string };

function csv(value: string) {
  const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function DailyView() {
  const [date, setDate] = useState(previewDate);
  const [blocks, setBlocks] = useState(sampleBlocks);
  const [notes, setNotes] = useState(sampleNotes);
  const [checks, setChecks] = useState<Record<string, string[]>>({
    [previewDate]: routine.slice(0, 4).map(({ title }) => title),
  });
  const [dayModes, setDayModes] = useState<Record<string, DayMode>>({});
  const [filter, setFilter] = useState<Category | "">("");
  const [noteFilter, setNoteFilter] = useState<NoteSource | "">("");
  const [historySearch, setHistorySearch] = useState("");
  const [allHistory, setAllHistory] = useState(false);
  const [blockEditor, setBlockEditor] = useState<DraftBlock | null>(null);
  const [notepad, setNotepad] = useState<{ note?: Note } | null>(null);
  const timer = useFocusTimer();
  const mode = dayModes[date] ?? "Normal";
  const dailyBlocks = blocks.filter((block) => block.date === date);
  const dailyChecks = checks[date] ?? [];
  const required = routine.filter(
    (item) => item.required && (mode === "Normal" || (mode !== "Sick" && item.core)),
  );
  const done = required.filter((item) => dailyChecks.includes(item.title)).length;
  const history = blocks
    .filter(
      (block) =>
        (allHistory || block.date === date) &&
        (!filter || block.category === filter) &&
        `${block.title} ${block.category}`
          .toLowerCase()
          .includes(historySearch.trim().toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start);

  function create(start = 540, end = 570) {
    setBlockEditor({ title: "", date, category: filter || "Work", start, end });
  }

  function edit(block: TimeBlock) {
    const pair = block.group
      ? blocks
          .filter((item) => item.group === block.group)
          .sort((a, b) => a.date.localeCompare(b.date))
      : [];
    setBlockEditor(
      pair.length === 2 && pair[0] && pair[1] ? { ...pair[0], end: pair[1].end } : block,
    );
  }

  function keepBlock(item: TimeBlock, draft: DraftBlock) {
    return item.id !== draft.id && (!draft.group || item.group !== draft.group);
  }

  function save(draft: DraftBlock) {
    const length =
      draft.end > draft.start ? draft.end - draft.start : 1440 + draft.end - draft.start;
    const segments = splitBlock(draft.date, draft.start, length);
    const group = segments.length > 1 ? crypto.randomUUID() : undefined;
    const records = segments.map((segment) => ({
      id: crypto.randomUUID(),
      group,
      date: segment.logDate,
      title: draft.title,
      category: draft.category,
      start: segment.startMinute,
      end: segment.endMinute,
    }));
    setBlocks((previous) => [...previous.filter((item) => keepBlock(item, draft)), ...records]);
    setDate(draft.date);
    setBlockEditor(null);
  }

  function exportHistory() {
    const rows = history.map((block) =>
      [block.date, clock(block.start), clock(block.end), block.category, block.title]
        .map(csv)
        .join(","),
    );
    const url = URL.createObjectURL(
      new Blob([["Date,Start,End,Category,Activity", ...rows].join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fyura-time-history.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="daily-view">
      <header className="daily-title">
        <div>
          <p>
            {formatDate(date, { weekday: "long", day: "numeric", month: "long" })}{" "}
            <span>· Demo data</span>
          </p>
          <h1>Daily tracker</h1>
        </div>
        <button className="primary" onClick={() => create()}>
          <Plus size={19} /> Log time
        </button>
      </header>
      <DailyMetrics
        blocks={dailyBlocks}
        done={done}
        required={required.length}
        focus={date === previewDate ? timer.completedMinutes : 0}
        mode={mode}
      />
      <div className="daily-grid">
        <div className="daily-left">
          <MonthWidget />
          <Panel
            title="Daily checklist"
            action={
              <small>
                {dailyChecks.length}/{routine.length}
              </small>
            }
          >
            <div className="checklist">
              {routine.map((item) => (
                <label key={item.title}>
                  <input
                    type="checkbox"
                    checked={dailyChecks.includes(item.title)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setChecks((previous) => ({
                        ...previous,
                        [date]: checked
                          ? [...(previous[date] ?? []), item.title]
                          : (previous[date] ?? []).filter((title) => title !== item.title),
                      }));
                    }}
                  />
                  <span>
                    {item.title}
                    <small>{item.core ? "Core" : item.required ? "Required" : "Optional"}</small>
                  </span>
                </label>
              ))}
            </div>
          </Panel>
        </div>
        <Panel
          title="Time blocking"
          className="timeline-panel"
          action={
            <IconButton label="Add time block" onClick={() => create()}>
              <Plus size={20} />
            </IconButton>
          }
        >
          <div className="track-toolbar">
            <div className="actions">
              <IconButton label="Previous day" onClick={() => setDate(addDays(date, -1))}>
                <ChevronLeft size={17} />
              </IconButton>
              <input
                type="date"
                aria-label="Timeline date"
                value={date}
                onChange={(event) => {
                  if (event.target.value) setDate(event.target.value);
                }}
              />
              <IconButton label="Next day" onClick={() => setDate(addDays(date, 1))}>
                <ChevronRight size={17} />
              </IconButton>
            </div>
            <select
              aria-label="Filter category"
              value={filter}
              onChange={(event) => setFilter(event.target.value as Category | "")}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="segmented" aria-label="Day mode">
            {modes.map((item) => (
              <button
                key={item}
                aria-pressed={mode === item}
                onClick={() => setDayModes((previous) => ({ ...previous, [date]: item }))}
              >
                {item}
              </button>
            ))}
          </div>
          <TimeTrack blocks={dailyBlocks} filter={filter} onCreate={create} onEdit={edit} />
        </Panel>
        <div className="daily-right">
          <FocusPanel timer={timer} />
          <AllocationPanel blocks={dailyBlocks} />
        </div>
        <Panel
          title="Time history"
          className="history-panel"
          action={
            <IconButton
              label="Export time history"
              disabled={!history.length}
              onClick={exportHistory}
            >
              <ArrowDownToLine size={18} />
            </IconButton>
          }
        >
          <div className="track-toolbar">
            <input
              aria-label="Search time history"
              placeholder="Search activities"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
            />
            <label className="inline-check">
              <input
                type="checkbox"
                checked={allHistory}
                onChange={(event) => setAllHistory(event.target.checked)}
              />{" "}
              All dates
            </label>
          </div>
          {history.length ? (
            <div className="history-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Category</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((block) => (
                    <tr key={block.id}>
                      <td>
                        <button className="text-button" onClick={() => edit(block)}>
                          {block.title}
                        </button>
                        {allHistory && <small>{block.date}</small>}
                      </td>
                      <td>{block.category}</td>
                      <td>
                        {clock(block.start)}–{clock(block.end)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No matching time blocks.</p>
          )}
        </Panel>
        <Panel
          title="Notes for today"
          className="notes-panel"
          action={
            <IconButton label="New note" onClick={() => setNotepad({})}>
              <Plus size={19} />
            </IconButton>
          }
        >
          <select
            aria-label="Filter note source"
            value={noteFilter}
            onChange={(event) => setNoteFilter(event.target.value as NoteSource | "")}
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
          <div className="notes-list">
            {notes
              .filter(
                (note) => note.date === previewDate && (!noteFilter || note.source === noteFilter),
              )
              .map((note) => (
                <button key={note.id} onClick={() => setNotepad({ note })}>
                  <small>{note.source}</small>
                  <strong>{note.title}</strong>
                  <span>{note.body}</span>
                </button>
              ))}
          </div>
          <button className="text-button" onClick={() => setNotepad({})}>
            Open notepad
          </button>
        </Panel>
      </div>
      {blockEditor && (
        <BlockEditor
          block={blockEditor}
          onClose={() => setBlockEditor(null)}
          onSave={save}
          onDelete={() => {
            setBlocks((previous) => previous.filter((item) => keepBlock(item, blockEditor)));
            setBlockEditor(null);
          }}
        />
      )}
      {notepad && (
        <NoteEditor
          notes={notes}
          initial={notepad.note}
          date={previewDate}
          onClose={() => setNotepad(null)}
          onSave={(note) => {
            setNotes((previous) => [note, ...previous.filter((item) => item.id !== note.id)]);
            setNotepad(null);
          }}
          onDelete={(id) => {
            setNotes((previous) => previous.filter((item) => item.id !== id));
            setNotepad(null);
          }}
        />
      )}
    </div>
  );
}
