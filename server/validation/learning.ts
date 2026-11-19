// server/validation/learning.ts
import { z } from "zod";
import {
  ITEM_KINDS,
  ITEM_STATUSES,
  MAX_MINUTES_PER_DAY,
  MAX_UNITS,
  SUBJECT_KINDS,
  SUBJECT_STATUSES,
} from "@/domain/learning/model";
import { isValidIsoDate } from "@/domain/time/local-date";

const Uuid = z.uuid();
const IsoDate = z.string().refine(isValidIsoDate, "Date must be a real calendar date");
const Title = (max: number) => z.string().trim().min(1).max(max);
const TotalUnits = z.number().int().min(1).max(MAX_UNITS);
const Units = z.number().int().min(0).max(MAX_UNITS);
const Minutes = z.number().int().min(0).max(MAX_MINUTES_PER_DAY);
const SourceUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || value.startsWith("https://"), "Link must start with https://");

export const CreateSubjectInput = z
  .object({
    name: Title(80),
    kind: z.enum(SUBJECT_KINDS),
    status: z.enum(SUBJECT_STATUSES).default("QUEUED"),
  })
  .strict();

export const UpdateSubjectInput = z
  .object({
    subjectId: Uuid,
    name: Title(80).optional(),
    kind: z.enum(SUBJECT_KINDS).optional(),
    status: z.enum(SUBJECT_STATUSES).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 1, "Nothing to update");

export const ItemsQuery = z
  .object({
    subjectId: Uuid.optional(),
    status: z.enum(ITEM_STATUSES).optional(),
    cursor: z.string().max(300).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();

export const CreateItemInput = z
  .object({
    subjectId: Uuid,
    title: Title(160),
    kind: z.enum(ITEM_KINDS),
    sourceUrl: SourceUrl.default(""),
    totalUnits: TotalUnits.nullable().default(null),
    status: z.enum(ITEM_STATUSES).default("QUEUED"),
  })
  .strict();

export const UpdateItemInput = z
  .object({
    itemId: Uuid,
    title: Title(160).optional(),
    kind: z.enum(ITEM_KINDS).optional(),
    sourceUrl: SourceUrl.optional(),
    totalUnits: TotalUnits.nullable().optional(),
    status: z.enum(ITEM_STATUSES).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 1, "Nothing to update");

export const LogProgressInput = z
  .object({
    itemId: Uuid,
    logDate: IsoDate,
    units: Units,
    minutes: Minutes,
  })
  .strict();

export const CreateReviewInput = z
  .object({
    itemId: Uuid.nullable().default(null),
    prompt: Title(500),
  })
  .strict();

export const SubmitReviewInput = z
  .object({
    cardId: Uuid,
    quality: z.number().int().min(0).max(5),
  })
  .strict();

export const DueQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();
