import { deriveTokens, toCssVariables } from "./derive";
import { PALETTES } from "./palettes";
import type { Mode } from "./tokens";

/** Builds the full CSS block for every palette and mode, keyed by data attributes. */
export function buildThemeCss(): string {
  const blocks: string[] = [];

  for (const palette of PALETTES) {
    for (const mode of ["light", "dark"] as Mode[]) {
      const vars = toCssVariables(deriveTokens(palette, mode));
      const body = Object.entries(vars)
        .map(([name, value]) => `  ${name}: ${value};`)
        .join("\n");
      blocks.push(
        `[data-palette="${palette.id}"][data-mode="${mode}"] {\n  color-scheme: ${mode};\n${body}\n}`,
      );
    }
  }

  return blocks.join("\n\n");
}
