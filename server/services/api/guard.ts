import { auth } from "@/server/auth/auth";

/** Session check for route handlers. Returns null instead of redirecting. */
export async function apiUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized(): Response {
  return Response.json(
    { error: "UNAUTHORIZED", message: "Sign in required." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}
