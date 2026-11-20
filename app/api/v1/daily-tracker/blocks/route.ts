// app/api/v1/daily-tracker/blocks/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseQuery, unauthorized } from "@/server/api/guard";
import { getCalendarBlocks } from "@/server/services/calendar";
import { CalendarRangeQuery } from "@/server/validation/daily-tracker";

export async function GET(request: Request) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    const range = parseQuery(CalendarRangeQuery, request.url);
    return jsonRead({ items: await getCalendarBlocks(userId, range) });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
