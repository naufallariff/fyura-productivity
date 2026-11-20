import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { ThemePicker } from "@/features/settings/theme-picker";
import { TimeZoneForm } from "@/features/settings/timezone-form";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";
import { getThemeSelection } from "@/server/db/settings";
import { getUserTimeZone } from "@/server/services/user";

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  await connection();
  const user = await requireUser();
  const [theme, timeZone] = await Promise.all([
    getThemeSelection(user.id),
    getUserTimeZone(user.id),
  ]);

  return (
    <PageFrame>
      <PageHeader title={t("settings.title")} lead={t("settings.lead")} />
      <div className="space-y-6">
        <section className="glass p-5 sm:p-7">
          <ThemePicker current={theme} />
        </section>
        <section className="glass p-5 sm:p-7">
          <TimeZoneForm current={timeZone} />
        </section>
      </div>
    </PageFrame>
  );
}
