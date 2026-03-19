import { db } from "@/src/db";
import { type NewVerificationToken, type VerificationToken, verificationTokens } from "@/src/db/schema";
import type { VerificationTokenRepository } from "@/src/features/auth/contracts.ts";
import { AgoraError } from "@/src/lib/errors.ts";
import { and, eq, gt, lt } from "drizzle-orm";
import type { VerificationTokenType } from "../config/constants.ts";

export const DrizzleVerificationTokenRepository: VerificationTokenRepository = {
  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  async create(data: NewVerificationToken): Promise<VerificationToken> {
    try {
      const [token] = await db.insert(verificationTokens).values(data).returning();

      if (!token) throw new AgoraError("INTERNAL", "Failed to create verification token.");
      return token;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
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
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while consuming the verification token.");
    }
  },

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /**
   * Hard-deletes a verification token by its unique database ID.
   *
   * SECURITY WARNING: If you are verifying a token for a user action (e.g., password reset,
   * email verification), DO NOT use `findByToken` -> validate -> `delete(id)`.
   * That multi-step sequence introduces a Time-of-Check to Time-of-Use (TOCTOU) race condition.
   * Attempting to consume a token must be done atomically via `tryConsumeByToken()` instead.
   */
  async delete(id: string): Promise<VerificationToken> {
    try {
      const [deletedToken] = await db.delete(verificationTokens).where(eq(verificationTokens.id, id)).returning();

      if (!deletedToken) throw new AgoraError("NOT_FOUND", "Verification token not found.");
      return deletedToken;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
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
    } catch (e) {
      if (e instanceof AgoraError) throw e;
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
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting expired verification tokens.");
    }
  },
};
