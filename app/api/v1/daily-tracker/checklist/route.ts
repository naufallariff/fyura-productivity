import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { getChecklist } from "@/server/services/checklist";
import { ChecklistDayQuery } from "@/server/validation/daily-tracker";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    const { date } = parseQuery(ChecklistDayQuery, request.url);
    return jsonRead(await getChecklist(userId, date));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
