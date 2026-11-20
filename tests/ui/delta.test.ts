import { describe, expect, it } from "vitest";
import { computeDelta } from "@/lib/ui/delta";

describe("computeDelta", () => {
  it("returns null without a baseline", () => {
    expect(computeDelta(10, null, "higher")).toBeNull();
  });

  it("marks a rise as positive when higher is better", () => {
    expect(computeDelta(25, 20, "higher")).toMatchObject({
      trend: "up",
      percent: 0.25,
      meaning: "positive",
      smallBase: false,
    });
  });

  it("marks a rise as negative when lower is better", () => {
    expect(computeDelta(25, 20, "lower")).toMatchObject({ trend: "up", meaning: "negative" });
  });

  it("keeps neutral metrics neutral in both directions", () => {
    expect(computeDelta(25, 20, "neutral")?.meaning).toBe("neutral");
    expect(computeDelta(5, 20, "neutral")?.meaning).toBe("neutral");
  });

  it("stays neutral and grey on a small base", () => {
    expect(computeDelta(1, 3, "higher")).toMatchObject({
      trend: "down",
      meaning: "neutral",
      smallBase: true,
    });
  });

  it("has no percentage when the previous value is zero", () => {
    expect(computeDelta(4, 0, "higher")).toMatchObject({ percent: null, smallBase: true });
  });

  it("reports flat changes as neutral", () => {
    expect(computeDelta(20, 20, "higher")).toMatchObject({ trend: "flat", meaning: "neutral" });
  });
});
