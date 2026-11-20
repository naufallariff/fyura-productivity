"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import { setUserTimeZone } from "@/server/services/user";

export type TimeZoneActionState =
  { status: "idle" } | { status: "saved" } | { status: "error"; code: string };

export async function saveTimeZoneAction(
  _previous: TimeZoneActionState,
  formData: FormData,
): Promise<TimeZoneActionState> {
  const user = await requireUser();

  const result = await runAction(async () => {
    await consumeRateLimit(user.id, "write");
    await setUserTimeZone(user.id, { timeZone: String(formData.get("timeZone") ?? "") });
    return null;
  });

  if (!result.ok) return { status: "error", code: result.code };

  // Every page computes "today" from the stored zone, so refresh the whole app.
  revalidatePath("/", "layout");
  return { status: "saved" };
}
