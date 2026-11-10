import { hash, verify } from "@node-rs/argon2";

const PIN_PATTERN = /^\d{6}$/;

// Argon2id is the library default. Parameters are explicit so the cost
// does not change silently when the library updates its defaults.
const HASH_OPTIONS = {
  memoryCost: 19456, // KiB, about 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

export function hashPin(pin: string, pepper: string): Promise<string> {
  return hash(`${pepper}:${pin}`, HASH_OPTIONS);
}

/** Returns false for a wrong PIN or a malformed stored hash. Never throws on bad input. */
export async function verifyPin(pin: string, storedHash: string, pepper: string): Promise<boolean> {
  try {
    return await verify(storedHash, `${pepper}:${pin}`);
  } catch {
    return false;
  }
}
