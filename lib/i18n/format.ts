import { DEFAULT_LOCALE, type Locale } from "./index";

/** Formats a ratio (0 to 1) as a percentage, for example 0.75 becomes "75%". */
export function formatPercent(
  ratio: number,
  locale: Locale = DEFAULT_LOCALE,
  options: { signed?: boolean; digits?: number } = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: options.digits ?? 1,
    signDisplay: options.signed ? "exceptZero" : "auto",
  }).format(ratio);
}

/** Formats a difference in percentage points, for example 1.2 becomes "+1.2". */
export function formatPoints(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(value);
}
