import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor, toPage } from "@/server/db/cursor";

const ID = "11111111-1111-4111-8111-111111111111";

describe("cursor", () => {
  it("round-trips a key and an id", () => {
    expect(decodeCursor(encodeCursor({ key: "2026-11-02|0540", id: ID }))).toEqual({
      key: "2026-11-02|0540",
      id: ID,
    });
  });

  it("rejects a tampered cursor", () => {
    expect(() => decodeCursor("not-a-cursor")).toThrow(/Cursor/);
  });

  it("returns no cursor when the last page is reached", () => {
    const page = toPage([{ id: ID }], 25, () => ({ key: "k", id: ID }));
    expect(page.nextCursor).toBeNull();
  });

  it("returns a cursor when one extra row proves another page exists", () => {
    const page = toPage([{ id: ID }, { id: ID }], 1, () => ({ key: "k", id: ID }));
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
  });
});
