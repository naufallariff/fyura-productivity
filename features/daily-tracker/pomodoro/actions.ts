// features/daily-tracker/pomodoro/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/server/api/action";
import { requireUser } from "@/server/auth/session";
import { logFocusSession, type FocusLogResult } from "@/server/services/focus";

export interface FocusLogInput {
  readonly logDate: string;
  readonly kind: "DEEP" | "LIGHT";
  readonly plannedMinutes: number;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly startMinute: number;
}

export async function logFocusAction(input: FocusLogInput): Promise<ActionResult<FocusLogResult>> {
  // requireUser() stays outside runAction, because its redirect must not be caught.
  const user = await requireUser();
  return runAction(async () => {
    const result = await logFocusSession(user.id, input);
    revalidatePath("/daily-tracker");
    revalidatePath("/dashboard");
    return result;
  });
}
