import type { Hue } from "@/lib/theme/hues";
import { cn } from "@/lib/ui/cn";
import { initials } from "@/lib/ui/initials";
import { hueVar, tintStyle } from "@/lib/ui/hue";

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
  return (
    <span
      aria-hidden
      className={cn(
        "text-ink inline-grid shrink-0 place-items-center rounded-full font-semibold",
        SIZE[size],
        className,
      )}
      style={tintStyle(hueVar(hue), 22)}
    >
      {initials(name)}
    </span>
  );
}
