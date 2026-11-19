// app/api/v1/capture/ideas/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { listIdeas } from "@/server/services/capture";
import { IdeasQuery } from "@/server/validation/capture";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const query = parseQuery(IdeasQuery, request.url);
    return jsonRead(await listIdeas(userId, query));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
