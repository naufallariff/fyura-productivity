import { z } from "zod";
import { DAY_STATUSES } from "@/lib/scoring/types";
import { MINUTES_PER_DAY } from "@/lib/time/split-block";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD");

export const DayStatusSchema = z.enum(DAY_STATUSES);

export const SetDayStatusInput = z.object({
  logDate: IsoDate,
  status: DayStatusSchema,
});

export const HabitCheckInput = z.object({
  habitId: z.uuid(),
  logDate: IsoDate,
  value: z.number().int().min(0).max(1440),
});

export const CreateTimeBlockInput = z
  .object({
    logDate: IsoDate,
    startMinute: z
      .number()
      .int()
      .min(0)
      .max(MINUTES_PER_DAY - 1),
    durationMinutes: z.number().int().min(1).max(MINUTES_PER_DAY),
    category: z.enum([
      "WORSHIP",
      "LEARNING",
      "WORK",
      "CAREER",
      "FITNESS",
      "REST",
      "SOCIAL",
      "LEISURE",
    ]),
    activity: z.string().trim().min(1).max(120),
    habitId: z.uuid().optional(),
    source: z.enum(["MANUAL", "TIMER", "CHIP"]).default("MANUAL"),
  })
  .strict();

export const CreateHabitInput = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]{2,47}$/, "Use lowercase snake_case"),
    name: z.string().trim().min(1).max(80),
    category: z.enum(["WORSHIP", "LEARNING", "WORK", "CAREER", "FITNESS"]),
    kind: z.enum(["BINARY", "QUANTITY"]),
    target: z.number().int().min(1).max(1440),
    offDayCore: z.boolean().default(false),
  })
  .strict();

export type SetDayStatusParams = z.infer<typeof SetDayStatusInput>;
export type HabitCheckParams = z.infer<typeof HabitCheckInput>;
export type CreateTimeBlockParams = z.infer<typeof CreateTimeBlockInput>;
export type CreateHabitParams = z.infer<typeof CreateHabitInput>;
