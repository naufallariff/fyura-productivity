"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/session";
import { saveThemeSelection } from "@/server/db/settings";
import { ThemeSelectionSchema } from "@/lib/theme/resolve";

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
