import { describe, expect, it } from "vitest";
import { weekOf } from "@/domain/time/week";

describe("weekOf", () => {
  it("returns Monday to Sunday for a midweek date", () => {
    const week = weekOf("2026-11-04");
    expect(week[0]).toBe("2026-11-02");
    expect(week[6]).toBe("2026-11-08");
    expect(week).toHaveLength(7);
  });

  it("treats Sunday as the last day of its week", () => {
    expect(weekOf("2026-11-08")[0]).toBe("2026-11-02");
  });
});
