import { describe, expect, it } from "vitest";
import { NAV_ITEMS, PRIMARY_NAV, SECONDARY_NAV, isActivePath } from "@/lib/nav/items";
import { parseSidebarState } from "@/lib/shell/sidebar-cookie";

describe("navigation model", () => {
  it("has exactly four primary items for the mobile bottom bar", () => {
    expect(PRIMARY_NAV).toHaveLength(4);
  });

  it("partitions every item into primary or secondary", () => {
    expect(PRIMARY_NAV.length + SECONDARY_NAV.length).toBe(NAV_ITEMS.length);
  });

  it("has unique hrefs", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("matches nested routes as active without matching prefixes of other words", () => {
    expect(isActivePath("/habits/42", "/habits")).toBe(true);
    expect(isActivePath("/habitsx", "/habits")).toBe(false);
  });
});

describe("sidebar cookie", () => {
  it("defaults to expanded for missing or unknown values", () => {
    expect(parseSidebarState(undefined)).toBe("expanded");
    expect(parseSidebarState("garbage")).toBe("expanded");
    expect(parseSidebarState("collapsed")).toBe("collapsed");
  });
});
