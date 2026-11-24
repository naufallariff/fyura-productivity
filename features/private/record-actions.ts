"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import {
  createPrivateRecord,
  deletePrivateRecord,
  listPrivateRecords,
  updatePrivateRecord,
} from "@/server/services/private";

async function recordAction<T>(
  budget: "read" | "write",
  task: (userId: string) => Promise<T>,
): Promise<ActionResult<T>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, budget);
    return task(user.id);
  });
}

export async function listPrivateRecordsAction() {
  return recordAction("read", listPrivateRecords);
}

export async function createPrivateRecordAction(input: unknown) {
  return recordAction("write", (userId) => createPrivateRecord(userId, input));
}

export async function updatePrivateRecordAction(input: unknown) {
  return recordAction("write", (userId) => updatePrivateRecord(userId, input));
}

export async function deletePrivateRecordAction(input: unknown) {
  return recordAction("write", async (userId) => {
    await deletePrivateRecord(userId, input);
    return null;
  });
}
