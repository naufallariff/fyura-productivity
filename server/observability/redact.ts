const REDACTED = "[REDACTED]";

// Keys that must never reach logs or error reports.
const SENSITIVE_KEY = /token|secret|password|cookie|authorization|pin|email|^code$/i;

const MAX_DEPTH = 5;

/** Returns a copy of the value with every sensitive key replaced. Never mutates the input. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(inner, depth + 1);
    }
    return out;
  }
  return value;
}
