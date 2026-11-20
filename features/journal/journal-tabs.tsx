// features/journal/journal-tabs.tsx
"use client";

import { useRouter } from "next/navigation";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { t } from "@/lib/i18n";

export type JournalTab = "jurnal" | "tadabur";

const OPTIONS: SegmentedOption<JournalTab>[] = [
  { value: "jurnal", label: t("journal.tab.journal") },
  { value: "tadabur", label: t("journal.tab.tadabur") },
];

export function JournalTabs({ active }: { readonly active: JournalTab }) {
  const router = useRouter();
  return (
    <Segmented
      label={t("journal.title")}
      options={OPTIONS}
      value={active}
      onChange={(next) => router.push(`/journal?tab=${next}`)}
    />
  );
}
