// server/validation/tadabur.ts
import { z } from "zod";
import { isValidIsoDate } from "@/domain/time/local-date";

const IsoDate = z.string().refine(isValidIsoDate, "Date must be a real calendar date");
const Surah = z.number().int().min(1).max(114);
const Ayat = z.number().int().min(1).max(286);
const Reflection = z.string().trim().min(1).max(10000);

export const TadaburQuery = z
  .object({
    from: IsoDate.optional(),
    to: IsoDate.optional(),
    surah: z.coerce.number().int().min(1).max(114).optional(),
    cursor: z.string().max(300).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();

export const CreateTadaburInput = z
  .object({
    logDate: IsoDate,
    surah: Surah,
    ayatFrom: Ayat,
    ayatTo: Ayat,
    reflection: Reflection,
  })
  .strict()
  .refine((value) => value.ayatTo >= value.ayatFrom, {
    message: "Ayat end must not be before ayat start",
    path: ["ayatTo"],
  });

export const UpdateTadaburInput = z
  .object({
    entryId: z.uuid(),
    logDate: IsoDate.optional(),
    surah: Surah.optional(),
    ayatFrom: Ayat.optional(),
    ayatTo: Ayat.optional(),
    reflection: Reflection.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 1, "Nothing to update");

export const DeleteTadaburInput = z.object({ entryId: z.uuid() }).strict();
