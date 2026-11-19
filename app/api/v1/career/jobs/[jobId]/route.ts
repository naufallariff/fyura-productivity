// app/api/v1/career/jobs/[jobId]/route.ts
import { connection } from "next/server";
import { apiUserId, errorResponse, jsonRead, parseParam, unauthorized } from "@/server/api/guard";
import { consumeRateLimit } from "@/server/api/rate-limit";
import { getJob } from "@/server/services/career";

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  await connection();
  const requestId = request.headers.get("x-request-id");

  const userId = await apiUserId();
  if (!userId) return unauthorized();

  try {
    await consumeRateLimit(userId, "read");
    const jobId = parseParam((await params).jobId);
    return jsonRead(await getJob(userId, jobId));
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
