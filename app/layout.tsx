import type { Metadata, Viewport } from "next";
import "./globals.css";
import { buildThemeCss } from "@/lib/theme/css";
import { getRequestTheme } from "@/lib/theme/server";
import { ThemeScript } from "@/components/theme/theme-script";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: { default: "Fyura Productivity", template: "%s · Fyura Productivity" },
  description: "Track the work that compounds.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function ThemedHtml({ children }: { children: React.ReactNode }) {
  await connection();
  const theme = await getRequestTheme();

  return (
    <html lang="en" data-style={theme.style} data-palette={theme.palette} data-mode={theme.mode}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: buildThemeCss() }} />
        <ThemeScript />
      </head>
      <body className="bg-bg text-text min-h-dvh font-sans antialiased">
        <span aria-hidden className="blob blob-a" />
        <span aria-hidden className="blob blob-b" />
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ThemedHtml>{children}</ThemedHtml>
    </Suspense>
  );
}
