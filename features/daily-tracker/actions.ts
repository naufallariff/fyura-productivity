"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import {
  createTimeBlock,
  deleteTimeBlock,
  moveTimeBlock,
  setDayStatus,
} from "@/server/services/daily";
import { setChecklistItem } from "@/server/services/checklist";
import { updateTimeBlockDetails } from "@/server/services/history";

export async function createBlockAction(input: unknown): Promise<ActionResult<string>> {
  const user = await requireUser();
  return runAction(() => createTimeBlock(user.id, input));
}

export async function moveBlockAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await moveTimeBlock(user.id, input);
    return null;
  });
}

export async function updateBlockAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await updateTimeBlockDetails(user.id, input);
    return null;
  });
}

export async function deleteBlockAction(blockId: string): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await deleteTimeBlock(user.id, blockId);
    return null;
  });
}

export async function setDayStatusAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await setDayStatus(user.id, input);
    return null;
  });
}

export async function setChecklistItemAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    await setChecklistItem(user.id, input);
    return null;
  });
}
