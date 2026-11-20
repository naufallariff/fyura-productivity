import { describe, expect, it } from "vitest";
import { DEFAULT_SELECTION, parseSelection } from "@/lib/theme/resolve";

describe("parseSelection", () => {
  it("accepts a valid bundle and mode", () => {
    expect(parseSelection({ bundle: "sage", mode: "dark" })).toEqual({
      bundle: "sage",
      mode: "dark",
    });
  });

  it("falls back to the default for unknown values", () => {
    expect(parseSelection({ bundle: "rose", mode: "dark" })).toEqual(DEFAULT_SELECTION);
  });

  it("rejects extra fields instead of ignoring them", () => {
    expect(parseSelection({ bundle: "ocean", mode: "light", style: "glass" })).toEqual(
      DEFAULT_SELECTION,
    );
  });

  it("falls back for null and non-object input", () => {
    expect(parseSelection(null)).toEqual(DEFAULT_SELECTION);
    expect(parseSelection("ocean")).toEqual(DEFAULT_SELECTION);
  });
});
