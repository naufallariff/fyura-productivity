import { GraduationCap } from "lucide-react";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n";

export default function LearningPage() {
  return (
    <PageFrame>
      <PageHeader title={t("learning.title")} lead={t("learning.lead")} />
      <section className="glass">
        <EmptyState
          icon={GraduationCap}
          title={t("module.comingTitle")}
          body={t("module.comingBody")}
          hue="indigo"
        />
      </section>
    </PageFrame>
  );
}
