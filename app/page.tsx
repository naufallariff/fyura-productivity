import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

async function RootRedirect(): Promise<null> {
  await connection();
  redirect("/dashboard");
}

export default function RootPage() {
  return (
    <Suspense fallback={null}>
      <RootRedirect />
    </Suspense>
  );
}
