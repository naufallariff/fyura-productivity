"use client";

import { useId } from "react";
import { cn } from "@/lib/ui/cn";

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  readonly label: string;
  readonly options: readonly { value: T; label: string }[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}) {
  const name = useId();
  const activeIndex = options.findIndex((option) => option.value === value);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="rounded-full border border-(--border-subtle) bg-(--bg-canvas) p-1"
    >
      <div
        className="relative isolate grid"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-(--bg-surface-elevated) shadow-(--shadow-card) motion-safe:transition-[transform] motion-safe:duration-160 motion-safe:ease-(--ease-out-snappy) motion-safe:will-change-transform"
            style={{
              width: `${100 / options.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}
        {options.map((option) => (
          <label key={option.value} className="relative min-w-0">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "peer-focus-visible:outline-accent flex min-h-11 cursor-pointer items-center justify-center rounded-full px-1 text-center text-xs font-medium wrap-anywhere peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2",
                value === option.value ? "text-ink" : "text-ink-muted",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
