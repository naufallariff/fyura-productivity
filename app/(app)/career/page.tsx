import { BriefcaseBusiness } from "lucide-react";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n";

export default function CareerPage() {
  return (
    <PageFrame>
      <PageHeader title={t("career.title")} lead={t("career.lead")} />
      <section className="glass">
        <EmptyState
          icon={BriefcaseBusiness}
          title={t("module.comingTitle")}
          body={t("module.comingBody")}
          hue="rose"
        />
      </section>
    </PageFrame>
  );
}
