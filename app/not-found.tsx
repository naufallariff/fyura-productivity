import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <section className="elevated rounded-card border-line bg-surface w-full max-w-95 border p-8 text-center">
        <p className="text-accent text-sm font-medium">404</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em]">This page is not here</h1>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          The link may be outdated, or the page has not been built yet.
        </p>
        <Link
          href="/dashboard"
          className="rounded-control bg-accent ease-spring mt-6 inline-flex px-5 py-3 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.97]"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
