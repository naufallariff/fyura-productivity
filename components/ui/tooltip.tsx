"use client";

import { useId, type ReactNode } from "react";

/** Short explanation on hover or keyboard focus. Shown after a 300 ms delay. */
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const id = useId();

  return (
    <span className="group relative inline-flex">
      <span aria-describedby={id} className="inline-flex">
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className="rounded-control bg-ink text-canvas pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 px-2.5 py-1.5 text-xs whitespace-nowrap opacity-0 transition-opacity delay-300 duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
