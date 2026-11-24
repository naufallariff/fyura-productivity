export interface Oklch {
  readonly lightness: number;
  readonly chroma: number;
  readonly hue: number;
}

const NUMBER = "[+-]?(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)(?:e[+-]?[0-9]+)?";
const OKLCH = new RegExp(
  `^oklch\\(\\s*(${NUMBER}%?)\\s+(${NUMBER}%?)\\s+(${NUMBER})(?:deg)?\\s*\\)$`,
  "i",
);

export function parseOklch(value: string): Oklch {
  const [, lightness, chroma, hue] = OKLCH.exec(value.trim()) ?? [];
  if (!lightness || !chroma || !hue) throw new Error(`Expected an opaque OKLCH color: ${value}`);

  const l = lightness.endsWith("%") ? Number.parseFloat(lightness) / 100 : Number(lightness);
  const c = chroma.endsWith("%") ? Number.parseFloat(chroma) * 0.004 : Number(chroma);
  const h = Number(hue);
  if (
    !Number.isFinite(l) ||
    !Number.isFinite(c) ||
    !Number.isFinite(h) ||
    l < 0 ||
    l > 1 ||
    c < 0
  ) {
    throw new Error(`Invalid OKLCH color: ${value}`);
  }
  return { lightness: l, chroma: c, hue: h };
}

export function formatOklch({ lightness, chroma, hue }: Oklch, alpha?: number): string {
  return `oklch(${lightness} ${chroma} ${hue}${alpha === undefined ? "" : ` / ${alpha}`})`;
}

function linearSrgb({ lightness, chroma, hue }: Oklch): [number, number, number] {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inSrgb(color: Oklch): boolean {
  return linearSrgb(color).every((channel) => channel >= -1e-7 && channel <= 1 + 1e-7);
}

/** Keep the hue and lightness while fitting the color to the sRGB gamut. */
export function fitSrgb(color: Oklch): Oklch {
  if (inSrgb(color)) return color;

  let low = 0;
  let high = Math.min(color.chroma, 0.5);
  for (let step = 0; step < 20; step++) {
    const chroma = (low + high) / 2;
    if (inSrgb({ ...color, chroma })) low = chroma;
    else high = chroma;
  }
  return { ...color, chroma: Math.floor(low * 1e6) / 1e6 };
}

/** The OKLab conversion produces linear sRGB, which WCAG weights directly. */
export function relativeLuminance(value: string): number {
  const [red, green, blue] = linearSrgb(fitSrgb(parseOklch(value)));
  const clamp = (channel: number) => Math.min(1, Math.max(0, channel));
  return 0.2126 * clamp(red) + 0.7152 * clamp(green) + 0.0722 * clamp(blue);
}

export function contrastRatio(fg: string, bg: string): number {
  const foreground = relativeLuminance(fg);
  const background = relativeLuminance(bg);
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}
