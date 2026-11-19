// app/api/v1/learning/reviews/due/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { listDueReviews } from "@/server/services/learning";
import { DueQuery } from "@/server/validation/learning";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const query = parseQuery(DueQuery, request.url);
    return jsonRead({ items: await listDueReviews(userId, query) });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
