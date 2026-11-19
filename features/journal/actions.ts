// features/journal/actions.ts
"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import { createJournalEntry, deleteJournalEntry } from "@/server/services/journal";

export async function createJournalAction(input: unknown): Promise<ActionResult<string>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    return createJournalEntry(user.id, input);
  });
}

export async function deleteJournalAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    await deleteJournalEntry(user.id, input);
    return null;
  });
}
