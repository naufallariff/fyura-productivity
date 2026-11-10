import { describe, expect, it } from "vitest";
import {
  DEFAULT_SELECTION,
  ThemeSelectionSchema,
  resolveMode,
  themeAttributes,
} from "@/lib/theme/resolve";
import { PALETTE_IDS } from "@/lib/theme/palettes";
import { STYLE_IDS } from "@/lib/theme/styles";

describe("theme selection", () => {
  it("defaults to flat, navy, dark", () => {
    expect(DEFAULT_SELECTION).toEqual({ style: "flat", palette: "navy", mode: "dark" });
    expect(ThemeSelectionSchema.safeParse(DEFAULT_SELECTION).success).toBe(true);
  });

  it("resolves system mode from the OS preference", () => {
    expect(resolveMode("system", true)).toBe("dark");
    expect(resolveMode("system", false)).toBe("light");
  });

  it("ignores the OS preference when mode is explicit", () => {
    expect(resolveMode("light", true)).toBe("light");
    expect(resolveMode("dark", false)).toBe("dark");
  });

  it("rejects an unknown palette or style", () => {
    expect(ThemeSelectionSchema.safeParse({ ...DEFAULT_SELECTION, palette: "neon" }).success).toBe(
      false,
    );
    expect(ThemeSelectionSchema.safeParse({ ...DEFAULT_SELECTION, style: "chrome" }).success).toBe(
      false,
    );
  });

  it("produces valid attributes for every combination of style, palette, and mode", () => {
    let count = 0;
    for (const style of STYLE_IDS) {
      for (const palette of PALETTE_IDS) {
        for (const mode of ["light", "dark", "system"] as const) {
          const selection = { style, palette, mode };
          expect(ThemeSelectionSchema.safeParse(selection).success).toBe(true);

          const attrs = themeAttributes(selection, true);
          expect(attrs["data-style"]).toBe(style);
          expect(attrs["data-palette"]).toBe(palette);
          expect(["light", "dark"]).toContain(attrs["data-mode"]);
          count++;
        }
      }
    }
    expect(count).toBe(5 * 6 * 3);
  });
});
