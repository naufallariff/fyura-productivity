import "server-only";
import { decryptColumn, encryptColumn } from "@/server/crypto/column-cipher";
import {
  insertPrivateRecord,
  listPrivateRecordRows,
  softDeletePrivateRecord,
  updatePrivateRecordRow,
  type PrivateRecordRow,
} from "@/server/db/repositories/private";
import { withUser } from "@/server/db/tx";
import { getPrivateExpiry } from "@/server/private/guard";
import { DomainError } from "@/server/services/errors";
import { parse } from "@/server/services/parse";
import {
  CreatePrivateRecordInput,
  PrivateRecordId,
  UpdatePrivateRecordInput,
} from "@/server/validation/private";
import { hasHtmlText, sanitizeHtml } from "@/server/validation/sanitize";

export interface PrivateRecordDto {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly updatedAt: string;
}

async function requirePrivateSession(userId: string) {
  if ((await getPrivateExpiry(userId)) === null) {
    throw new DomainError("PRIVATE_LOCKED", "Private space is locked");
  }
}

function encryptRecord(title: string, dirty: string) {
  const body = sanitizeHtml(dirty);
  if (!hasHtmlText(body))
    throw new DomainError("VALIDATION_FAILED", "Private record body is empty");
  return { titleCiphertext: encryptColumn(title), bodyCiphertext: encryptColumn(body) };
}

function toDto(row: PrivateRecordRow): PrivateRecordDto {
  return {
    id: row.id,
    title: decryptColumn(row.titleCiphertext),
    body: sanitizeHtml(decryptColumn(row.bodyCiphertext)),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listPrivateRecords(userId: string): Promise<PrivateRecordDto[]> {
  await requirePrivateSession(userId);
  const rows = await withUser(userId, (tx) => listPrivateRecordRows(tx, userId));
  return rows.map(toDto);
}

export async function createPrivateRecord(
  userId: string,
  input: unknown,
): Promise<PrivateRecordDto> {
  await requirePrivateSession(userId);
  const { title, body } = parse(CreatePrivateRecordInput, input);
  const ciphertext = encryptRecord(title, body);
  const row = await withUser(userId, (tx) => insertPrivateRecord(tx, userId, ciphertext));
  if (!row) throw new DomainError("INTERNAL", "Private record insert did not return a row");
  return toDto(row);
}

export async function updatePrivateRecord(
  userId: string,
  input: unknown,
): Promise<PrivateRecordDto> {
  await requirePrivateSession(userId);
  const { id, title, body } = parse(UpdatePrivateRecordInput, input);
  const ciphertext = encryptRecord(title, body);
  const row = await withUser(userId, (tx) => updatePrivateRecordRow(tx, userId, id, ciphertext));
  if (!row) throw new DomainError("NOT_FOUND", "Private record not found");
  return toDto(row);
}

export async function deletePrivateRecord(userId: string, input: unknown): Promise<void> {
  await requirePrivateSession(userId);
  const { id } = parse(PrivateRecordId, input);
  const removed = await withUser(userId, (tx) => softDeletePrivateRecord(tx, userId, id));
  if (!removed) throw new DomainError("NOT_FOUND", "Private record not found");
}
