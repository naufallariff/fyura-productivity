import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Locks the button while a request runs. Pair with a pending label in children. */
  pending?: boolean;
  icon?: LucideIcon;
}

// Touch targets are at least 44 px on phones and 36 px on larger screens.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[transform,background-color,opacity] duration-200 ease-spring motion-safe:active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50";

const SIZE = {
  sm: "min-h-11 px-3 text-sm sm:min-h-9",
  md: "min-h-11 px-4 text-sm sm:px-4",
} as const;

const VARIANT = {
  primary: "bg-accent text-on-accent shadow-xs hover:bg-accent-hover",
  secondary: "border border-(--border-control) text-ink bg-(--bg-surface) hover:bg-accent-soft",
  ghost: "text-ink-muted hover:bg-accent-soft hover:text-ink",
  danger: "border border-negative text-negative hover:bg-(--color-negative-soft)",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  pending = false,
  icon: Icon,
  className,
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(BASE, SIZE[size], VARIANT[variant], className)}
      {...rest}
    >
      {pending ? (
        <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" />
      ) : (
        Icon && <Icon aria-hidden className="size-4" strokeWidth={1.75} />
      )}
      {children}
    </button>
  );
}
