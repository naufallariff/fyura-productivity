import type { LucideIcon } from "lucide-react";
import { hueInk, hueTint, type Hue } from "@/lib/design/hues";

/**
 * A card with a single hue. The icon sits in a tinted tile, the title and
 * body stay in theme text. Hue carries meaning; the card stays calm.
 */
export function Tile({
  hue,
  icon: Icon,
  title,
  children,
  className = "",
}: {
  hue: Hue;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={`elevated rounded-card border-line bg-surface/85 border p-5 backdrop-blur-xl sm:p-6 ${className}`}
    >
      <header className="mb-4 flex items-center gap-3">
        <span className="rounded-control grid size-9 place-items-center" style={hueTint(hue, 18)}>
          <Icon aria-hidden className="size-4.5" strokeWidth={1.75} style={hueInk(hue)} />
        </span>
        <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
      </header>
      {children}
    </section>
  );
}
