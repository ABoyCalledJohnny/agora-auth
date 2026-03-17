import { timingSafeEqual } from "node:crypto";

/**
 * Secure password hashing using Bun's native optimized Argon2id implementation.
 * Argon2id is the current industry recommended algorithm for password hashing.
 *
 * @see https://bun.sh/docs/api/hashing#bun-password
 */
export async function hashPassword(password: string): Promise<string> {
  // Bun.password.hash automatically generates a salt and returns
  // the fully formatted $argon2id$... string.
  return await Bun.password.hash(password);
}

/**
 * Verify a plain text password against an Argon2id hash.
 *
 * @param password The plain text password to verify
 * @param hash The Argon2id hash stored in the database
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

/**
 * Fast, deterministic hashing for high-entropy secrets like API keys.
 * Uses SHA-256. Do NOT use this for user passwords.
 */
export function hashApiKey(key: string): string {
  return new Bun.CryptoHasher("sha256").update(key).digest("hex");
}

/**
 * Verify a plaintext API key against its SHA-256 hash securely,
 * protecting against timing attacks.
 */
export function verifyApiKey(plainKey: string, hashedKey: string): boolean {
  const plainHash = hashApiKey(plainKey);
  const plainHashBuffer = Buffer.from(plainHash, "hex");
  const hashedKeyBuffer = Buffer.from(hashedKey, "hex");

  // timingSafeEqual requires buffers to be the same length
  if (plainHashBuffer.length !== hashedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(plainHashBuffer, hashedKeyBuffer);
}
