import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Verifies the session on the server and returns the current user.
 * Redirects to /login when there is no valid session.
 * Use this in every server component, layout, and server action that reads user data.
 */
export async function requireUser(): Promise<{ id: string; email: string | null }> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return { id, email: session.user.email ?? null };
}
