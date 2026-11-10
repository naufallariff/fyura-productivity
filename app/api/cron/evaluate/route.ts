import { env } from "@/lib/config/env";
import { isAuthorizedCron } from "@/lib/cron/auth";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  // The evaluation job is implemented in Phase 1.
  return Response.json({ job: "evaluate", status: "not-implemented" }, { status: 501 });
}
