import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { ThemePicker } from "@/features/settings/theme-picker";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";
import { getThemeSelection } from "@/server/db/settings";

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
  const current = await getThemeSelection(user.id);

  return (
    <PageFrame>
      <PageHeader title={t("settings.title")} lead={t("settings.lead")} />
      <section className="glass p-5 sm:p-7">
        <ThemePicker current={current} />
      </section>
    </PageFrame>
  );
}
