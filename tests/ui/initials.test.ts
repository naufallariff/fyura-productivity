import { describe, expect, it } from "vitest";
import { initials } from "@/lib/ui/initials";

describe("initials", () => {
  it("uses the first and last word", () => {
    expect(initials("Naufal Arif")).toBe("NA");
    expect(initials("ahmad fauzi rahman")).toBe("AR");
  });

  it("uses one letter for a single word", () => {
    expect(initials("budi")).toBe("B");
  });

  it("returns a placeholder for blank input", () => {
    expect(initials("   ")).toBe("?");
  });
});
