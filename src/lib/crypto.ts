/**
 * Cryptography Utility Functions:
 *
 * - `hashPassword`: Secure password hashing using Bun's native optimized Argon2id implementation.
 * - `verifyPassword`: Verifies a plain text password against an Argon2id hash.
 * - `hashToken`: Fast, deterministic SHA-256 hashing for high-entropy secrets like API keys and verification tokens.
 * - `verifyToken`: Verifies a plaintext token against its SHA-256 hash using a constant-time comparison.
 */

import { randomBytes, timingSafeEqual } from "node:crypto";

import { TOKEN_BYTE_LENGTH } from "@/src/config/constants.ts";

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
 * @param hash The Argon2id hash stored in the database, 32 bytes -> 43 characters
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

export function createToken(bytes: number = TOKEN_BYTE_LENGTH): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Fast, deterministic hashing for high-entropy secrets like API keys or verification tokens.
 * Uses SHA-256. Do NOT use this for user passwords.
 */
export function hashToken(key: string): string {
  return new Bun.CryptoHasher("sha256").update(key).digest("hex");
}

/**
 * Verify a plaintext high-entropy string against its SHA-256 hash securely.
 *
 * Why not use `===`?
 * Standard string comparison (`===`) stops at the first mismatched character.
 * Attackers can measure the time it takes for the comparison to fail to
 * guess the hash character by character (a "timing attack").
 * This function uses a constant-time comparison to prevent that.
 */
export function verifyToken(plainKey: string, hashedKey: string): boolean {
  const plainHash = hashToken(plainKey);

  // Convert hex strings to byte arrays (Buffers).
  // timingSafeEqual requires binary data formats, not standard JS strings.
  const plainHashBuffer = Buffer.from(plainHash, "hex");
  const hashedKeyBuffer = Buffer.from(hashedKey, "hex");

  // timingSafeEqual throws an error if the buffers are different lengths.
  // Different lengths inherently take different times to process anyway.
  if (plainHashBuffer.length !== hashedKeyBuffer.length) {
    return false;
  }

  // Evaluates the entire buffer in constant time, regardless of where
  // the first mismatch occurs, completely neutralizing timing attacks.
  return timingSafeEqual(plainHashBuffer, hashedKeyBuffer);
}
