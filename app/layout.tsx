import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/workspace.css";

// The proxy attaches a per-request CSP nonce to Next's scripts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fyura Productivity",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
