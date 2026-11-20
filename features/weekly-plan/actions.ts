"use server";

import { requireUser } from "@/server/auth/session";
import { runAction, type ActionResult } from "@/server/api/action";
import {
  createPlanItem,
  deletePlanItem,
  reorderPlanDay,
  updatePlanItemDetails,
} from "@/server/services/weekly-plan";
import type { PlanItem } from "@/domain/plan/types";

export async function createPlanItemAction(input: unknown): Promise<ActionResult<PlanItem>> {
  const user = await requireUser();
  return runAction(() => createPlanItem(user.id, input));
}

export async function updatePlanItemAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await updatePlanItemDetails(user.id, input);
    return null;
  });
}

export async function deletePlanItemAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await deletePlanItem(user.id, input);
    return null;
  });
}

export async function reorderPlanDayAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  return runAction(async () => {
    await reorderPlanDay(user.id, input);
    return null;
  });
}
