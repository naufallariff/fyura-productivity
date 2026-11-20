import type { ZodType } from "zod";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

type Params = Readonly<Record<string, string | number | undefined>>;

/**
 * GET with cancellation and runtime validation of the response.
 * Caching is the query client's job, not the browser's.
 */
export async function apiGet<T>(
  path: string,
  params: Params,
  schema: ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: "GET",
    signal,
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new ApiError(response.status);

  const json: unknown = await response.json();
  return schema.parse(json);
}
