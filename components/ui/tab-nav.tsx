import Link from "next/link";
import { cn } from "@/lib/ui/cn";

export interface TabItem {
  readonly href: string;
  readonly label: string;
  readonly active: boolean;
}

/** Route tabs. Server-safe: no client code. Active tab is marked with aria-current. */
export function TabNav({ label, items }: { label: string; items: readonly TabItem[] }) {
  return (
    <nav aria-label={label}>
      <ul className="border-line inline-flex flex-wrap gap-1 rounded-full border bg-(--bg-surface) p-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-accent inline-flex min-h-9 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 focus-visible:ring-2",
                item.active ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
