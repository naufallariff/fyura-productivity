import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Hue } from "@/lib/theme/hues";
import { cn } from "@/lib/ui/cn";
import { hueVar, tintStyle } from "@/lib/ui/hue";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "article" | "div";
  padding?: "none" | "md" | "lg";
  interactive?: boolean;
};

const PADDING = {
  none: "",
  md: "p-4",
  lg: "p-4 sm:p-6",
} as const;

export function Card({
  as: Tag = "div",
  padding = "md",
  interactive = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-(--border-subtle) bg-(--bg-surface) shadow-(--shadow-card)",
        PADDING[padding],
        interactive &&
          "ease-spring transition-transform duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.99]",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  titleId,
  title,
  icon: Icon,
  hue,
  action,
}: {
  titleId: string;
  title: string;
  icon?: LucideIcon;
  hue?: Hue;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg"
            style={tintStyle(hue ? hueVar(hue) : "var(--color-accent)", 16)}
          >
            <Icon
              aria-hidden
              className="size-4.5"
              strokeWidth={1.75}
              style={{ color: hue ? hueVar(hue) : "var(--color-accent)" }}
            />
          </span>
        )}
        <h2 id={titleId} className="truncate text-sm font-semibold tracking-[-0.01em]">
          {title}
        </h2>
      </div>
      {action}
    </header>
  );
}
