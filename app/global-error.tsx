"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center p-6 font-sans">
        <section className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm">
            The application could not start this view. Your data is safe.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md border px-4 py-2 text-sm"
          >
            Try again
          </button>
        </section>
      </body>
    </html>
  );
}
