/** Lowercases and trims an email address for comparison. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Returns true only if the email is non-empty and appears in the allowlist. */
export function isAllowedEmail(email: string, allowed: readonly string[]): boolean {
  const normalized = normalizeEmail(email);
  if (normalized.length === 0) return false;
  return allowed.map(normalizeEmail).includes(normalized);
}
