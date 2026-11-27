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
      <ul className="fyura-tabs">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "fyura-tab focus-visible:ring-accent transition-colors duration-180 focus-visible:ring-2",
                !item.active && "hover:text-ink",
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
