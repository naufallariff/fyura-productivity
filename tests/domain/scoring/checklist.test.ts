import { describe, expect, it } from "vitest";
import { scoreChecklistDay, weeklyChecklistRatio } from "@/domain/scoring/checklist";

const entry = (required: boolean, core: boolean, done: boolean) => ({ required, core, done });

describe("scoreChecklistDay", () => {
  it("counts only required items on a normal day", () => {
    const score = scoreChecklistDay("2026-11-02", "NORMAL", [
      entry(true, false, true),
      entry(true, true, false),
      entry(false, false, true),
    ]);
    expect(score).toMatchObject({ planned: 2, completed: 1, ratio: 0.5 });
  });

  it("plans nothing on a sick day", () => {
    const score = scoreChecklistDay("2026-11-02", "SICK", [entry(true, true, true)]);
    expect(score).toMatchObject({ planned: 0, ratio: null });
  });

  it("counts only core items on an off day", () => {
    const score = scoreChecklistDay("2026-11-02", "OFF", [
      entry(true, true, true),
      entry(true, false, false),
    ]);
    expect(score).toMatchObject({ planned: 1, completed: 1, ratio: 1 });
  });
});

describe("weeklyChecklistRatio", () => {
  it("weights by planned slots: 8 of 14", () => {
    const days = [
      { date: "a", status: "NORMAL" as const, planned: 4, completed: 3, ratio: 0.75 },
      { date: "b", status: "NORMAL" as const, planned: 10, completed: 5, ratio: 0.5 },
    ];
    expect(weeklyChecklistRatio(days)).toBeCloseTo(8 / 14, 10);
  });

  it("returns null when nothing is planned", () => {
    expect(weeklyChecklistRatio([])).toBeNull();
  });
});
