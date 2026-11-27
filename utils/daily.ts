export function clock(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function parseClock(value: string) {
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? `${hours}h` : "", remainder || !hours ? `${remainder}m` : ""]
    .filter(Boolean)
    .join(" ");
}

export function occupiedMinutes(blocks: readonly { start: number; end: number }[]) {
  let edge = 0;
  let total = 0;
  for (const { start, end } of [...blocks].sort((a, b) => a.start - b.start)) {
    total += Math.max(0, end - Math.max(edge, start));
    edge = Math.max(edge, end);
  }
  return total;
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
