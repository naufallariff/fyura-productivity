"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { setHabitCheck } from "@/lib/services/daily";

export async function setHabitCheckAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await setHabitCheck(user.id, {
    habitId: formData.get("habitId"),
    logDate: formData.get("logDate"),
    value: Number(formData.get("value")),
  });
  revalidatePath("/habits");
  revalidatePath("/today");
}
