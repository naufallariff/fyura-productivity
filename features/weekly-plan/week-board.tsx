"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabelKey } from "@/domain/categories";
import type { PlanItem } from "@/domain/plan/types";
import { WEEKDAYS, weekdayLabel, type Weekday } from "@/domain/plan/weekly";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { ItemDialog } from "./item-dialog";
import { useReorderDay, useWeeklyPlan } from "./use-weekly-plan";

export function WeekBoard({ userId }: { userId: string }) {
  const plan = useWeeklyPlan(userId);
  const reorder = useReorderDay(userId);
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [addingOn, setAddingOn] = useState<Weekday | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<number, PlanItem[]>(WEEKDAYS.map((day) => [day, []]));
    for (const item of plan.data ?? []) map.get(item.weekday)?.push(item);
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [plan.data]);

  if (plan.isPending) return <BoardSkeleton />;

  if (plan.isError) {
    return (
      <EmptyState
        icon={StickyNote}
        title={t("weeklyPlan.loadError")}
        action={
          <Button variant="secondary" onClick={() => plan.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  return (
    <>
      {reorder.isError && (
        <p role="alert" className="text-negative mb-4 text-sm">
          {t("weeklyPlan.reorderError")}
        </p>
      )}

      {/* Horizontal scroll with snap on phones, a seven-column grid from md up. */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-7 md:overflow-visible">
        {WEEKDAYS.map((weekday) => (
          <DayNote
            key={weekday}
            weekday={weekday}
            items={byDay.get(weekday) ?? []}
            onAdd={() => setAddingOn(weekday)}
            onEdit={setEditing}
            onReorder={(ids) => reorder.mutate({ weekday, orderedIds: ids })}
          />
        ))}
      </div>

      <ItemDialog
        key={editing?.id ?? `new-${addingOn ?? "none"}`}
        userId={userId}
        open={editing !== null || addingOn !== null}
        weekday={addingOn ?? editing?.weekday ?? 1}
        item={editing}
        onClose={() => {
          setEditing(null);
          setAddingOn(null);
        }}
      />
    </>
  );
}

function DayNote({
  weekday,
  items,
  onAdd,
  onEdit,
  onReorder,
}: {
  weekday: Weekday;
  items: PlanItem[];
  onAdd: () => void;
  onEdit: (item: PlanItem) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map((item) => item.id);
  const requiredMinutes = items
    .filter((item) => item.isRequired)
    .reduce((sum, item) => sum + (item.plannedMinutes ?? 0), 0);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  const label = weekdayLabel(weekday);

  return (
    <section
      aria-labelledby={`day-${weekday}`}
      className="flex min-h-80 min-w-72 snap-start flex-col gap-3 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card) md:min-w-0"
    >
      <header className="flex items-center justify-between gap-2">
        <h2 id={`day-${weekday}`} className="text-sm font-semibold">
          {label}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          icon={Plus}
          onClick={onAdd}
          aria-label={t("weeklyPlan.addOn", { day: label })}
        >
          {t("weeklyPlan.add")}
        </Button>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-1 flex-col gap-2">
            {items.map((item) => (
              <SortableItem key={item.id} item={item} onEdit={onEdit} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <EmptyState
          icon={StickyNote}
          title={t("weeklyPlan.emptyTitle")}
          body={t("weeklyPlan.emptyBody")}
        />
      )}

      <footer className="text-ink-muted mt-auto text-xs tabular-nums">
        {t("weeklyPlan.requiredMinutes", { minutes: requiredMinutes })}
      </footer>
    </section>
  );
}

function SortableItem({ item, onEdit }: { item: PlanItem; onEdit: (item: PlanItem) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "border-line flex items-center gap-2 rounded-xl border bg-(--bg-surface-elevated) p-2",
        isDragging && "opacity-70 shadow-lg",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t("weeklyPlan.moveItem", { title: item.title })}
        className="text-ink-muted hover:bg-accent-soft focus-visible:ring-accent grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-lg focus-visible:ring-2"
      >
        <GripVertical aria-hidden className="size-4" strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => onEdit(item)}
        className="min-w-0 flex-1 space-y-2 text-left"
      >
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="flex flex-wrap gap-2">
          <Pill tone={item.isRequired ? "accent" : "neutral"}>
            {item.isRequired ? t("weeklyPlan.required") : t("weeklyPlan.optional")}
          </Pill>
          <Pill>{t(categoryLabelKey(item.category))}</Pill>
          {item.plannedMinutes !== null && (
            <Pill>{t("weeklyPlan.minutes", { minutes: item.plannedMinutes })}</Pill>
          )}
        </span>
      </button>
    </li>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-4 md:grid-cols-7">
      {WEEKDAYS.map((day) => (
        <Skeleton key={day} className="h-80" />
      ))}
    </div>
  );
}
