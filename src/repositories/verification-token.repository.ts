/**
 * Verification Token Repository
 *
 * Data-access layer for short-lived verification tokens (email verification,
 * password resets). Supports atomic consumption to prevent TOCTOU race conditions.
 */

import type { VerificationTokenType } from "../config/constants.ts";
import type { VerificationTokenRepository } from "@/src/features/auth/contracts.ts";

import { and, eq, gt, lt } from "drizzle-orm";

import { db } from "@/src/db/index.ts";
import { type NewVerificationToken, type VerificationToken, verificationTokens } from "@/src/db/schema/index.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const DrizzleVerificationTokenRepository: VerificationTokenRepository = {
  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  /**
   * Persists a hashed, short-lived verification token.
   *
   * @param data The required payload for creating the token.
   * @returns The fully mapped VerificationToken entity.
   * @throws {AgoraError} INTERNAL on insertion failure.
   */
  async create(data: NewVerificationToken): Promise<VerificationToken> {
    try {
      const [token] = await db.insert(verificationTokens).values(data).returning();

      if (!token) throw new AgoraError("INTERNAL", "Failed to create verification token.");
      return token;
    } catch (error) {
      if (error instanceof AgoraError) throw error;
      throw new AgoraError("INTERNAL", "A database error occurred while creating the verification token.");
    }
  },

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<VerificationToken | null> {
    const [token] = await db.select().from(verificationTokens).where(eq(verificationTokens.id, id)).limit(1);

    return token ?? null;
  },

  async findByToken(tokenHash: string): Promise<VerificationToken | null> {
    const [token] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.tokenHash, tokenHash))
      .limit(1);

    return token ?? null;
  },

  async findByUserIdAndType(userId: string, type: VerificationTokenType): Promise<VerificationToken[]> {
    const tokens = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.userId, userId), eq(verificationTokens.type, type)));

    return tokens;
  },

  async tryConsumeByToken(tokenHash: string, type: VerificationTokenType): Promise<VerificationToken | null> {
    try {
      const [consumedToken] = await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.tokenHash, tokenHash),
            eq(verificationTokens.type, type),
            gt(verificationTokens.expiresAt, new Date()),
          ),
        )
        .returning();

      return consumedToken ?? null;
    } catch (error) {
      if (error instanceof AgoraError) throw error;
      throw new AgoraError("INTERNAL", "A database error occurred while consuming the verification token.");
    }
  },

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /**
   * Hard-deletes a verification token by its database ID.
   *
   * SECURITY WARNING: Do NOT use `findByToken` -> validate -> `delete(id)`.
   * That multi-step sequence introduces a TOCTOU race condition.
   * Use `tryConsumeByToken()` for atomic token consumption instead.
   */
  async delete(id: string): Promise<VerificationToken> {
    try {
      const [deletedToken] = await db.delete(verificationTokens).where(eq(verificationTokens.id, id)).returning();

      if (!deletedToken) throw new AgoraError("NOT_FOUND", "Verification token not found.");
      return deletedToken;
    } catch (error) {
      if (error instanceof AgoraError) throw error;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting the verification token.");
    }
  },

  async deleteByUserIdAndType(userId: string, type: VerificationTokenType): Promise<number> {
    try {
      const deletedTokens = await db
        .delete(verificationTokens)
        .where(and(eq(verificationTokens.userId, userId), eq(verificationTokens.type, type)))
        .returning({ id: verificationTokens.id }); // Only return the ID to keep the payload light

      return deletedTokens.length;
    } catch (error) {
      if (error instanceof AgoraError) throw error;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting verification tokens by user ID.");
    }
  },

  async deleteExpired(): Promise<VerificationToken[]> {
    try {
      const expiredTokens = await db
        .delete(verificationTokens)
        .where(lt(verificationTokens.expiresAt, new Date()))
        .returning();

      return expiredTokens;
    } catch (error) {
      if (error instanceof AgoraError) throw error;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting expired verification tokens.");
    }
  },
};
