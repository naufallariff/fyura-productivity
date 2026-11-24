// domain/time/mini-month.ts

/** Six rows of seven cells, Monday first. Days outside the month are null. */
export function monthCells(year: number, month: number): Array<string | null> {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("month must be an integer from 1 to 12");
  }

  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = (firstDay + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;

  const cells: Array<string | null> = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${prefix}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length < 42) cells.push(null);
  return cells;
}

/** Shifts a "YYYY-MM" value by whole months. */
export function shiftMonth(yearMonth: string, delta: number): string {
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid year-month: ${yearMonth}`);
  }
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}`;
}
