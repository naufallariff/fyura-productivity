// features/journal/tadabur/actions.ts
"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import { DomainError } from "@/server/services/errors";
import { parse } from "@/server/services/parse";
import { createTadabur, deleteTadabur, updateTadabur } from "@/server/services/tadabur";
import { hasHtmlText, sanitizeHtml } from "@/server/validation/sanitize";
import { CreateTadaburInput, UpdateTadaburInput } from "@/server/validation/tadabur";

/** Session check outside runAction, so the redirect is never caught. Then the rate limit, then the service. */
async function write<T>(task: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    return task(user.id);
  });
}

function sanitizeReflection(value: string): string {
  const html = sanitizeHtml(value);
  if (!hasHtmlText(html)) throw new DomainError("VALIDATION_FAILED", "Reflection is empty");
  return html;
}

export async function createTadaburAction(input: unknown) {
  return write((userId) => {
    const entry = parse(CreateTadaburInput, input);
    return createTadabur(
      userId,
      { ...entry, reflection: sanitizeReflection(entry.reflection) },
      "html",
    );
  });
}

export async function updateTadaburAction(input: unknown) {
  return write(async (userId) => {
    const entry = parse(UpdateTadaburInput, input);
    if (entry.reflection !== undefined) entry.reflection = sanitizeReflection(entry.reflection);
    await updateTadabur(userId, entry, "html");
    return null;
  });
}

export async function deleteTadaburAction(input: unknown) {
  return write(async (userId) => {
    await deleteTadabur(userId, input);
    return null;
  });
}
