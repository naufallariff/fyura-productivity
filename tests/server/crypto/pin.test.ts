import { describe, expect, it } from "vitest";
import { hashPin, isValidPin, verifyPin } from "@/lib/crypto/pin";

const PEPPER = "p".repeat(32);

describe("pin hashing", () => {
  it("accepts only exactly six digits", () => {
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a456")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });

  it("verifies the correct PIN", async () => {
    const stored = await hashPin("204681", PEPPER);
    expect(await verifyPin("204681", stored, PEPPER)).toBe(true);
  });

  it("rejects a wrong PIN", async () => {
    const stored = await hashPin("204681", PEPPER);
    expect(await verifyPin("204682", stored, PEPPER)).toBe(false);
  });

  it("rejects the correct PIN when the pepper differs", async () => {
    const stored = await hashPin("204681", PEPPER);
    expect(await verifyPin("204681", stored, "q".repeat(32))).toBe(false);
  });

  it("does not store the PIN in plain text", async () => {
    const stored = await hashPin("204681", PEPPER);
    expect(stored).not.toContain("204681");
    expect(stored.startsWith("$argon2id$")).toBe(true);
  });

  it("returns false for a malformed stored hash instead of throwing", async () => {
    expect(await verifyPin("204681", "not-a-hash", PEPPER)).toBe(false);
  });
});
