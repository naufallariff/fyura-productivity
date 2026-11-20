import { describe, expect, it } from "vitest";
import { dueState } from "@/domain/projects/due";

describe("dueState", () => {
  const today = "2026-11-20";

  it("reports none when there is no due date", () => {
    expect(dueState(null, false, today)).toBe("none");
  });

  it("reports complete before any date comparison", () => {
    expect(dueState("2026-11-01", true, today)).toBe("complete");
  });

  it("reports overdue, today, and upcoming", () => {
    expect(dueState("2026-11-19", false, today)).toBe("overdue");
    expect(dueState("2026-11-20", false, today)).toBe("today");
    expect(dueState("2026-11-21", false, today)).toBe("upcoming");
  });
});
