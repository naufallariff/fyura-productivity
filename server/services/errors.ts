// server/services/errors.ts
export type DomainErrorCode =
  "VALIDATION_FAILED" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "PRIVATE_LOCKED" | "INTERNAL";

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
