import { z } from "zod";

export const JOURNAL_KINDS = ["DAILY", "LEARNING", "ENGLISH", "COURSE", "FREE"] as const;
export type JournalKind = (typeof JOURNAL_KINDS)[number];

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD");

export const CreateJournalInput = z
  .object({
    logDate: IsoDate,
    kind: z.enum(JOURNAL_KINDS),
    title: z.string().trim().max(120),
    body: z.string().trim().min(1, "Write at least one line").max(20_000),
  })
  .strict();

export type CreateJournalParams = z.infer<typeof CreateJournalInput>;
