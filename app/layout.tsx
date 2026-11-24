import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { QueryProvider } from "@/client/query/provider";
import { buildThemeCss } from "@/lib/theme/css";
import { getRequestTheme } from "@/lib/theme/server";

const themeCss = buildThemeCss();

export const metadata: Metadata = {
  title: { default: "Fyura Productivity", template: "%s, Fyura Productivity" },
  description: "Track the work that compounds.",
  robots: { index: false, follow: false },
};

export async function generateViewport(): Promise<Viewport> {
  // Make the document request-time so its bootstrap scripts share the CSP nonce.
  await connection();
  return { width: "device-width", initialScale: 1, viewportFit: "cover" };
}

async function ThemedDocument({ children }: { children: ReactNode }) {
  // Marks the render as request-time before the theme is read from the database.
  await connection();
  const [theme, requestHeaders] = await Promise.all([getRequestTheme(), headers()]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  return (
    <html lang="en" data-bundle={theme.bundle} data-mode={theme.mode}>
      <head>
        {/* Generated from code constants only, never from user input. */}
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="bg-canvas text-ink min-h-dvh font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
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
