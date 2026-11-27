import type { Hue } from "@/lib/theme/hues";
import type { CSSProperties } from "react";
import { cn } from "@/lib/ui/cn";
import { initials } from "@/lib/ui/initials";

const SIZE = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
} as const;

/** Decorative. The name must appear as visible text next to it. */
export function Avatar({
  name,
  hue = "indigo",
  size = "md",
  className,
}: {
  name: string;
  hue?: Hue;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const tone =
    hue === "emerald"
      ? "aqua"
      : hue === "amber"
        ? "lime"
        : hue === "rose"
          ? "pink"
          : hue === "sky"
            ? "blue"
            : "violet";
  return (
    <span
      aria-hidden
      className={cn(
        "account-avatar inline-grid shrink-0 place-items-center font-semibold",
        SIZE[size],
        className,
      )}
      style={{ "--avatar-tone": `var(--prism-${tone})` } as CSSProperties}
    >
      {initials(name)}
    </span>
  );
}
