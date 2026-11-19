// server/services/capture.ts
import "server-only";
import { withUser, type Tx } from "@/server/db/tx";
import { decodeCursor, toPage, type Page } from "@/server/db/cursor";
import { definedFields } from "@/server/db/patch";
import {
  findIdea,
  insertIdea,
  listIdeasPage,
  replaceIdeaTags,
  tagCounts,
  tagsForIdeas,
  updateIdeaRow,
  type IdeaPosition,
  type IdeaRow,
} from "@/server/db/repositories/capture";
import { CreateIdeaInput, IdeasQuery, UpdateIdeaInput } from "@/server/validation/capture";
import { normalizeTag, normalizeTags } from "@/domain/capture/tags";
import { DomainError } from "./errors";
import { parse } from "./parse";

export interface IdeaDto {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly status: "INBOX" | "ACTIVE" | "ARCHIVED";
  readonly tags: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

function toDto(row: IdeaRow, tags: string[]): IdeaDto {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status as IdeaDto["status"],
    tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Adds tags to a batch of ideas with one query. */
async function hydrate(tx: Tx, userId: string, rows: readonly IdeaRow[]): Promise<IdeaDto[]> {
  const links = await tagsForIdeas(
    tx,
    userId,
    rows.map((row) => row.id),
  );
  const byIdea = new Map<string, string[]>();
  for (const link of links) {
    const bucket = byIdea.get(link.ideaId) ?? [];
    bucket.push(link.tag);
    byIdea.set(link.ideaId, bucket);
  }
  return rows.map((row) => toDto(row, byIdea.get(row.id) ?? []));
}

function parseIdeaCursor(key: string): IdeaPosition {
  const [iso, id] = key.split("|");
  const at = new Date(iso ?? "");
  if (!id || Number.isNaN(at.getTime())) {
    throw new DomainError("VALIDATION_FAILED", "Cursor is invalid");
  }
  return { at, id };
}

export async function listIdeas(userId: string, input: unknown): Promise<Page<IdeaDto>> {
  const query = parse(IdeasQuery, input);
  const cursor = decodeCursor(query.cursor);
  const position = cursor ? parseIdeaCursor(cursor.key) : null;
  const tag = query.tag ? normalizeTag(query.tag) : null;

  return withUser(userId, async (tx) => {
    const rows = await listIdeasPage(
      tx,
      userId,
      {
        status: query.status,
        tag: tag ?? undefined,
        q: query.q ? query.q : undefined,
      },
      position,
      query.limit + 1,
    );
    const page = toPage(rows, query.limit, (row) => ({
      key: `${row.updatedAt.toISOString()}|${row.id}`,
      id: row.id,
    }));
    return { items: await hydrate(tx, userId, page.items), nextCursor: page.nextCursor };
  });
}

export async function createIdea(userId: string, input: unknown): Promise<IdeaDto> {
  const parsed = parse(CreateIdeaInput, input);
  const tags = normalizeTags(parsed.tags);

  return withUser(userId, async (tx) => {
    const row = await insertIdea(tx, {
      userId,
      title: parsed.title,
      body: parsed.body,
      status: "INBOX",
    });
    await replaceIdeaTags(tx, userId, row.id, tags);
    return toDto(row, tags);
  });
}

export async function updateIdea(userId: string, input: unknown): Promise<void> {
  const { ideaId, tags, ...patch } = parse(UpdateIdeaInput, input);

  await withUser(userId, async (tx) => {
    const existing = await findIdea(tx, userId, ideaId);
    if (!existing) throw new DomainError("NOT_FOUND", "Idea not found");

    const row = await updateIdeaRow(tx, userId, ideaId, definedFields(patch));
    if (!row) throw new DomainError("NOT_FOUND", "Idea not found");

    if (tags !== undefined) await replaceIdeaTags(tx, userId, ideaId, normalizeTags(tags));
  });
}

export async function listTagCloud(userId: string): Promise<Array<{ tag: string; count: number }>> {
  return withUser(userId, (tx) => tagCounts(tx, userId));
}
