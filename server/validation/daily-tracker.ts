import { z } from "zod";
import { BLOCK_CATEGORIES } from "@/domain/categories";
import { DAY_STATUSES } from "@/domain/scoring/types";
import { daysBetween } from "@/domain/time/logical-date";
import { isValidIsoDate } from "@/domain/time/local-date";
import { MAX_PAGE_SIZE, PAGE_SIZE } from "@/server/db/cursor";

const IsoDate = z.string().refine(isValidIsoDate, "Date must be a real calendar date");

const MAX_RANGE_DAYS = 92;

export const ChecklistDayQuery = z.object({ date: IsoDate }).strict();

export const ChecklistScoresQuery = z
  .object({ from: IsoDate, to: IsoDate })
  .strict()
  .refine((value) => value.from <= value.to, "from must not be after to")
  .refine(
    (value) =>
      isValidIsoDate(value.from) &&
      isValidIsoDate(value.to) &&
      daysBetween(value.from, value.to) < MAX_RANGE_DAYS,
    `Range must be shorter than ${MAX_RANGE_DAYS} days`,
  );

export const SetChecklistItemInput = z
  .object({
    logDate: IsoDate,
    sourceItemId: z.uuid(),
    done: z.boolean(),
  })
  .strict();

export const HistoryQuery = z
  .object({
    from: IsoDate.optional(),
    to: IsoDate.optional(),
    category: z.enum(BLOCK_CATEGORIES).optional(),
    q: z.string().trim().max(60).optional(),
    cursor: z.string().max(300).optional(),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE),
  })
  .strict();

export const UpdateBlockInput = z
  .object({
    blockId: z.uuid(),
    activity: z.string().trim().min(1).max(120).optional(),
    category: z.enum(BLOCK_CATEGORIES).optional(),
  })
  .strict()
  .refine(
    (value) => value.activity !== undefined || value.category !== undefined,
    "Nothing to update",
  );

export const DayStatusInput = z.enum(DAY_STATUSES);
