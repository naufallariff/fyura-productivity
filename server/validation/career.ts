// server/validation/career.ts
import { z } from "zod";
import { ACTIVITY_KINDS } from "@/domain/career/activity";
import { JOB_STATUSES } from "@/domain/career/status";
import { daysBetween } from "@/domain/time/logical-date";
import { isValidIsoDate } from "@/domain/time/local-date";

const IsoDate = z.string().refine(isValidIsoDate, "Date must be a real calendar date");
const Text = (max: number) => z.string().trim().min(1).max(max);
const Link = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || value.startsWith("https://"), "Link must start with https://");

export const JobsQuery = z
  .object({
    status: z.enum(JOB_STATUSES).optional(),
    q: z.string().trim().max(80).optional(),
    archived: z.enum(["0", "1"]).default("0"),
    cursor: z.string().max(300).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();

export const CreateJobInput = z
  .object({
    company: Text(120),
    role: Text(120),
    source: z.string().trim().max(80).default(""),
    link: Link.default(""),
    appliedAt: IsoDate.nullable().default(null),
    nextAction: z.string().trim().max(200).default(""),
    nextActionDate: IsoDate.nullable().default(null),
    salaryInfo: z.string().trim().max(500).default(""),
    notes: z.string().max(10000).default(""),
  })
  .strict();

export const UpdateJobInput = z
  .object({
    jobId: z.uuid(),
    company: Text(120).optional(),
    role: Text(120).optional(),
    source: z.string().trim().max(80).optional(),
    link: Link.optional(),
    status: z.enum(JOB_STATUSES).optional(),
    appliedAt: IsoDate.nullable().optional(),
    nextAction: z.string().trim().max(200).optional(),
    nextActionDate: IsoDate.nullable().optional(),
    salaryInfo: z.string().trim().max(500).optional(),
    notes: z.string().max(10000).optional(),
    archived: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 1, "Nothing to update");

export const LogActivityInput = z
  .object({
    activityDate: IsoDate,
    kind: z.enum(ACTIVITY_KINDS),
    delta: z.number().int().min(-100).max(100),
  })
  .strict()
  .refine((value) => value.delta !== 0, { message: "Delta must not be zero", path: ["delta"] });

export const ActivityRangeQuery = z
  .object({ from: IsoDate, to: IsoDate })
  .strict()
  .refine((value) => value.from <= value.to, "from must not be after to")
  .refine((value) => daysBetween(value.from, value.to) < 92, "Range must be shorter than 92 days");
