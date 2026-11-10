import type { Metadata, Viewport } from "next";
import { buildThemeCss } from "@/lib/theme/css";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-style="flat" data-palette="navy" data-mode="dark">
      <head>
        <style dangerouslySetInnerHTML={{ __html: buildThemeCss() }} />
      </head>
      <body className="bg-bg text-text min-h-dvh font-sans antialiased">
        <span aria-hidden className="blob blob-a" />
        <span aria-hidden className="blob blob-b" />
        {children}
      </body>
    </html>
  );
}
