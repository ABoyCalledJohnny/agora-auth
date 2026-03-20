import type { VerificationTokenType } from "@/src/config/constants.ts";
import type { VerificationToken } from "@/src/db/schema/index.ts";

import { appConfig } from "@/src/config/index.ts";
import { createToken, hashToken } from "@/src/lib/crypto.ts";
import { AgoraError, handleServiceError } from "@/src/lib/errors.ts";
import { parseDuration } from "@/src/lib/utils.ts";
import { DrizzleVerificationTokenRepository } from "@/src/repositories/verification-token.repository.ts";

export interface CreateVerificationTokenInput {
  userId: string;
  type: VerificationTokenType;
  metadata?: Record<string, unknown>;
}

export interface CreateVerificationTokenResult {
  plainToken: string;
  verificationToken: VerificationToken;
}

/**
 * Service responsible for issuing, consuming, and managing lifecycle
 * of secure, short-lived verification tokens (e.g., email verification, password resets).
 */
export const VerificationTokenService = {
  /**
   * Creates a new verification token for a user.
   * Invalidates any existing active tokens of the exact same type to prevent abuse.
   *
   * @param input The details required to generate the token.
   * @returns The plaintext token (for delivery) and the persisted token entity.
   */
  async create(input: CreateVerificationTokenInput): Promise<CreateVerificationTokenResult> {
    try {
      // 1. Invalidate any existing active tokens of the exact same type for this user to prevent spam/abuse
      await DrizzleVerificationTokenRepository.deleteByUserIdAndType(input.userId, input.type);

      // 2. Generate a secure random string and hash it for DB storage
      const plainToken = createToken();
      const tokenHash = hashToken(plainToken);
      const expiresAt = new Date(Date.now() + parseDuration(appConfig.auth.verificationTokenExpiry));

      // 3. Store the hashed representation alongside the token details
      const verificationToken = await DrizzleVerificationTokenRepository.create({
        userId: input.userId,
        tokenHash,
        type: input.type,
        expiresAt,
        metadata: input.metadata,
      });

      // 4. Return the plaintext token here and NO-WHERE ELSE.
      // It must be used immediately to send the email/SMS and never logged.
      return {
        plainToken,
        verificationToken,
      };
    } catch (e) {
      handleServiceError(e, "Error creating verification token.");
    }
  },

  /**
   * Atomically consumes a verification token.
   * Validates the token's existence, matches its type, consumes it,
   * and verifies it hasn't expired.
   *
   * @param plainToken The raw plaintext token string provided by the user.
   * @param type The expected token type (e.g., email_verification).
   * @returns The consumed token entity.
   * @throws {AgoraError} TOKEN_INVALID if missing or used, TOKEN_EXPIRED if time elapsed.
   */
  async consume(plainToken: string, type: VerificationTokenType): Promise<VerificationToken> {
    try {
      // 1. Hash the incoming plaintext token
      const tokenHash = hashToken(plainToken);

      // 2. Atomically fetch and consume the token in the DB via its hash.
      const token = await DrizzleVerificationTokenRepository.tryConsumeByToken(tokenHash, type);

      // 3. If no matching token is found, it's either invalid or already consumed
      if (!token) throw new AgoraError("TOKEN_INVALID");

      // 4. Check if the token was past its expiration (since they are eagerly deleted here,
      // we just reject it if they attempt to use it too late)
      if (token.expiresAt < new Date()) throw new AgoraError("TOKEN_EXPIRED");

      return token;
    } catch (e) {
      handleServiceError(e, "Error consuming verification token.");
    }
  },

  /**
   * Deletes all currently active tokens of a specific type for a specific user.
   *
   * @param userId The user's ID.
   * @param type The target token type.
   * @returns The number of tokens successfully deleted.
   */
  async deleteByUserAndType(userId: string, type: VerificationTokenType): Promise<number> {
    try {
      return await DrizzleVerificationTokenRepository.deleteByUserIdAndType(userId, type);
    } catch (e) {
      handleServiceError(e, "Error deleting verification tokens by user and type.");
    }
  },

  /**
   * Flushes all expired verification tokens from the database.
   * Useful for cron jobs or maintenance routines.
   *
   * @returns The number of expired tokens successfully deleted.
   */
  async deleteExpired(): Promise<number> {
    try {
      return (await DrizzleVerificationTokenRepository.deleteExpired()).length;
    } catch (e) {
      handleServiceError(e, "Error flushing expired verification tokens.");
    }
  },
};
