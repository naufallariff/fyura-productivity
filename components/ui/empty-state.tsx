import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Hue } from "@/lib/theme/hues";
import { hueVar, tintStyle } from "@/lib/ui/hue";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  hue = "indigo",
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  hue?: Hue;
}) {
  return (
    <div className="grid justify-items-center gap-3 px-6 py-10 text-center">
      <span
        className="rounded-card grid size-12 place-items-center"
        style={tintStyle(hueVar(hue), 16)}
      >
        <Icon aria-hidden className="size-5" strokeWidth={1.75} style={{ color: hueVar(hue) }} />
      </span>
      <h3 className="text-ink text-base font-semibold">{title}</h3>
      {body && <p className="text-ink-muted max-w-sm text-sm leading-relaxed">{body}</p>}
      {action}
    </div>
  );
}
