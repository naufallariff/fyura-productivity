import { beforeEach, describe, expect, it, vi } from "vitest";
import { decryptColumn } from "@/server/crypto/column-cipher";
import {
  createPrivateRecord,
  deletePrivateRecord,
  listPrivateRecords,
  updatePrivateRecord,
} from "@/server/services/private";

const { expiry, withUser, insert, list, update, remove } = vi.hoisted(() => ({
  expiry: vi.fn(),
  withUser: vi.fn(),
  insert: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/server/config/env", () => ({
  env: { ENCRYPTION_KEY: "ba".repeat(32), ENCRYPTION_KEY_VERSION: 1 },
}));
vi.mock("@/server/private/guard", () => ({ getPrivateExpiry: expiry }));
vi.mock("@/server/db/tx", () => ({ withUser }));
vi.mock("@/server/db/repositories/private", () => ({
  insertPrivateRecord: insert,
  listPrivateRecordRows: list,
  updatePrivateRecordRow: update,
  softDeletePrivateRecord: remove,
}));

const USER_ID = "743ee0af-270f-498d-9f46-777e15e5e8b0";
const RECORD_ID = "8f6f5a4d-c18e-464b-b870-bc7c7390c8cf";
const tx = Symbol("user transaction");
const draft = {
  title: "Sensitive title",
  body: "<p><strong>Text</strong></p><script>bad()</script>",
};

beforeEach(() => {
  vi.resetAllMocks();
  withUser.mockImplementation((_userId, query) => query(tx));
});

describe("private records", () => {
  it("requires a PIN session before every records operation", async () => {
    expiry.mockResolvedValue(null);

    for (const result of await Promise.allSettled([
      listPrivateRecords(USER_ID),
      createPrivateRecord(USER_ID, draft),
      updatePrivateRecord(USER_ID, { ...draft, id: RECORD_ID }),
      deletePrivateRecord(USER_ID, { id: RECORD_ID }),
    ])) {
      expect(result).toMatchObject({ status: "rejected", reason: { code: "PRIVATE_LOCKED" } });
    }
    expect(withUser).not.toHaveBeenCalled();
  });

  it("writes only ciphertext to the user transaction and reads sanitized HTML", async () => {
    expiry.mockResolvedValue(1);
    const updatedAt = new Date("2026-11-24T00:00:00Z");
    insert.mockImplementation((_tx, _userId, ciphertext) => ({
      ...ciphertext,
      id: RECORD_ID,
      updatedAt,
    }));

    const expectedBody = "<p><strong>Text</strong></p>";
    const dto = await createPrivateRecord(USER_ID, draft);
    expect(dto).toEqual({
      id: RECORD_ID,
      title: draft.title,
      body: expectedBody,
      updatedAt: updatedAt.toISOString(),
    });
    expect(withUser).toHaveBeenCalledWith(USER_ID, expect.any(Function));

    const [actualTx, actualUser, ciphertext] = insert.mock.calls[0]!;
    expect(actualTx).toBe(tx);
    expect(actualUser).toBe(USER_ID);
    expect(ciphertext.titleCiphertext).toMatch(/^v1:/);
    expect(ciphertext.bodyCiphertext).toMatch(/^v1:/);
    expect(decryptColumn(ciphertext.titleCiphertext)).toBe(draft.title);
    expect(decryptColumn(ciphertext.bodyCiphertext)).toBe(expectedBody);

    list.mockResolvedValue([{ ...ciphertext, id: RECORD_ID, updatedAt }]);
    await expect(listPrivateRecords(USER_ID)).resolves.toEqual([dto]);
  });

  it("rejects markup with no text before opening a transaction", async () => {
    expiry.mockResolvedValue(1);
    await expect(
      createPrivateRecord(USER_ID, { title: draft.title, body: "<p>&nbsp;</p><hr>" }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(withUser).not.toHaveBeenCalled();
  });
});
