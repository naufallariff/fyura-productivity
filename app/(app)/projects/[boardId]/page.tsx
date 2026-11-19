import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { PageFrame } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { BoardView } from "@/features/projects/board-view";
import { requireUser } from "@/server/auth/session";

type Params = Promise<{ boardId: string }>;

export default function BoardPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BoardContent params={params} />
    </Suspense>
  );
}

async function BoardContent({ params }: { params: Params }) {
  await connection();
  const { boardId } = await params;
  if (!z.uuid().safeParse(boardId).success) notFound();

  const user = await requireUser();

  return (
    <PageFrame>
      <BoardView userId={user.id} boardId={boardId} />
    </PageFrame>
  );
}
