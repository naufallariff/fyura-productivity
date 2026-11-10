import { describe, expect, it } from "vitest";
import { balanceScore } from "@/lib/scoring/balance";

describe("balanceScore", () => {
  it("returns 1 when actual shares match the plan exactly", () => {
    const plan = { WORSHIP: 40, LEARNING: 60 };
    expect(balanceScore({ WORSHIP: 80, LEARNING: 120 }, plan)).toBeCloseTo(1, 10);
  });

  it("returns 0.4 when all time falls in one planned-against category", () => {
    const score = balanceScore({ WORSHIP: 100 }, { WORSHIP: 40, LEARNING: 60 });
    expect(score).toBeCloseTo(0.4, 10);
  });

  it("ignores context categories", () => {
    const score = balanceScore({ WORSHIP: 40, LEARNING: 60, REST: 500 } as never, {
      WORSHIP: 40,
      LEARNING: 60,
    });
    expect(score).toBeCloseTo(1, 10);
  });

  it("returns null when there are no measured minutes", () => {
    expect(balanceScore({}, { WORSHIP: 40 })).toBeNull();
  });
});
