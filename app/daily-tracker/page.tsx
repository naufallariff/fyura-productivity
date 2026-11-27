import { DailyView } from "@/views/daily-view";
import { WorkspaceShell } from "@/layouts/workspace-shell";

export default function DailyTrackerPage() {
  return (
    <WorkspaceShell>
      <DailyView />
    </WorkspaceShell>
  );
}
