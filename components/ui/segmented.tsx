"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/ui/cn";

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** In-page choice, such as a time range. For route tabs, use TabNav. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, step: number) => {
    const index = (from + step + options.length) % options.length;
    const next = options[index];
    if (!next) return;
    onChange(next.value);
    buttons.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(index, -1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="border-line inline-flex flex-wrap gap-1 rounded-full border bg-(--bg-surface) p-1"
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "focus-visible:ring-accent min-h-9 rounded-full px-4 text-sm font-medium transition-colors duration-200 focus-visible:ring-2",
              checked ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
