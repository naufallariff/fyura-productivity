import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor, toPage } from "@/server/db/cursor";

const ID = "11111111-1111-4111-8111-111111111111";
const AT = "2026-11-01T10:00:00.000Z";

describe("cursor", () => {
  it("round-trips a cursor", () => {
    expect(decodeCursor(encodeCursor({ at: AT, id: ID }))).toEqual({ at: AT, id: ID });
  });

  it("rejects a tampered cursor", () => {
    expect(() => decodeCursor("not-a-cursor")).toThrow(/Cursor/);
  });

  it("returns no cursor when the last page is reached", () => {
    const rows = [{ id: ID }];
    expect(toPage(rows, 25, () => ({ at: AT, id: ID })).nextCursor).toBeNull();
  });

  it("returns a cursor when one extra row proves another page exists", () => {
    const rows = [{ id: ID }, { id: ID }];
    const page = toPage(rows, 1, () => ({ at: AT, id: ID }));
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
  });
});
