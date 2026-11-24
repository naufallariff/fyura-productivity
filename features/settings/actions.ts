"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import { saveThemeMode, saveThemeSelection } from "@/server/db/settings";
import { MODES } from "@/lib/theme/bundles";
import { ThemeSelectionSchema } from "@/lib/theme/resolve";

const ThemeModeSchema = z.strictObject({ mode: z.enum(MODES) });

export async function saveThemeModeAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  const parsed = ThemeModeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_FAILED" };

  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    await saveThemeMode(user.id, parsed.data.mode);
    return null;
  });
}

export type ThemeActionState =
  { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

export async function saveThemeAction(
  _previous: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  const user = await requireUser();

  const parsed = ThemeSelectionSchema.safeParse({
    bundle: formData.get("bundle"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Choose a valid bundle and mode." };
  }

  await saveThemeSelection(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { status: "saved" };
}
