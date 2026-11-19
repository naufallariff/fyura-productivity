// app/api/v1/career/board/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { listActiveJobsBoard } from "@/server/services/career";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    return jsonRead({ items: await listActiveJobsBoard(userId) });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
