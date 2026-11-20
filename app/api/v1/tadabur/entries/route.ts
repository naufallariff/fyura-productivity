// app/api/v1/tadabur/entries/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { listTadabur } from "@/server/services/tadabur";
import { TadaburQuery } from "@/server/validation/tadabur";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const query = parseQuery(TadaburQuery, request.url);
    return jsonRead(await listTadabur(userId, query));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
