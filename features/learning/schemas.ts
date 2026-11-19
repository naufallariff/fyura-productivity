// features/learning/schemas.ts
import { z } from "zod";

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["STUDY", "LANGUAGE", "FAITH"]),
  status: z.enum(["QUEUED", "ACTIVE", "ARCHIVED"]),
  updatedAt: z.string(),
});

export const SubjectListSchema = z.object({
  items: z.array(SubjectSchema),
  activeCount: z.number().int(),
  wipLimit: z.number().int(),
});

export const ItemSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  kind: z.enum(["BOOK", "COURSE", "RESEARCH"]),
  sourceUrl: z.string().nullable(),
  totalUnits: z.number().int().nullable(),
  completedUnits: z.number().int(),
  status: z.enum(["QUEUED", "ACTIVE", "DONE", "ARCHIVED"]),
  updatedAt: z.string(),
});

export const ReviewSchema = z.object({
  id: z.string(),
  itemId: z.string().nullable(),
  prompt: z.string(),
  dueOn: z.string(),
  ef: z.number(),
  intervalDays: z.number().int(),
  repetitions: z.number().int(),
  lastQuality: z.number().int().nullable(),
});

export const DueSchema = z.object({ items: z.array(ReviewSchema) });

export type Subject = z.infer<typeof SubjectSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Review = z.infer<typeof ReviewSchema>;
