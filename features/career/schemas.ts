// features/career/schemas.ts
import { z } from "zod";
import { JOB_STATUSES } from "@/domain/career/status";

export const JobStatusSchema = z.enum(JOB_STATUSES);

export const JobSummarySchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  source: z.string().nullable(),
  status: JobStatusSchema,
  appliedAt: z.string().nullable(),
  nextAction: z.string().nullable(),
  nextActionDate: z.string().nullable(),
  archived: z.boolean(),
  needsFollowUp: z.boolean(),
  updatedAt: z.string(),
});

export const JobDetailSchema = JobSummarySchema.extend({
  link: z.string().nullable(),
  salaryInfo: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  events: z.array(
    z.object({
      id: z.string(),
      fromStatus: JobStatusSchema.nullable(),
      toStatus: JobStatusSchema,
      occurredAt: z.string(),
    }),
  ),
});

export const BoardSchema = z.object({ items: z.array(JobSummarySchema) });

export const SummarySchema = z.object({
  counts: z.record(z.string(), z.number().int()),
  followUp: z.number().int(),
});

export const ActivityRangeSchema = z.object({
  items: z.array(
    z.object({
      date: z.string(),
      kind: z.enum(["APPLY", "FOLLOW_UP", "NETWORKING", "REMOTE_COMMUNITY", "OTHER"]),
      count: z.number().int(),
    }),
  ),
  totals: z.record(z.string(), z.number().int()),
});

export type JobSummary = z.infer<typeof JobSummarySchema>;
export type JobDetail = z.infer<typeof JobDetailSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
