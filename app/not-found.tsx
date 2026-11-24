import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <section className="w-full max-w-95 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-8 text-center shadow-(--shadow-card)">
        <p className="text-accent text-sm font-medium">404</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em]">This page is not here</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          The link may be outdated, or the page has not been built yet.
        </p>
        <Link
          href="/dashboard"
          className="bg-accent ease-spring mt-6 inline-flex rounded-lg px-4 py-3 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.97]"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
