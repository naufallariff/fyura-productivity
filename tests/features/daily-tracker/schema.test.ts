import { describe, expect, it } from "vitest";
import {
  CreateTimeBlockInput,
  MoveTimeBlockInput,
  SetDayStatusInput,
} from "@/server/validation/daily";

describe("daily validation", () => {
  it("accepts a valid day status", () => {
    expect(SetDayStatusInput.safeParse({ logDate: "2026-10-06", status: "SICK" }).success).toBe(
      true,
    );
  });

  it("rejects an unknown day status", () => {
    expect(SetDayStatusInput.safeParse({ logDate: "2026-10-06", status: "HOLIDAY" }).success).toBe(
      false,
    );
  });

  it("rejects a malformed date", () => {
    expect(SetDayStatusInput.safeParse({ logDate: "06-10-2026", status: "NORMAL" }).success).toBe(
      false,
    );
  });

  it("rejects unknown fields on a time block (strict schema)", () => {
    const result = CreateTimeBlockInput.safeParse({
      logDate: "2026-10-06",
      startMinute: 540,
      durationMinutes: 60,
      category: "LEARNING",
      activity: "Reading",
      userId: "attacker",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a move whose end is not after its start", () => {
    const result = MoveTimeBlockInput.safeParse({
      blockId: "11111111-1111-4111-8111-111111111111",
      startMinute: 600,
      endMinute: 600,
    });
    expect(result.success).toBe(false);
  });
});
