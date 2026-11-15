import type { ReactNode } from "react";
import { PageFrame, PageHeader } from "./page-header";

/** @deprecated Temporary bridge for pages not yet rewritten. Remove in R9. */
export function PageShell({
  title,
  children,
}: {
  title: string;
  email?: string | null;
  children: ReactNode;
}) {
  return (
    <PageFrame>
      <PageHeader title={title} />
      {children}
    </PageFrame>
  );
}
