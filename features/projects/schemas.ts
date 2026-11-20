// features/projects/schemas.ts
// Client-side mirror of the DTOs returned by /api/v1/projects. Keep in sync with services/projects.ts.
import { z } from "zod";

export const BOARD_HUES = [
  "sky",
  "violet",
  "amber",
  "rose",
  "emerald",
  "teal",
  "orange",
  "indigo",
] as const;
export type BoardHueName = (typeof BOARD_HUES)[number];

const BoardHue = z.enum(BOARD_HUES);
const DueState = z.enum(["none", "complete", "overdue", "today", "upcoming"]);

export const BoardSchema = z.object({
  id: z.string(),
  title: z.string(),
  hue: BoardHue,
  starred: z.boolean(),
  archived: z.boolean(),
  updatedAt: z.string(),
});

export const BoardsPageSchema = z.object({
  items: z.array(BoardSchema),
  nextCursor: z.string().nullable(),
});

export const ListSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  title: z.string(),
  position: z.number(),
  archived: z.boolean(),
});

export const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  hue: BoardHue,
});

export const CardSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  listId: z.string(),
  title: z.string(),
  position: z.number(),
  dueOn: z.string().nullable(),
  dueComplete: z.boolean(),
  dueState: DueState,
  archived: z.boolean(),
  labelIds: z.array(z.string()),
  checklist: z.object({ done: z.number(), total: z.number() }),
});

export const CardsPageSchema = z.object({
  items: z.array(CardSchema),
  nextCursor: z.string().nullable(),
});

export const ChecklistItemSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  title: z.string(),
  done: z.boolean(),
  position: z.number(),
});

export const CardDetailSchema = CardSchema.extend({
  description: z.string().nullable(),
  items: z.array(ChecklistItemSchema),
});

export const BoardSnapshotSchema = z.object({
  board: BoardSchema,
  lists: z.array(ListSchema),
  labels: z.array(LabelSchema),
});

export type Board = z.infer<typeof BoardSchema>;
export type List = z.infer<typeof ListSchema>;
export type Label = z.infer<typeof LabelSchema>;
export type Card = z.infer<typeof CardSchema>;
export type CardsPage = z.infer<typeof CardsPageSchema>;
export type CardDetail = z.infer<typeof CardDetailSchema>;
export type BoardSnapshot = z.infer<typeof BoardSnapshotSchema>;
