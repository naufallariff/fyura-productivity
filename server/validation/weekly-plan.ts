import { z } from "zod";
import { BLOCK_CATEGORIES } from "@/domain/categories";

const WeekdaySchema = z.number().int().min(1).max(7);
const TitleSchema = z.string().trim().min(1).max(120);
const MinutesSchema = z.number().int().min(1).max(1440);

export const CreatePlanItemInput = z
  .object({
    weekday: WeekdaySchema,
    title: TitleSchema,
    category: z.enum(BLOCK_CATEGORIES),
    isRequired: z.boolean().default(true),
    isCore: z.boolean().default(false),
    plannedMinutes: MinutesSchema.nullable().default(null),
  })
  .strict();

// Every field is optional. Only the fields that are sent change.
export const UpdatePlanItemInput = z
  .object({
    itemId: z.uuid(),
    title: TitleSchema.optional(),
    category: z.enum(BLOCK_CATEGORIES).optional(),
    isRequired: z.boolean().optional(),
    isCore: z.boolean().optional(),
    plannedMinutes: MinutesSchema.nullable().optional(),
  })
  .strict();

export const DeletePlanItemInput = z.object({ itemId: z.uuid() }).strict();

export const ReorderPlanInput = z
  .object({
    weekday: WeekdaySchema,
    orderedIds: z
      .array(z.uuid())
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, "Duplicate item in order"),
  })
  .strict();
