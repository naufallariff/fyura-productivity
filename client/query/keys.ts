export const PRIVATE_SCOPE = "private";

/**
 * Every key starts with the user id, so one user's cache can never be read
 * under another user's session.
 */
export function scopedKey<S extends string>(userId: string, scope: S, ...rest: readonly unknown[]) {
  return [scope, userId, ...rest] as const;
}
