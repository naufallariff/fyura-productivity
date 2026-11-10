"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { parseClock } from "@/lib/time/clock";
import {
  createTimeBlock,
  deleteTimeBlock,
  moveTimeBlock,
  setDayStatus,
} from "@/lib/services/daily";
import { DomainError, type DomainErrorCode } from "@/lib/services/errors";

export type ActionState =
  { status: "idle" } | { status: "ok" } | { status: "error"; message: string };

const ERROR_KEYS: Record<DomainErrorCode, string> = {
  VALIDATION_FAILED: "today.error.invalid",
  NOT_FOUND: "today.error.notFound",
  CONFLICT: "today.error.overlap",
  HABIT_ARCHIVED: "today.error.invalid",
};

/** Known domain errors become user-facing messages. Anything else reaches the error boundary. */
function toErrorState(error: unknown): ActionState {
  if (error instanceof DomainError) {
    return { status: "error", message: t(ERROR_KEYS[error.code]) };
  }
  throw error;
}

export async function addBlockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const startMinute = parseClock(String(formData.get("startTime") ?? ""));
  if (startMinute === null) {
    return { status: "error", message: t("today.error.invalid") };
  }

  try {
    await createTimeBlock(user.id, {
      logDate: formData.get("logDate"),
      startMinute,
      durationMinutes: Number(formData.get("durationMinutes")),
      category: formData.get("category"),
      activity: formData.get("activity"),
      source: "MANUAL",
    });
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/today");
  return { status: "ok" };
}

export async function moveBlockAction(
  blockId: string,
  startMinute: number,
  endMinute: number,
): Promise<ActionState> {
  const user = await requireUser();
  try {
    await moveTimeBlock(user.id, { blockId, startMinute, endMinute });
  } catch (error) {
    return toErrorState(error);
  }
  revalidatePath("/today");
  return { status: "ok" };
}

export async function deleteBlockAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteTimeBlock(user.id, String(formData.get("blockId") ?? ""));
  revalidatePath("/today");
}

export async function setDayStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await setDayStatus(user.id, {
    logDate: formData.get("logDate"),
    status: formData.get("status"),
  });
  revalidatePath("/today");
}
