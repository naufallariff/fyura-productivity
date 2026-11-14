import "server-only";
import { eq } from "drizzle-orm";
import { DEFAULT_SELECTION, ThemeSelectionSchema, type ThemeSelection } from "@/lib/theme/resolve";
import { userSettings } from "./schema";
import { withUser } from "./tx";

export type UserSettings = ThemeSelection & { navbarMode: "auto" | "pinned" };

const DEFAULT_NAVBAR = "auto" as const;

export async function getUserSettings(userId: string): Promise<UserSettings> {
  return withUser(userId, async (tx) => {
    const [row] = await tx
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!row) {
      return { ...DEFAULT_SELECTION, navbarMode: DEFAULT_NAVBAR };
    }

    const parsed = ThemeSelectionSchema.safeParse({
      style: row.themeStyle,
      palette: row.themePalette,
      mode: row.themeMode,
    });

    // A stored value that no longer exists falls back to the default, never crashes the page.
    const theme = parsed.success ? parsed.data : DEFAULT_SELECTION;
    const navbarMode = row.navbarMode === "pinned" ? "pinned" : DEFAULT_NAVBAR;
    return { ...theme, navbarMode };
  });
}

export async function saveThemeSelection(userId: string, selection: ThemeSelection): Promise<void> {
  const valid = ThemeSelectionSchema.parse(selection);
  const now = new Date();

  await withUser(userId, async (tx) => {
    await tx
      .insert(userSettings)
      .values({
        userId,
        themeStyle: valid.style,
        themePalette: valid.palette,
        themeMode: valid.mode,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          themeStyle: valid.style,
          themePalette: valid.palette,
          themeMode: valid.mode,
          updatedAt: now,
        },
      });
  });
}
