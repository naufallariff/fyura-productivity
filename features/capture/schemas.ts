// features/capture/schemas.ts
import { z } from "zod";

export const IdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  status: z.enum(["INBOX", "ACTIVE", "ARCHIVED"]),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TagCloudSchema = z.object({
  items: z.array(z.object({ tag: z.string(), count: z.number().int() })),
});

export type Idea = z.infer<typeof IdeaSchema>;
export type IdeaStatus = Idea["status"];
