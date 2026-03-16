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
