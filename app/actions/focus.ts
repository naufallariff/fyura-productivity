"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { logFocusSession } from "@/lib/services/focus";

export async function logFocusAction(input: {
  logDate: string;
  kind: "DEEP" | "LIGHT";
  plannedMinutes: 25 | 50 | 90;
  startedAt: string;
  endedAt: string;
}): Promise<void> {
  const user = await requireUser();
  await logFocusSession(user.id, input);
  revalidatePath("/focus");
  revalidatePath("/today");
  revalidatePath("/dashboard");
}
