import { contrastRatio } from "./color";

/** WCAG AA for normal text. Large text and non-text components use a 3:1 minimum. */
export function validateContrast(fg: string, bg: string): { ratio: number; passes: boolean } {
  const ratio = contrastRatio(fg, bg);
  return { ratio, passes: ratio >= 4.5 };
}
