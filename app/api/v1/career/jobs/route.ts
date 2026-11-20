// app/api/v1/career/jobs/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { listJobs } from "@/server/services/career";
import { JobsQuery } from "@/server/validation/career";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const query = parseQuery(JobsQuery, request.url);
    return jsonRead(await listJobs(userId, query));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
