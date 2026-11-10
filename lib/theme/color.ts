/** Pure color utilities: hex parsing, mixing, and WCAG contrast. No dependencies. */

export type Rgb = { r: number; g: number; b: number };

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

export function parseHex(hex: string): Rgb {
  const match = HEX_PATTERN.exec(hex);
  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const n = Number.parseInt(match[1] ?? "", 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Linear interpolation in sRGB. t = 0 returns a, t = 1 returns b. */
export function mix(a: string, b: string, t: number): string {
  const from = parseHex(a);
  const to = parseHex(b);
  const k = Math.min(1, Math.max(0, t));
  return toHex({
    r: from.r + (to.r - from.r) * k,
    g: from.g + (to.g - from.g) * k,
    b: from.b + (to.b - from.b) * k,
  });
}

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance, from 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** WCAG contrast ratio, from 1 (no contrast) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}
