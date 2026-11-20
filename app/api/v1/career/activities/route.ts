// app/api/v1/career/activities/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { getActivityRange } from "@/server/services/career";
import { ActivityRangeQuery } from "@/server/validation/career";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const range = parseQuery(ActivityRangeQuery, request.url);
    return jsonRead(await getActivityRange(userId, range));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
