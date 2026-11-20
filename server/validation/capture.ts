// server/validation/capture.ts
import { z } from "zod";
import { normalizeTag, MAX_TAGS_PER_IDEA } from "@/domain/capture/tags";

export const IDEA_STATUSES = ["INBOX", "ACTIVE", "ARCHIVED"] as const;

const Tag = z
  .string()
  .max(40)
  .refine((value) => normalizeTag(value) !== null, "Tag format is invalid");

const Tags = z.array(Tag).max(MAX_TAGS_PER_IDEA);

export const IdeasQuery = z
  .object({
    status: z.enum(IDEA_STATUSES).optional(),
    tag: Tag.optional(),
    q: z.string().trim().max(80).optional(),
    cursor: z.string().max(300).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();

export const CreateIdeaInput = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().max(20000).default(""),
    tags: Tags.default([]),
  })
  .strict();

export const UpdateIdeaInput = z
  .object({
    ideaId: z.uuid(),
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().max(20000).optional(),
    status: z.enum(IDEA_STATUSES).optional(),
    tags: Tags.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 1, "Nothing to update");
