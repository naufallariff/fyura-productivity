"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { t } from "@/lib/i18n";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest links this report to the matching server log line via requestId.
    Sentry.captureException(error, { tags: { digest: error.digest ?? "none" } });
  }, [error]);

  return (
    <section
      role="alert"
      className="elevated rounded-card border-line bg-surface mx-auto mt-16 max-w-md border p-8 text-center"
    >
      <h2 className="text-lg font-semibold">{t("error.title")}</h2>
      <p className="text-muted mt-2 text-sm leading-relaxed">{t("error.body")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-control bg-accent text-on-accent ease-spring mt-6 px-5 py-3 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
      >
        {t("error.retry")}
      </button>
    </section>
  );
}
