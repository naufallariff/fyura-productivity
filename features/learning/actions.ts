// features/learning/actions.ts
"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import {
  createItem,
  createReviewCard,
  createSubject,
  logProgress,
  purgeItem,
  submitReview,
  updateItem,
  updateSubject,
} from "@/server/services/learning";

async function write<T>(task: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    return task(user.id);
  });
}

export async function createSubjectAction(input: unknown) {
  return write((userId) => createSubject(userId, input));
}

export async function updateSubjectAction(input: unknown) {
  return write((userId) => updateSubject(userId, input));
}

export async function createItemAction(input: unknown) {
  return write((userId) => createItem(userId, input));
}

export async function updateItemAction(input: unknown) {
  return write(async (userId) => {
    await updateItem(userId, input);
    return null;
  });
}

export async function logProgressAction(input: unknown) {
  return write((userId) => logProgress(userId, input));
}

export async function purgeItemAction(input: unknown) {
  return write((userId) => purgeItem(userId, input));
}

export async function createReviewAction(input: unknown) {
  return write((userId) => createReviewCard(userId, input));
}

export async function submitReviewAction(input: unknown) {
  return write((userId) => submitReview(userId, input));
}
