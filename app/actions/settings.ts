"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { saveThemeSelection } from "@/lib/db/settings";
import { ThemeSelectionSchema } from "@/lib/theme/resolve";

export type ThemeActionState =
  { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

export async function saveThemeAction(
  _previous: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  const user = await requireUser();

  const parsed = ThemeSelectionSchema.safeParse({
    style: formData.get("style"),
    palette: formData.get("palette"),
    mode: formData.get("mode"),
  });

  if (!parsed.success) {
    const message = z.prettifyError(parsed.error);
    return { status: "error", message };
  }

  await saveThemeSelection(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { status: "saved" };
}
