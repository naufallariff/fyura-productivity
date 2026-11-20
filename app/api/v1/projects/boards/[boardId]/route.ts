// app/api/v1/projects/boards/[boardId]/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseParam, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { getBoardSnapshot } from "@/server/services/projects";

export async function GET(request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const boardId = parseParam((await params).boardId);
    return jsonRead(await getBoardSnapshot(userId, boardId));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
