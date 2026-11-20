// features/learning/learning-tabs.tsx
"use client";

import { useRouter } from "next/navigation";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { t } from "@/lib/i18n";

export type LearningTab = "materi" | "ulasan";

const OPTIONS: SegmentedOption<LearningTab>[] = [
  { value: "materi", label: t("learning.tab.materials") },
  { value: "ulasan", label: t("learning.tab.reviews") },
];

export function LearningTabs({ active }: { readonly active: LearningTab }) {
  const router = useRouter();
  return (
    <Segmented
      label={t("learning.title")}
      options={OPTIONS}
      value={active}
      onChange={(next) => router.push(`/learning?tab=${next}`)}
    />
  );
}
