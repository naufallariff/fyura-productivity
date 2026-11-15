import { describe, expect, it } from "vitest";
import {
  CreateHabitInput,
  CreateTimeBlockInput,
  HabitCheckInput,
  SetDayStatusInput,
} from "@/lib/validation/daily";

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

  it("rejects negative habit values", () => {
    expect(
      HabitCheckInput.safeParse({
        habitId: "11111111-1111-4111-8111-111111111111",
        logDate: "2026-10-06",
        value: -1,
      }).success,
    ).toBe(false);
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

  it("rejects a habit with an invalid key", () => {
    expect(
      CreateHabitInput.safeParse({
        key: "Prayer Five",
        name: "x",
        category: "WORSHIP",
        kind: "BINARY",
        target: 1,
      }).success,
    ).toBe(false);
  });
});
