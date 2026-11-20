// server/validation/journal.ts
import { z } from "zod";
import { JOURNAL_KINDS } from "@/domain/journal/kinds";
import { isValidIsoDate } from "@/domain/time/local-date";

export { JOURNAL_KINDS, type JournalKind } from "@/domain/journal/kinds";

const IsoDate = z.string().refine(isValidIsoDate, "Date must be a real calendar date");

export const CreateJournalInput = z
  .object({
    logDate: IsoDate,
    kind: z.enum(JOURNAL_KINDS),
    title: z.string().trim().max(120).default(""),
    body: z.string().trim().min(1).max(20000),
  })
  .strict();

export const DeleteJournalInput = z.object({ entryId: z.uuid() }).strict();
