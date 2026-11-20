import { describe, expect, it } from "vitest";
import { BUNDLE_IDS, BUNDLES, DEFAULT_BUNDLE, DEFAULT_MODE, MODES } from "@/lib/theme/bundles";
import { buildThemeCss } from "@/lib/theme/css";
import { checkAll } from "@/lib/theme/validate";

describe("bundles", () => {
  it("ships exactly three bundles with unique ids and a light default", () => {
    expect(BUNDLE_IDS).toEqual(["ocean", "sage", "dusk"]);
    expect(new Set(BUNDLE_IDS).size).toBe(BUNDLE_IDS.length);
    expect(DEFAULT_BUNDLE).toBe("ocean");
    expect(DEFAULT_MODE).toBe("light");
  });

  it("keeps status colors and text out of bundle seeds", () => {
    for (const id of BUNDLE_IDS) {
      for (const mode of MODES) {
        const keys = Object.keys(BUNDLES[id][mode]);
        for (const forbidden of ["ink", "positive", "negative", "warning", "info"]) {
          expect(keys).not.toContain(forbidden);
        }
      }
    }
  });

  it("passes text and icon contrast for every bundle in both modes", () => {
    const failures = checkAll()
      .filter((result) => !result.ok)
      .map((f) => `${f.bundle}/${f.mode} ${f.pair}: ${f.ratio.toFixed(2)} below ${f.required}`);
    expect(failures).toEqual([]);
  });

  it("emits one css block per bundle and mode", () => {
    const css = buildThemeCss();
    const blocks = css.match(/data-bundle=/g) ?? [];
    expect(blocks).toHaveLength(BUNDLE_IDS.length * MODES.length);
    expect(css).toContain("--glass-solid");
    expect(css).toContain("--hue-sky");
  });
});
