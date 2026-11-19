// server/db/repositories/capture.ts
import "server-only";
import { and, asc, desc, eq, exists, ilike, inArray, lt, ne, or, sql, type SQL } from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { ideaTags, ideas } from "@/server/db/schema";
import { escapeLike } from "@/server/db/like";

export type IdeaRow = typeof ideas.$inferSelect;
export type NewIdeaRow = typeof ideas.$inferInsert;
export type IdeaTagRow = typeof ideaTags.$inferSelect;

export interface IdeaFilter {
  readonly status?: "INBOX" | "ACTIVE" | "ARCHIVED";
  readonly tag?: string;
  readonly q?: string;
}

export interface IdeaPosition {
  readonly at: Date;
  readonly id: string;
}

export async function listIdeasPage(
  tx: Tx,
  userId: string,
  filter: IdeaFilter,
  position: IdeaPosition | null,
  limit: number,
): Promise<IdeaRow[]> {
  const conditions: SQL[] = [eq(ideas.userId, userId)];

  // Without an explicit status, archived ideas stay out of the list.
  conditions.push(filter.status ? eq(ideas.status, filter.status) : ne(ideas.status, "ARCHIVED"));

  if (filter.tag) {
    const tag = filter.tag;
    conditions.push(
      exists(
        tx
          .select({ one: sql`1` })
          .from(ideaTags)
          .where(and(eq(ideaTags.ideaId, ideas.id), eq(ideaTags.tag, tag))),
      ),
    );
  }

  if (filter.q) {
    const pattern = `%${escapeLike(filter.q)}%`;
    const text = or(ilike(ideas.title, pattern), ilike(ideas.body, pattern));
    if (text) conditions.push(text);
  }

  if (position) {
    const after = or(
      lt(ideas.updatedAt, position.at),
      and(eq(ideas.updatedAt, position.at), lt(ideas.id, position.id)),
    );
    if (after) conditions.push(after);
  }

  return tx
    .select()
    .from(ideas)
    .where(and(...conditions))
    .orderBy(desc(ideas.updatedAt), desc(ideas.id))
    .limit(limit);
}

export async function findIdea(tx: Tx, userId: string, ideaId: string): Promise<IdeaRow | null> {
  const [row] = await tx
    .select()
    .from(ideas)
    .where(and(eq(ideas.userId, userId), eq(ideas.id, ideaId)))
    .limit(1);
  return row ?? null;
}

export async function insertIdea(tx: Tx, row: NewIdeaRow): Promise<IdeaRow> {
  // Millisecond timestamps keep the ISO cursor exact. Database defaults use microseconds.
  const now = new Date();
  const [inserted] = await tx
    .insert(ideas)
    .values({ ...row, createdAt: now, updatedAt: now })
    .returning();
  if (!inserted) throw new Error("insertIdea: no row returned");
  return inserted;
}

export async function updateIdeaRow(
  tx: Tx,
  userId: string,
  ideaId: string,
  patch: Partial<NewIdeaRow>,
): Promise<IdeaRow | null> {
  const [row] = await tx
    .update(ideas)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(ideas.userId, userId), eq(ideas.id, ideaId)))
    .returning();
  return row ?? null;
}

/** Replaces all tags of one idea. Runs inside the caller's transaction. */
export async function replaceIdeaTags(
  tx: Tx,
  userId: string,
  ideaId: string,
  tags: readonly string[],
): Promise<void> {
  await tx.delete(ideaTags).where(and(eq(ideaTags.userId, userId), eq(ideaTags.ideaId, ideaId)));
  if (tags.length === 0) return;
  await tx.insert(ideaTags).values(tags.map((tag) => ({ userId, ideaId, tag })));
}

export async function tagsForIdeas(
  tx: Tx,
  userId: string,
  ideaIds: readonly string[],
): Promise<IdeaTagRow[]> {
  if (ideaIds.length === 0) return [];
  return tx
    .select()
    .from(ideaTags)
    .where(and(eq(ideaTags.userId, userId), inArray(ideaTags.ideaId, [...ideaIds])));
}

/** Tag counts over non-archived ideas, most used first. */
export async function tagCounts(
  tx: Tx,
  userId: string,
): Promise<Array<{ readonly tag: string; readonly count: number }>> {
  return tx
    .select({ tag: ideaTags.tag, count: sql<number>`count(*)::int` })
    .from(ideaTags)
    .innerJoin(ideas, and(eq(ideas.id, ideaTags.ideaId), eq(ideas.userId, ideaTags.userId)))
    .where(and(eq(ideaTags.userId, userId), ne(ideas.status, "ARCHIVED")))
    .groupBy(ideaTags.tag)
    .orderBy(desc(sql`count(*)`), asc(ideaTags.tag))
    .limit(50);
}
