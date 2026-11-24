"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import { saveThemeSelection } from "@/server/db/settings";
import { ThemeSelectionSchema } from "@/lib/theme/resolve";

const ThemeChangeSchema = ThemeSelectionSchema.partial().refine(
  ({ bundle, mode }) => bundle !== undefined || mode !== undefined,
);

export async function saveThemeAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  const parsed = ThemeChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_FAILED" };

  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    await saveThemeSelection(user.id, parsed.data);
    return null;
  });
}
