import { Lightbulb } from "lucide-react";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n";

export default function CapturePage() {
  return (
    <PageFrame>
      <PageHeader title={t("capture.title")} lead={t("capture.lead")} />
      <section className="glass">
        <EmptyState
          icon={Lightbulb}
          title={t("module.comingTitle")}
          body={t("module.comingBody")}
          hue="amber"
        />
      </section>
    </PageFrame>
  );
}
