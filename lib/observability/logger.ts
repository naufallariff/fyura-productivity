import "server-only";
import { redact } from "./redact";

type Level = "info" | "warn" | "error";

/** Emits one JSON line per event. Fields are redacted before they leave the process. */
export function logEvent(
  level: Level,
  message: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(redact(fields) as Record<string, unknown>),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
