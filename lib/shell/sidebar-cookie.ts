export const SIDEBAR_COOKIE = "fyura_sidebar";

export type SidebarState = "expanded" | "collapsed";

export function parseSidebarState(value: string | undefined): SidebarState {
  return value === "collapsed" ? "collapsed" : "expanded";
}
