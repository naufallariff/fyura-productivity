import type { Note, TimeBlock } from "@/models/daily";

export const previewDate = "2026-11-27";

export const sampleBlocks: TimeBlock[] = [
  {
    id: "morning",
    date: previewDate,
    title: "Morning reading",
    category: "Learning",
    start: 435,
    end: 480,
  },
  {
    id: "design",
    date: previewDate,
    title: "Design the Daily workspace",
    category: "Work",
    start: 500,
    end: 620,
  },
  {
    id: "review",
    date: previewDate,
    title: "Project review",
    category: "Meetings",
    start: 555,
    end: 600,
  },
  {
    id: "prototype",
    date: previewDate,
    title: "Prototype interactions",
    category: "Work",
    start: 650,
    end: 735,
  },
  {
    id: "walk",
    date: previewDate,
    title: "Lunch and walk",
    category: "Personal",
    start: 750,
    end: 825,
  },
  {
    id: "study",
    date: previewDate,
    title: "Interface research",
    category: "Learning",
    start: 850,
    end: 910,
  },
];

export const routine = [
  { title: "Read for 30 minutes", required: true, core: true },
  { title: "Review daily priorities", required: true, core: true },
  { title: "Write a morning note", required: true, core: false },
  { title: "Move for 20 minutes", required: true, core: false },
  { title: "Clear the inbox", required: true, core: false },
  { title: "Close the day", required: true, core: false },
  { title: "Capture one idea", required: false, core: false },
];

export const sampleNotes: Note[] = [
  {
    id: "n1",
    date: previewDate,
    source: "Notes",
    title: "Daily layout",
    body: "Keep the timeline at the center. Give each utility its own rhythm.",
  },
  {
    id: "n2",
    date: previewDate,
    source: "Ideas",
    title: "A lighter morning",
    body: "Leave the first half hour free for reading.",
  },
];
