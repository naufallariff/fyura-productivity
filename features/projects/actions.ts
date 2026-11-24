// features/projects/actions.ts
"use server";

import { runAction, type ActionResult } from "@/server/api/action";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { requireUser } from "@/server/auth/session";
import * as projects from "@/server/services/projects";

/**
 * Every write follows the same order: session check outside the try block,
 * then the rate limit, then the service. Errors come back as codes.
 */
async function write<T>(task: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const user = await requireUser();
  return runAction(async () => {
    await consumeRateLimit(user.id, "write");
    return task(user.id);
  });
}

async function mutate(task: (userId: string) => Promise<void>): Promise<ActionResult<null>> {
  return write(async (userId) => {
    await task(userId);
    return null;
  });
}

export async function createBoardAction(input: unknown) {
  return write((userId) => projects.createBoard(userId, input));
}

export async function updateBoardAction(input: unknown) {
  return mutate((userId) => projects.updateBoard(userId, input));
}

export async function createListAction(input: unknown) {
  return write((userId) => projects.createList(userId, input));
}

export async function updateListAction(input: unknown) {
  return mutate((userId) => projects.updateList(userId, input));
}

export async function moveListAction(input: unknown) {
  return mutate((userId) => projects.moveList(userId, input));
}

export async function deleteListAction(input: unknown) {
  return mutate((userId) => projects.deleteList(userId, input));
}

export async function sortListByDueDateAction(input: unknown) {
  return mutate((userId) => projects.sortListByDueDate(userId, input));
}

export async function createCardAction(input: unknown) {
  return write((userId) => projects.createCard(userId, input));
}

export async function updateCardAction(input: unknown) {
  return mutate((userId) => projects.updateCard(userId, input));
}

export async function moveCardAction(input: unknown) {
  return mutate((userId) => projects.moveCard(userId, input));
}

export async function createLabelAction(input: unknown) {
  return write((userId) => projects.createLabel(userId, input));
}

export async function updateLabelAction(input: unknown) {
  return mutate((userId) => projects.updateLabel(userId, input));
}

export async function deleteLabelAction(input: unknown) {
  return mutate((userId) => projects.deleteLabel(userId, input));
}

export async function setCardLabelAction(input: unknown) {
  return mutate((userId) => projects.setCardLabel(userId, input));
}

export async function createChecklistItemAction(input: unknown) {
  return write((userId) => projects.createChecklistItem(userId, input));
}

export async function updateChecklistItemAction(input: unknown) {
  return mutate((userId) => projects.updateChecklistItem(userId, input));
}

export async function deleteChecklistItemAction(input: unknown) {
  return mutate((userId) => projects.deleteChecklistItem(userId, input));
}
