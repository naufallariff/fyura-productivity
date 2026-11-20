import "server-only";
import { auth } from "@/server/auth/auth";
import { getThemeSelection } from "@/server/db/settings";
import { DEFAULT_SELECTION, type ThemeSelection } from "./resolve";

/** Signed-out visitors get the default. Layout wiring is done in R4. */
export async function getRequestTheme(): Promise<ThemeSelection> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return DEFAULT_SELECTION;
  return getThemeSelection(id);
}
