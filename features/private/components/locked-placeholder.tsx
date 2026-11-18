import { Lock } from "lucide-react";

export function LockedPlaceholder() {
  return (
    <section className="rounded-card border-line glass border p-8 text-center">
      <div className="bg-ink/5 text-accent mx-auto grid size-12 place-items-center rounded-2xl">
        <Lock aria-hidden className="size-5" strokeWidth={1.75} />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em]">Private space is locked</h2>
      <p className="text-ink-muted mt-1 text-sm">Enter your PIN to open it.</p>
    </section>
  );
}
