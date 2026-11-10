import "server-only";
import { auth } from "@/lib/auth/auth";
import { DEFAULT_SELECTION, type ThemeSelection } from "./resolve";
import { getUserSettings } from "@/lib/db/settings";

/** Resolves the theme for the current request. Falls back to the default when signed out. */
export async function getRequestTheme(): Promise<ThemeSelection> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return DEFAULT_SELECTION;

  const settings = await getUserSettings(userId);
  return { style: settings.style, palette: settings.palette, mode: settings.mode };
}
