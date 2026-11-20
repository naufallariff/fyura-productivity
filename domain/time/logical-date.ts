const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/** Throws unless the value is a real calendar date in YYYY-MM-DD form. */
export function assertIsoDate(value: string): void {
  if (!ISO_DATE.test(value)) {
    throw new Error(`Invalid logical date format: ${value}`);
  }
  const ms = toUtcMs(value);
  if (new Date(ms).toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
}

function toUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  assertIsoDate(iso);
  return new Date(toUtcMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  assertIsoDate(from);
  assertIsoDate(to);
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** 1 = Monday ... 7 = Sunday, matching the Schedule convention in the design. */
export function isoWeekday(iso: string): number {
  assertIsoDate(iso);
  const day = new Date(toUtcMs(iso)).getUTCDay();
  return day === 0 ? 7 : day;
}
