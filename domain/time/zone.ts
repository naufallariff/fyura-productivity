// domain/time/zone.ts
/** True when the runtime knows the IANA zone name, for example "Asia/Jakarta". */
export function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions();
    return true;
  } catch {
    return false;
  }
}
