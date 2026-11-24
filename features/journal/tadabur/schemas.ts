// features/journal/tadabur/schemas.ts
import { z } from "zod";

export const TadaburItemSchema = z.object({
  id: z.string(),
  logDate: z.string(),
  surah: z.number().int(),
  ayatFrom: z.number().int(),
  ayatTo: z.number().int(),
  reflection: z.string(),
  reflectionIsHtml: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TadaburItem = z.infer<typeof TadaburItemSchema>;
