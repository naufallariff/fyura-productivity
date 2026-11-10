import { Suspense } from "react";
import { ThemePicker } from "@/components/settings/theme-picker";
import { requireUser } from "@/lib/auth/session";
import { getUserSettings } from "@/lib/db/settings";

async function SettingsContent() {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <header className="mb-10 space-y-2">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Settings</h1>
        <p className="text-muted text-sm">
          Appearance is saved to your account and applies on every device.
        </p>
      </header>
      <section className="elevated rounded-card border-line bg-surface border p-6 sm:p-8">
        <ThemePicker current={settings} />
      </section>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
