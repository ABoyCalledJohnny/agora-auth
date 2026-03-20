import type { SessionRepository } from "@/src/features/auth/contracts";

import { and, eq, gt, isNull, lt } from "drizzle-orm";

import { db } from "@/src/db/index.ts";
import { type NewSession, type Session, userSessions } from "@/src/db/schema/index.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const DrizzleSessionRepository: SessionRepository = {
  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  async create(data: NewSession): Promise<Session> {
    try {
      const [session] = await db
        .insert(userSessions)
        // Drizzle usually allows inserting without id if it has a default
        .values(data)
        .returning();

      if (!session) throw new AgoraError("INTERNAL", "Failed to create session.");
      return session;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while creating the session.");
    }
  },

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<Session | null> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.id, id)).limit(1);
    return session ?? null;
  },

  async findByToken(tokenHash: string): Promise<Session | null> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.sessionTokenHash, tokenHash)).limit(1);
    return session ?? null;
  },

  async findActiveByToken(tokenHash: string): Promise<Session | null> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.sessionTokenHash, tokenHash),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return session ?? null;
  },

  async findByPreviousToken(tokenHash: string): Promise<Session | null> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.previousSessionTokenHash, tokenHash))
      .limit(1);

    return session ?? null;
  },

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  async updateToken(id: string, newTokenHash: string, oldTokenHash: string): Promise<Session> {
    try {
      const [updatedSession] = await db
        .update(userSessions)
        .set({
          sessionTokenHash: newTokenHash,
          previousSessionTokenHash: oldTokenHash,
          lastActiveAt: new Date(),
        })
        .where(eq(userSessions.id, id))
        .returning();

      if (!updatedSession) throw new AgoraError("NOT_FOUND", "Session not found.");
      return updatedSession;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while updating the session.");
    }
  },

  // ---------------------------------------------------------------------------
  // Revoke (Soft-Delete)
  // ---------------------------------------------------------------------------
  async revoke(id: string): Promise<Session> {
    try {
      const [revokedSession] = await db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(userSessions.id, id))
        .returning();

      if (!revokedSession) throw new AgoraError("NOT_FOUND", "Session not found.");
      return revokedSession;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while revoking the session.");
    }
  },

  async revokeAllForUser(userId: string): Promise<Session[]> {
    try {
      const revokedSessions = await db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(userSessions.userId, userId))
        .returning();

      return revokedSessions; // Note: Drizzle always returns an array here, empty if no updates occurred
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while revoking user sessions.");
    }
  },

  // ---------------------------------------------------------------------------
  // Delete (Hard-Delete)
  // ---------------------------------------------------------------------------
  async delete(id: string): Promise<Session> {
    try {
      const [deletedSession] = await db.delete(userSessions).where(eq(userSessions.id, id)).returning();

      if (!deletedSession) throw new AgoraError("NOT_FOUND", "Session not found.");
      return deletedSession;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting the session.");
    }
  },

  async deleteExpired(): Promise<Session[]> {
    try {
      // We can do this in a single fast database round-trip without loops!
      const expiredSessions = await db.delete(userSessions).where(lt(userSessions.expiresAt, new Date())).returning();

      return expiredSessions;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting expired sessions.");
    }
  },
};
