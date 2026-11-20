import type { ZodType } from "zod";
import { DomainError } from "@/server/services/errors";

/** Validates input at the boundary. Failures become DomainError with a stable code. */
export function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new DomainError("VALIDATION_FAILED", "Input is invalid");
  return result.data;
}
