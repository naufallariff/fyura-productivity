import { describe, expect, it } from "vitest";
import { STYLES, STYLES_BY_ID, STYLE_IDS, StyleSchema } from "@/lib/theme/styles";

describe("surface styles", () => {
  it("defines the six styles in order", () => {
    expect(STYLES.map((s) => s.id)).toEqual([...STYLE_IDS]);
  });

  it("validates every style against the schema", () => {
    for (const style of STYLES) {
      expect(StyleSchema.safeParse(style).success).toBe(true);
    }
  });

  it("only the liquid style uses slow motion and blobs", () => {
    const moving = STYLES.filter((s) => s.motion === "slow").map((s) => s.id);
    expect(moving).toEqual(["liquid"]);
    expect(STYLES_BY_ID.liquid.blobs).toBeGreaterThan(0);
    expect(STYLES_BY_ID.flat.blobs).toBe(0);
  });
});
