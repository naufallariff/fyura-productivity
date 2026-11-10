"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook for Sentry in Batch E. Only the digest is logged, never user data.
    console.error("Route error", error.digest ?? "unknown");
  }, [error]);

  return (
    <section
      role="alert"
      className="elevated rounded-card border-line bg-surface mx-auto mt-16 max-w-md border p-8 text-center"
    >
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted mt-2 text-sm leading-relaxed">
        This section could not be loaded. Your data is safe.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-control bg-accent text-on-accent ease-spring mt-6 px-5 py-3 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
      >
        Try again
      </button>
    </section>
  );
}
