// features/career/actions.ts
"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import { createJob, logActivity, updateJob } from "@/server/services/career";

async function write<T>(task: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    return task(user.id);
  });
}

export async function createJobAction(input: unknown) {
  return write((userId) => createJob(userId, input));
}

export async function updateJobAction(input: unknown) {
  return write(async (userId) => {
    await updateJob(userId, input);
    return null;
  });
}

export async function logActivityAction(input: unknown) {
  return write((userId) => logActivity(userId, input));
}
