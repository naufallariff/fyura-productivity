import "server-only";
import { eq } from "drizzle-orm";
import { DEFAULT_SELECTION, parseSelection, type ThemeSelection } from "@/lib/theme/resolve";
import { userSettings } from "./schema";
import { withUser } from "./tx";

export async function getThemeSelection(userId: string): Promise<ThemeSelection> {
  return withUser(userId, async (tx) => {
    const [row] = await tx
      .select({ bundle: userSettings.themeBundle, mode: userSettings.themeMode })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    return row ? parseSelection(row) : DEFAULT_SELECTION;
  });
}

export async function saveThemeSelection(
  userId: string,
  change: Partial<ThemeSelection>,
): Promise<void> {
  const patch = { themeBundle: change.bundle, themeMode: change.mode, updatedAt: new Date() };
  await withUser(userId, (tx) =>
    tx
      .insert(userSettings)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: patch,
      }),
  );
}
