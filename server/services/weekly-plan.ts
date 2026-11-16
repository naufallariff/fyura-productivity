import "server-only";
import { withUser } from "@/server/db/tx";
import {
  applyOrder,
  insertPlanItem,
  listPlanItems,
  nextPosition,
  softDeletePlanItem,
  updatePlanItem,
  type PlanItemRow,
} from "@/server/db/repositories/weekly-plan";
import {
  CreatePlanItemInput,
  DeletePlanItemInput,
  ReorderPlanInput,
  UpdatePlanItemInput,
} from "@/server/validation/weekly-plan";
import { toCategory } from "@/domain/categories";
import type { PlanItem } from "@/domain/plan/types";
import { DomainError } from "./errors";
import { parse } from "./parse";

function toDto(row: PlanItemRow): PlanItem {
  return {
    id: row.id,
    weekday: row.weekday,
    position: row.position,
    title: row.title,
    category: toCategory(row.category),
    isRequired: row.isRequired,
    isCore: row.isCore,
    plannedMinutes: row.plannedMinutes,
  };
}

/** The whole template. It is bounded (about 7 days times a few dozen items), so no pagination. */
export async function getWeeklyPlan(userId: string): Promise<PlanItem[]> {
  return withUser(userId, async (tx) => (await listPlanItems(tx, userId)).map(toDto));
}

export async function createPlanItem(userId: string, input: unknown): Promise<PlanItem> {
  const parsed = parse(CreatePlanItemInput, input);
  return withUser(userId, async (tx) => {
    const position = await nextPosition(tx, userId, parsed.weekday);
    const row = await insertPlanItem(tx, {
      userId,
      weekday: parsed.weekday,
      position,
      title: parsed.title,
      category: parsed.category,
      isRequired: parsed.isRequired,
      isCore: parsed.isCore,
      plannedMinutes: parsed.plannedMinutes,
    });
    return toDto(row);
  });
}

export async function updatePlanItemDetails(userId: string, input: unknown): Promise<void> {
  const { itemId, ...patch } = parse(UpdatePlanItemInput, input);
  await withUser(userId, async (tx) => {
    const updated = await updatePlanItem(tx, userId, itemId, patch);
    if (!updated) throw new DomainError("NOT_FOUND", "Plan item not found");
  });
}

export async function deletePlanItem(userId: string, input: unknown): Promise<void> {
  const parsed = parse(DeletePlanItemInput, input);
  await withUser(userId, async (tx) => {
    const removed = await softDeletePlanItem(tx, userId, parsed.itemId);
    if (!removed) throw new DomainError("NOT_FOUND", "Plan item not found");
  });
}

/**
 * Saves a new order for one day. The client must send every active item of that day.
 * If the list changed in another tab, the request is rejected so no item is lost.
 */
export async function reorderPlanDay(userId: string, input: unknown): Promise<void> {
  const parsed = parse(ReorderPlanInput, input);
  await withUser(userId, async (tx) => {
    const active = (await listPlanItems(tx, userId)).filter(
      (row) => row.weekday === parsed.weekday,
    );
    const activeIds = new Set(active.map((row) => row.id));
    const requested = new Set(parsed.orderedIds);

    const stale =
      activeIds.size !== requested.size || [...requested].some((id) => !activeIds.has(id));
    if (stale) throw new DomainError("CONFLICT", "The day changed. Refresh and try again.");

    await applyOrder(tx, userId, parsed.weekday, parsed.orderedIds);
  });
}
