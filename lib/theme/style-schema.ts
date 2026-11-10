import { z } from "zod";

export const STYLE_IDS = ["flat", "gradient", "glass", "liquid", "soft", "mono"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const StyleSchema = z.object({
  id: z.enum(STYLE_IDS),
  name: z.string().min(1),
  description: z.string().min(1),
  background: z.enum(["solid", "gradient", "glow"]),
  surfaceAlpha: z.number().min(0).max(1),
  blurPx: z.number().min(0).max(40),
  shadow: z.enum(["none", "hairline", "soft", "raised"]),
  motion: z.enum(["none", "slow"]),
  blobs: z.number().int().min(0).max(3),
});

export type SurfaceStyle = z.infer<typeof StyleSchema>;
