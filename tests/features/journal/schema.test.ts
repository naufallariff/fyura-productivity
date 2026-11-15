import { describe, expect, it } from "vitest";
import { CreateJournalInput } from "@/lib/validation/journal";

const base = { logDate: "2026-10-27", kind: "LEARNING", title: "", body: "Notes" };

describe("CreateJournalInput", () => {
  it("accepts a valid entry with an empty title", () => {
    expect(CreateJournalInput.safeParse(base).success).toBe(true);
  });

  it("rejects an empty body after trimming", () => {
    expect(CreateJournalInput.safeParse({ ...base, body: "   " }).success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(CreateJournalInput.safeParse({ ...base, kind: "MOOD" }).success).toBe(false);
  });

  it("rejects an injected owner field", () => {
    expect(CreateJournalInput.safeParse({ ...base, userId: "x" }).success).toBe(false);
  });
});
