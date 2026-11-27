export const categories = ["Work", "Meetings", "Learning", "Personal", "Health", "Rest"] as const;
export type Category = (typeof categories)[number];
export const modes = ["Normal", "Flexible", "Sick", "Off"] as const;
export type DayMode = (typeof modes)[number];
export const sources = ["Notes", "Journal", "Learning", "Ideas", "Tadabur"] as const;
export type NoteSource = (typeof sources)[number];

export type TimeBlock = {
  id: string;
  date: string;
  title: string;
  category: Category;
  start: number;
  end: number;
  group?: string;
};
export type Note = { id: string; date: string; source: NoteSource; title: string; body: string };
