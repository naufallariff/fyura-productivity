import { z } from "zod";
import { PALETTE_IDS, DEFAULT_PALETTE_ID } from "./palettes";
import { STYLE_IDS } from "./styles";
import type { Mode } from "./tokens";

export const ThemeSelectionSchema = z.object({
  style: z.enum(STYLE_IDS),
  palette: z.string().refine((id) => PALETTE_IDS.includes(id), "Unknown palette"),
  mode: z.enum(["light", "dark", "system"]),
});

export type ThemeSelection = z.infer<typeof ThemeSelectionSchema>;

/** Default: flat style, Navy palette, dark mode. */
export const DEFAULT_SELECTION: ThemeSelection = {
  style: "flat",
  palette: DEFAULT_PALETTE_ID,
  mode: "dark",
};

export function resolveMode(mode: ThemeSelection["mode"], systemPrefersDark: boolean): Mode {
  if (mode === "system") return systemPrefersDark ? "dark" : "light";
  return mode;
}

/** Attributes for <html>. CSS in T3 reads these to apply style, palette, and mode. */
export function themeAttributes(
  selection: ThemeSelection,
  systemPrefersDark: boolean,
): Record<"data-style" | "data-palette" | "data-mode", string> {
  return {
    "data-style": selection.style,
    "data-palette": selection.palette,
    "data-mode": resolveMode(selection.mode, systemPrefersDark),
  };
}
