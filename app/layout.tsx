import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { QueryProvider } from "@/client/query/provider";
import { buildThemeCss } from "@/lib/theme/css";
import { getRequestTheme } from "@/lib/theme/server";

export const metadata: Metadata = {
  title: { default: "Fyura Productivity", template: "%s, Fyura Productivity" },
  description: "Track the work that compounds.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function ThemedDocument({ children }: { children: ReactNode }) {
  // Marks the render as request-time before the theme is read from the database.
  await connection();
  const theme = await getRequestTheme();

  return (
    <html lang="en" data-bundle={theme.bundle} data-mode={theme.mode}>
      <head>
        {/* Generated from code constants only, never from user input. */}
        <style dangerouslySetInnerHTML={{ __html: buildThemeCss() }} />
      </head>
      <body className="bg-canvas text-ink min-h-dvh font-sans antialiased">
        <div aria-hidden className="blobs">
          <span className="blob blob-a" />
          <span className="blob blob-b" />
          <span className="blob blob-c" />
        </div>
        <QueryProvider>
          <div className="relative z-10">{children}</div>
        </QueryProvider>
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ThemedDocument>{children}</ThemedDocument>
    </Suspense>
  );
}
