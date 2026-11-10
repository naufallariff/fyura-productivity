import { describe, expect, it } from "vitest";
import { computeLockUntil } from "@/lib/private/lockout";

const NOW = new Date("2026-01-01T00:00:00Z");
const minutesFromNow = (d: Date | null) =>
  d === null ? null : (d.getTime() - NOW.getTime()) / 60_000;

describe("computeLockUntil", () => {
  it("does not lock before the fifth failure", () => {
    expect(computeLockUntil(0, NOW)).toBeNull();
    expect(computeLockUntil(4, NOW)).toBeNull();
  });

  it("locks for 5 minutes at the fifth failure", () => {
    expect(minutesFromNow(computeLockUntil(5, NOW))).toBe(5);
  });

  it("doubles the lock on each further failure", () => {
    expect(minutesFromNow(computeLockUntil(6, NOW))).toBe(10);
    expect(minutesFromNow(computeLockUntil(7, NOW))).toBe(20);
    expect(minutesFromNow(computeLockUntil(8, NOW))).toBe(40);
  });

  it("caps the lock at 60 minutes", () => {
    expect(minutesFromNow(computeLockUntil(9, NOW))).toBe(60);
    expect(minutesFromNow(computeLockUntil(20, NOW))).toBe(60);
  });
});
