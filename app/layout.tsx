import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Fyura Productivity", template: "%s · Fyura Productivity" },
  description: "Track daily routines, learning, and projects without judgment.",
  robots: { index: false, follow: false }, // data pribadi, jangan diindeks
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
