import type { Metadata, Viewport } from "next";
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
    <html lang="en" data-theme="ocean">
      <body className="bg-bg text-text min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
