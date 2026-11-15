import { describe, expect, it } from "vitest";
import { scopedKey } from "@/client/query/keys";

describe("scopedKey", () => {
  it("keeps two users' keys apart even for the same scope and arguments", () => {
    expect(scopedKey("user-1", "daily", "2026-11-01")).not.toEqual(
      scopedKey("user-2", "daily", "2026-11-01"),
    );
  });
});
