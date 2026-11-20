// app/api/v1/projects/lists/[listId]/cards/route.ts
import { connection } from "next/server";
import {
  apiUserId,
  errorResponse,
  jsonRead,
  parseParam,
  parseQuery,
  unauthorized,
} from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { listCards } from "@/server/services/projects";
import { CardsQuery } from "@/server/validation/projects";

export async function GET(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const listId = parseParam((await params).listId);
    const query = parseQuery(CardsQuery, request.url);
    return jsonRead(await listCards(userId, listId, query));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
