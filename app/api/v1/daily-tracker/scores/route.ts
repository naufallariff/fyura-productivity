import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { getChecklistScores } from "@/server/services/checklist";
import { ChecklistScoresQuery } from "@/server/validation/daily-tracker";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    const { from, to } = parseQuery(ChecklistScoresQuery, request.url);
    return jsonRead({ days: await getChecklistScores(userId, from, to) });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
