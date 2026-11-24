import { isAuthorizedCron } from "@/server/cron/auth";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  // The evaluation job is implemented in Phase 1.
  return Response.json({ job: "evaluate", status: "not-implemented" }, { status: 501 });
}
