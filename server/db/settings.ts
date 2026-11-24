import "server-only";
import { eq } from "drizzle-orm";
import type { Mode } from "@/lib/theme/bundles";
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

export async function saveThemeSelection(userId: string, selection: ThemeSelection): Promise<void> {
  const now = new Date();
  await withUser(userId, (tx) =>
    tx
      .insert(userSettings)
      .values({
        userId,
        themeBundle: selection.bundle,
        themeMode: selection.mode,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { themeBundle: selection.bundle, themeMode: selection.mode, updatedAt: now },
      }),
  );
}

export async function saveThemeMode(userId: string, mode: Mode): Promise<void> {
  const updatedAt = new Date();
  await withUser(userId, (tx) =>
    tx
      .insert(userSettings)
      .values({ userId, themeMode: mode, updatedAt })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { themeMode: mode, updatedAt },
      }),
  );
}
