import { describe, expect, it } from "vitest";
import { MOBILE_PRIMARY, NAV_ITEMS, NAV_SECTIONS, isActivePath } from "@/lib/nav/sections";
import { parseSidebarState } from "@/lib/shell/sidebar-cookie";

describe("navigation model", () => {
  it("orders sections as main, workspace, then private", () => {
    expect(NAV_SECTIONS.map((section) => section.id)).toEqual(["main", "workspace", "private"]);
  });

  it("places the four daily modules in the main section in order", () => {
    expect(NAV_SECTIONS[0]?.items.map((item) => item.href)).toEqual([
      "/dashboard",
      "/daily-tracker",
      "/projects",
      "/weekly-plan",
    ]);
  });

  it("keeps private in its own section", () => {
    expect(NAV_SECTIONS[2]?.items.map((item) => item.href)).toEqual(["/private"]);
  });

  it("has unique hrefs", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("offers exactly four primary items on mobile", () => {
    expect(MOBILE_PRIMARY).toHaveLength(4);
  });

  it("matches nested routes only at a path boundary", () => {
    expect(isActivePath("/projects/board-1", "/projects")).toBe(true);
    expect(isActivePath("/projectsx", "/projects")).toBe(false);
  });
});

describe("sidebar cookie", () => {
  it("defaults to expanded for missing or unknown values", () => {
    expect(parseSidebarState(undefined)).toBe("expanded");
    expect(parseSidebarState("garbage")).toBe("expanded");
    expect(parseSidebarState("collapsed")).toBe("collapsed");
  });
});
