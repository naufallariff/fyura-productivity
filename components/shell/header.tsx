import { Bell, Search } from "lucide-react";

export function Header({ title, email }: { title: string; email: string | null }) {
  return (
    <header className="border-line bg-bg/80 sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur-xl sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-semibold tracking-[-0.01em]">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="text-muted hover:bg-surface-raised hidden size-10 place-items-center rounded-full transition-colors sm:grid"
        >
          <Search aria-hidden className="size-4.5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="text-muted hover:bg-surface-raised grid size-10 place-items-center rounded-full transition-colors"
        >
          <Bell aria-hidden className="size-4.5" strokeWidth={1.75} />
        </button>
        {email && (
          <span className="text-muted hidden max-w-48 truncate text-sm lg:inline" title={email}>
            {email}
          </span>
        )}
      </div>
    </header>
  );
}
