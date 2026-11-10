// lib/theme/schema.ts
import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

export const ModeSeedSchema = z.object({
  bg: hex, // page background
  surface: hex, // card base, before style applies transparency
  text: hex, // primary text
  muted: hex, // secondary text
  accent: hex, // primary action and highlights
  accentStrong: hex, // pressed and gradient end
  glow: z.tuple([hex, hex]), // two colors for liquid blobs and glows
});

export const PaletteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  version: z.number().int().positive(),
  light: ModeSeedSchema,
  dark: ModeSeedSchema,
  chart: z.array(hex).length(6), // categorical colors for charts and chips
});

export type Palette = z.infer<typeof PaletteSchema>;
