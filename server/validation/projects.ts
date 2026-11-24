// server/validation/projects.ts
import { z } from "zod";
import { isValidIsoDate } from "@/domain/time/local-date";

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

const Uuid = z.uuid();
const Hue = z.enum(BOARD_HUES);
const IsoDate = z.string().refine(isValidIsoDate, "Date must be a real calendar date");
const Neighbour = Uuid.nullable().default(null);

const title = (max: number) => z.string().trim().min(1).max(max);

export const BoardsQuery = z
  .object({
    archived: z.enum(["0", "1"]).default("0"),
    cursor: z.string().max(300).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();

export const CreateBoardInput = z.object({ title: title(80), hue: Hue.default("indigo") }).strict();

export const UpdateBoardInput = z
  .object({
    boardId: Uuid,
    title: title(80).optional(),
    hue: Hue.optional(),
    starred: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .strict();

export const CreateListInput = z.object({ boardId: Uuid, title: title(80) }).strict();

export const ListIdInput = z.strictObject({ listId: Uuid });

export const UpdateListInput = z
  .object({ listId: Uuid, title: title(80).optional(), archived: z.boolean().optional() })
  .strict();

export const MoveListInput = z
  .object({ listId: Uuid, beforeId: Neighbour, afterId: Neighbour })
  .strict();

export const CardsQuery = z
  .object({
    q: z.string().trim().max(80).optional(),
    label: Uuid.optional(),
    due: z.enum(["none", "overdue", "today", "week"]).optional(),
    archived: z.enum(["0", "1"]).default("0"),
    cursor: z.string().max(300).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();

export const CreateCardInput = z
  .object({
    listId: Uuid,
    title: title(200),
    beforeId: Neighbour,
    afterId: Neighbour,
  })
  .strict();

export const UpdateCardInput = z
  .object({
    cardId: Uuid,
    title: title(200).optional(),
    description: z.string().max(10000).nullable().optional(),
    dueOn: IsoDate.nullable().optional(),
    dueComplete: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .strict();

export const MoveCardInput = z
  .object({
    cardId: Uuid,
    listId: Uuid,
    beforeId: Neighbour,
    afterId: Neighbour,
    // With no neighbours, TOP puts the card first and BOTTOM puts it last, computed on the server.
    placement: z.enum(["TOP", "BOTTOM"]).optional(),
  })
  .strict();

export const CreateLabelInput = z.object({ boardId: Uuid, name: title(40), hue: Hue }).strict();

export const UpdateLabelInput = z
  .object({ labelId: Uuid, name: title(40).optional(), hue: Hue.optional() })
  .strict();

export const DeleteLabelInput = z.object({ labelId: Uuid }).strict();

export const SetCardLabelInput = z
  .object({ cardId: Uuid, labelId: Uuid, on: z.boolean() })
  .strict();

export const CreateChecklistItemInput = z.object({ cardId: Uuid, title: title(200) }).strict();

export const UpdateChecklistItemInput = z
  .object({
    itemId: Uuid,
    title: title(200).optional(),
    done: z.boolean().optional(),
  })
  .strict();

export const DeleteChecklistItemInput = z.object({ itemId: Uuid }).strict();
