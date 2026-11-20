import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { listTimeBlockHistory } from "@/server/services/history";
import { HistoryQuery } from "@/server/validation/daily-tracker";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    const query = parseQuery(HistoryQuery, request.url);
    return jsonRead(await listTimeBlockHistory(userId, query));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
