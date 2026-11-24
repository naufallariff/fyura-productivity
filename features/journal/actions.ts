// features/journal/actions.ts
"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import { DomainError } from "@/server/services/errors";
import { createJournalEntry, deleteJournalEntry } from "@/server/services/journal";
import { parse } from "@/server/services/parse";
import { CreateJournalInput } from "@/server/validation/journal";
import { hasHtmlText, sanitizeHtml } from "@/server/validation/sanitize";

export async function createJournalAction(input: unknown): Promise<ActionResult<string>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    const entry = parse(CreateJournalInput, input);
    const body = sanitizeHtml(entry.body);
    if (!hasHtmlText(body)) throw new DomainError("VALIDATION_FAILED", "Journal body is empty");
    return createJournalEntry(user.id, { ...entry, body }, "html");
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
