import type { ReactNode } from "react";

/** Page width and padding. Every page starts with this. */
export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-450 px-4 pt-6 pb-10 sm:px-6 lg:px-8 lg:pt-8">
      {children}
    </div>
  );
}

/** Title, lead paragraph, and page-level actions. Each page owns its own header. */
export function PageHeader({
  title,
  lead,
  actions,
}: {
  title: string;
  lead?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0 space-y-2">
        <h1 className="text-ink text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{title}</h1>
        {lead && <p className="text-ink-muted max-w-2xl text-sm leading-relaxed">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
