import { KanbanSquare } from "lucide-react";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n";

export default function ProjectsPage() {
  return (
    <PageFrame>
      <PageHeader title={t("projects.title")} lead={t("projects.lead")} />
      <section className="glass">
        <EmptyState
          icon={KanbanSquare}
          title={t("module.comingTitle")}
          body={t("module.comingBody")}
          hue="violet"
        />
      </section>
    </PageFrame>
  );
}
