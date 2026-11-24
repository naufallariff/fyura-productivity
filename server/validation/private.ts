import { z } from "zod";

export const CreatePrivateRecordInput = z
  .object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(20000),
  })
  .strict();

export const PrivateRecordId = z.object({ id: z.uuid() }).strict();
export const UpdatePrivateRecordInput = CreatePrivateRecordInput.extend(PrivateRecordId.shape);
