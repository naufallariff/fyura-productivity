// app/api/v1/projects/boards/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { listBoards } from "@/server/services/projects";
import { BoardsQuery } from "@/server/validation/projects";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const query = parseQuery(BoardsQuery, request.url);
    return jsonRead(await listBoards(userId, query));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
