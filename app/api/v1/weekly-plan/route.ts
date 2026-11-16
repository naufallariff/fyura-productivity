import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, unauthorized } from "@/server/api/guard";
import { getWeeklyPlan } from "@/server/services/weekly-plan";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    return jsonRead({ items: await getWeeklyPlan(userId) });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
