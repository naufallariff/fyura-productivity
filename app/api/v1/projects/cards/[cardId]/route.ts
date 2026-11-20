// app/api/v1/projects/cards/[cardId]/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseParam, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { getCard } from "@/server/services/projects";

export async function GET(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const cardId = parseParam((await params).cardId);
    return jsonRead(await getCard(userId, cardId));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
