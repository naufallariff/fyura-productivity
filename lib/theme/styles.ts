import flat from "./styles/flat.json";
import gradient from "./styles/gradient.json";
import glass from "./styles/glass.json";
import liquid from "./styles/liquid.json";
import soft from "./styles/soft.json";
import mono from "./styles/mono.json";
import { StyleSchema, type SurfaceStyle, type StyleId } from "./style-schema";

export { StyleSchema };
export type { SurfaceStyle, StyleId };

export const STYLES: readonly SurfaceStyle[] = [flat, gradient, glass, liquid, soft, mono].map(
  (raw) => StyleSchema.parse(raw),
);

export const STYLE_IDS = STYLES.map((s) => s.id) as readonly StyleId[];

export const STYLES_BY_ID = Object.fromEntries(STYLES.map((s) => [s.id, s])) as Record<
  StyleId,
  SurfaceStyle
>;
