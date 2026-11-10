import navy from "./palettes/navy.json";
import forest from "./palettes/forest.json";
import rose from "./palettes/rose.json";
import midnightTeal from "./palettes/midnight-teal.json";
import auroraFrost from "./palettes/aurora-frost.json";
import { PaletteSchema, type Palette } from "./schema";

const RAW = [navy, forest, rose, midnightTeal, auroraFrost];

export const PALETTES: readonly Palette[] = RAW.map((raw) => PaletteSchema.parse(raw));
export const PALETTE_IDS = PALETTES.map((p) => p.id);
export const DEFAULT_PALETTE_ID = "navy";

export function getPalette(id: string): Palette {
  const palette = PALETTES.find((p) => p.id === id);
  if (!palette) throw new Error(`Unknown palette: ${id}`);
  return palette;
}
