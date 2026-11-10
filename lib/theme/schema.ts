// lib/theme/schema.ts
import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

export const ModeSeedSchema = z.object({
  bg: hex,
  surface: hex,
  text: hex,
  muted: hex,
  accent: hex,
  accentStrong: hex,
  danger: hex,
  glow: z.tuple([hex, hex]),
});

export const PaletteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  version: z.number().int().positive(),
  light: ModeSeedSchema,
  dark: ModeSeedSchema,
  chart: z.array(hex).length(6),
});

export type Palette = z.infer<typeof PaletteSchema>;
