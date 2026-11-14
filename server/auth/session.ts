import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "./auth";

/**
 * Verifies the session on the server and returns the current user.
 * Redirects to /login when there is no valid session.
 *
 * `connection()` must run first. It marks the render as request-time, so
 * auth (which touches crypto) is never evaluated during prerendering.
 */
export async function requireUser(): Promise<{ id: string; email: string | null }> {
  await connection();

  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return { id, email: session.user.email ?? null };
}
