import { z } from "zod";
import { DAY_STATUSES } from "@/domain/scoring/types";
import { MINUTES_PER_DAY } from "@/domain/time/split-block";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD");

export const BLOCK_CATEGORIES = [
  "WORSHIP",
  "LEARNING",
  "WORK",
  "CAREER",
  "FITNESS",
  "REST",
  "SOCIAL",
  "LEISURE",
] as const;

export const SetDayStatusInput = z
  .object({
    logDate: IsoDate,
    status: z.enum(DAY_STATUSES),
  })
  .strict();

export const CreateTimeBlockInput = z
  .object({
    logDate: IsoDate,
    startMinute: z
      .number()
      .int()
      .min(0)
      .max(MINUTES_PER_DAY - 1),
    durationMinutes: z.number().int().min(1).max(MINUTES_PER_DAY),
    category: z.enum(BLOCK_CATEGORIES),
    activity: z.string().trim().min(1).max(120),
    source: z.enum(["MANUAL", "TIMER", "CHIP"]).default("MANUAL"),
  })
  .strict();

export const MoveTimeBlockInput = z
  .object({
    blockId: z.uuid(),
    startMinute: z
      .number()
      .int()
      .min(0)
      .max(MINUTES_PER_DAY - 1),
    endMinute: z.number().int().min(1).max(MINUTES_PER_DAY),
  })
  .strict()
  .refine((value) => value.endMinute > value.startMinute, {
    message: "End must be after start",
    path: ["endMinute"],
  });
