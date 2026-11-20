import type { Category } from "@/domain/scoring/types";

export interface PlanItem {
  readonly id: string;
  readonly weekday: number;
  readonly position: number;
  readonly title: string;
  readonly category: Category;
  readonly isRequired: boolean;
  readonly isCore: boolean;
  readonly plannedMinutes: number | null;
}

export interface PlanItemDraft {
  readonly title: string;
  readonly category: Category;
  readonly isRequired: boolean;
  readonly isCore: boolean;
  readonly plannedMinutes: number | null;
}
