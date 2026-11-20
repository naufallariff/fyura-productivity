// features/capture/actions.ts
"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import { createIdea, updateIdea } from "@/server/services/capture";

async function write<T>(task: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    return task(user.id);
  });
}

export async function createIdeaAction(input: unknown) {
  return write((userId) => createIdea(userId, input));
}

export async function updateIdeaAction(input: unknown) {
  return write(async (userId) => {
    await updateIdea(userId, input);
    return null;
  });
}
