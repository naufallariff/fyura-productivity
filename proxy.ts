import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];
const PASS_THROUGH = ["/login", "/api/auth", "/api/cron"];
const PUBLIC_ICONS = ["/icon", "/apple-icon"];

function sentryOrigin(): string | undefined {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return undefined;
  const url = URL.parse(dsn);
  return url?.protocol === "https:" ? url.origin : undefined;
}

function contentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const sentry = sentryOrigin();
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    // Calendar geometry and drag previews use React style attributes.
    "style-src-attr 'unsafe-inline'",
    `connect-src 'self'${sentry ? ` ${sentry}` : ""}`,
    "img-src 'self' data: https://lh3.googleusercontent.com",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  // Always generated here, never trusted from the client, so logs cannot be spoofed.
  const requestId = crypto.randomUUID();
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(nonce);

  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);

  const { pathname } = request.nextUrl;
  const isPassThrough =
    PUBLIC_ICONS.includes(pathname) ||
    PASS_THROUGH.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  const response =
    isPassThrough || hasSession
      ? NextResponse.next({ request: { headers } })
      : NextResponse.redirect(new URL("/login", request.url));
  response.headers.set("x-request-id", requestId);
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (pathname === "/private") response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
