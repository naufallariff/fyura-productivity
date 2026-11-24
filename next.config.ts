import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      { source: "/today", destination: "/daily-tracker", permanent: false },
      { source: "/habits", destination: "/daily-tracker", permanent: false },
      { source: "/focus", destination: "/daily-tracker", permanent: false },
      { source: "/calendar", destination: "/daily-tracker", permanent: false },
      { source: "/plan", destination: "/weekly-plan", permanent: false },
      { source: "/review", destination: "/learning", permanent: false },
      { source: "/tadabur", destination: "/journal", permanent: false },
      { source: "/notifications", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
