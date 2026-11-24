"use client";

import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const HoverGroup = createContext<{ skipDelay: () => boolean; warm: () => void } | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const skipUntil = useRef(0);
  return (
    <HoverGroup.Provider
      value={{
        skipDelay: () => performance.now() < skipUntil.current,
        warm: () => {
          skipUntil.current = performance.now() + 300;
        },
      }}
    >
      {children}
    </HoverGroup.Provider>
  );
}

export function Tooltip({
  text,
  shortcut,
  children,
}: {
  text: string;
  shortcut?: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
}) {
  const id = useId();
  const group = useContext(HoverGroup);
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const focused = useRef(false);
  const hovered = useRef(false);
  const shown = useRef(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);

  function show(skipDelay: boolean) {
    window.clearTimeout(timer.current);
    const reveal = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      shown.current = true;
      setPosition({ left: rect.right, top: rect.top + rect.height / 2 });
      setInstant(skipDelay);
      setOpen(true);
    };
    if (skipDelay) reveal();
    else timer.current = window.setTimeout(reveal, 125);
  }

  function hide() {
    window.clearTimeout(timer.current);
    if (shown.current) group?.warm();
    shown.current = false;
    setOpen(false);
  }

  function leave() {
    hovered.current = false;
    if (!focused.current) hide();
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: Event) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      setOpen(false);
      shown.current = false;
    }
    window.addEventListener("keydown", dismiss);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  return (
    <span
      ref={anchor}
      className="block"
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        hovered.current = true;
        if (!shown.current) show(group?.skipDelay() ?? false);
      }}
      onPointerLeave={(event) => {
        if (!(
          event.relatedTarget instanceof Element &&
          event.relatedTarget.closest("[data-sidebar-tooltip]")
        ))
          leave();
      }}
      onFocus={() => {
        focused.current = true;
        show(true);
      }}
      onBlur={() => {
        focused.current = false;
        if (!hovered.current) hide();
      }}
    >
      {cloneElement(children, {
        "aria-describedby": shortcut ? id : children.props["aria-describedby"],
      })}
      {shortcut && (
        <span id={id} className="sr-only">
          {shortcut}
        </span>
      )}
      {position &&
        createPortal(
          <span
            data-sidebar-tooltip
            data-open={open ? "" : undefined}
            data-instant={instant ? "" : undefined}
            role="tooltip"
            aria-hidden={!open}
            style={position}
            onPointerLeave={(event) => {
              if (!anchor.current?.contains(event.relatedTarget as Node | null)) leave();
            }}
            className="floating-tooltip fixed z-50 -translate-y-1/2 pl-3"
          >
            <span className="floating-tooltip-content text-ink flex items-center gap-3 rounded-lg border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-xs whitespace-nowrap shadow-(--shadow-raised)">
              {text}
              {shortcut && <kbd className="text-ink-muted font-sans">{shortcut}</kbd>}
            </span>
          </span>,
          document.body,
        )}
    </span>
  );
}
