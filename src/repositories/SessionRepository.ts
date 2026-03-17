import { db } from "@/src/db";
import { type NewSession, type Session, userSessions } from "@/src/db/schema";
import type { SessionRepository } from "@/src/features/auth/contracts";
import { AgoraError } from "@/src/lib/errors";
import { eq, lt } from "drizzle-orm";

export const DrizzleSessionRepository: SessionRepository = {
  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  async create(data: NewSession): Promise<Session> {
    const [session] = await db
      .insert(userSessions)
      // Drizzle usually allows inserting without id if it has a default
      .values(data)
      .returning();

    if (!session) throw new AgoraError("INTERNAL", "Failed to create session.");
    return session;
  },

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<Session | null> {
    const result = await db.select().from(userSessions).where(eq(userSessions.id, id)).limit(1);
    return result[0] || null;
  },

  async findByToken(tokenHash: string): Promise<Session | null> {
    const result = await db.select().from(userSessions).where(eq(userSessions.sessionTokenHash, tokenHash)).limit(1);
    return result[0] || null;
  },

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  async updateToken(id: string, newTokenHash: string, oldTokenHash: string): Promise<Session> {
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
  },

  // ---------------------------------------------------------------------------
  // Revoke (Soft-Delete)
  // ---------------------------------------------------------------------------
  async revoke(id: string): Promise<Session> {
    const [revokedSession] = await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.id, id))
      .returning();

    if (!revokedSession) throw new AgoraError("NOT_FOUND", "Session not found.");
    return revokedSession;
  },

  async revokeAllForUser(userId: string): Promise<Session[]> {
    const revokedSessions = await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.userId, userId))
      .returning();

    return revokedSessions; // Note: Drizzle always returns an array here, empty if no updates occurred
  },

  // ---------------------------------------------------------------------------
  // Delete (Hard-Delete)
  // ---------------------------------------------------------------------------
  async delete(id: string): Promise<Session> {
    const [deletedSession] = await db.delete(userSessions).where(eq(userSessions.id, id)).returning();

    if (!deletedSession) throw new AgoraError("NOT_FOUND", "Session not found.");
    return deletedSession;
  },

  async deleteExpired(): Promise<Session[]> {
    // We can do this in a single fast database round-trip without loops!
    const expiredSessions = await db.delete(userSessions).where(lt(userSessions.expiresAt, new Date())).returning();

    return expiredSessions;
  },
};
