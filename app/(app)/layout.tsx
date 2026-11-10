import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";

async function SessionGate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SessionGate>{children}</SessionGate>
    </Suspense>
  );
}
