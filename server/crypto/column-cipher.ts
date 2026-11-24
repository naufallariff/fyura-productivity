import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "@/server/config/env";
import { DomainError } from "@/server/services/errors";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getEncryptionKey(): Buffer {
  const key = env.ENCRYPTION_KEY;
  if (!key) throw new DomainError("INTERNAL", "ENCRYPTION_KEY is required for private columns.");
  if (key.length !== 64 || /[^0-9a-f]/i.test(key)) {
    throw new DomainError(
      "INTERNAL",
      "ENCRYPTION_KEY must contain exactly 64 hexadecimal characters.",
    );
  }
  return Buffer.from(key, "hex");
}

export function encryptColumn(plaintext: string): string {
  const key = getEncryptionKey();
  const version = `v${env.ENCRYPTION_KEY_VERSION}`;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(version));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const payload = Buffer.concat([iv, ciphertext, cipher.getAuthTag()]);
  return `${version}:${payload.toString("base64")}`;
}

export function decryptColumn(ciphertext: string): string {
  const key = getEncryptionKey();
  const [, version, encoded] = /^(v[1-9]\d*):(.+)$/.exec(ciphertext) ?? [];
  if (!version || !encoded || ciphertext !== `${version}:${encoded}`) {
    throw new DomainError("INTERNAL", "Invalid encrypted column format.");
  }
  if (version !== `v${env.ENCRYPTION_KEY_VERSION}`) {
    throw new DomainError("INTERNAL", "Encrypted column uses an unsupported key version.");
  }

  const payload = Buffer.from(encoded, "base64");
  if (payload.length < IV_BYTES + TAG_BYTES || payload.toString("base64") !== encoded) {
    throw new DomainError("INTERNAL", "Invalid encrypted column payload.");
  }

  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(-TAG_BYTES);
  const encrypted = payload.subarray(IV_BYTES, -TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  decipher.setAAD(Buffer.from(version));
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    throw new DomainError("INTERNAL", "Encrypted column failed authentication.");
  }
}
