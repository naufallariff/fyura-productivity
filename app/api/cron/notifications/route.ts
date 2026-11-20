import { env } from "@/server/config/env";
import { isAuthorizedCron } from "@/server/cron/auth";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  // The notification worker is implemented in Phase 5.
  return Response.json({ job: "notifications", status: "not-implemented" }, { status: 501 });
}
