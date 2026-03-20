import type { Session } from "@/src/db/schema/index.ts";

import { appConfig } from "@/src/config/index.ts";
import { createToken, hashToken } from "@/src/lib/crypto.ts";
import { AgoraError, handleServiceError } from "@/src/lib/errors.ts";
import { parseDuration } from "@/src/lib/utils.ts";
import { DrizzleSessionRepository } from "@/src/repositories/session.repository.ts";

export interface CreateSessionInput {
  userId: string;
  ipAddress: string;
  userAgent: string;
}

export interface CreateSessionResult {
  plainToken: string;
  session: Session;
}

/**
 * Service responsible for issuing, rotating, and managing long-lived
 * database-backed user sessions (Refresh Tokens).
 */
export const SessionService = {
  /**
   * Creates a new persistent user session.
   * Generates a high-entropy session token, hashes it for secure storage,
   * and calculates the expiration date based on configuration.
   *
   * @param input Contains the user ID, IP address, and User-Agent.
   * @returns The plaintext session token (e.g., for a secure HttpOnly cookie) and the session entity.
   */
  async create(input: CreateSessionInput): Promise<CreateSessionResult> {
    try {
      const plainToken = createToken();
      const sessionTokenHash = hashToken(plainToken);
      const expiresAt = new Date(Date.now() + parseDuration(appConfig.auth.refreshTokenExpiry));

      const session = await DrizzleSessionRepository.create({
        userId: input.userId,
        sessionTokenHash,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt,
      });

      return {
        plainToken,
        session,
      };
    } catch (e) {
      handleServiceError(e, "Error creating user session.");
    }
  },

  /**
   * Validates and retrieves an active session using its plaintext token.
   * Rejects revoked or expired sessions automatically.
   *
   * @param plainToken The raw plaintext session token.
   * @returns The active session entity.
   * @throws {AgoraError} INVALID_CREDENTIALS if session is invalid, revoked, or expired.
   */
  async authenticate(plainToken: string): Promise<Session> {
    try {
      const tokenHash = hashToken(plainToken);
      const session = await DrizzleSessionRepository.findActiveByToken(tokenHash);

      if (!session) {
        throw new AgoraError("INVALID_CREDENTIALS", "Session is invalid or expired.");
      }

      return session;
    } catch (e) {
      handleServiceError(e, "Error authenticating session.");
    }
  },

  /**
   * Rotates a session token securely to prevent token theft.
   *
   * Security Protocol:
   * If an active session is NOT found for the token, it checks if the token was
   * previously used. If a previously used token is presented, we assume a malicious
   * actor has cloned the session (Token Reuse Detection) and strictly revoke ALL of the user's sessions.
   *
   * @param plainToken The current raw plaintext session token.
   * @returns The newly rotated plaintext token and the updated session entity.
   * @throws {AgoraError} INVALID_CREDENTIALS on failure or suspected theft.
   */
  async rotate(plainToken: string): Promise<CreateSessionResult> {
    try {
      const tokenHash = hashToken(plainToken);
      let session = await DrizzleSessionRepository.findActiveByToken(tokenHash);

      // Token Reuse Detection
      if (!session) {
        const stolenSession = await DrizzleSessionRepository.findByPreviousToken(tokenHash);

        if (stolenSession) {
          await DrizzleSessionRepository.revokeAllForUser(stolenSession.userId);
        }

        throw new AgoraError("INVALID_CREDENTIALS", "Session invalid, expired, or compromised.");
      }

      // Generate replacement
      const newPlainToken = createToken();
      const newTokenHash = hashToken(newPlainToken);

      session = await DrizzleSessionRepository.updateToken(session.id, newTokenHash, tokenHash);

      return {
        plainToken: newPlainToken,
        session,
      };
    } catch (e) {
      handleServiceError(e, "Error rotating session token.");
    }
  },

  /**
   * Soft-deletes (revokes) a specific session by its database ID.
   *
   * @param id The internal session database ID.
   * @returns The securely revoked session entity.
   */
  async revoke(id: string): Promise<Session> {
    try {
      return await DrizzleSessionRepository.revoke(id);
    } catch (e) {
      handleServiceError(e, `Error revoking session with ID ${id}.`);
    }
  },

  /**
   * Revokes an active session utilizing the plaintext session token format.
   *
   * @param plainToken The raw plaintext session token from the user request.
   * @returns The securely revoked session entity.
   * @throws {AgoraError} NOT_FOUND if the session didn't exist.
   */
  async revokeByToken(plainToken: string): Promise<Session> {
    try {
      const tokenHash = hashToken(plainToken);
      const session = await DrizzleSessionRepository.findByToken(tokenHash);

      if (!session) {
        throw new AgoraError("NOT_FOUND", "Session not found.");
      }

      return await DrizzleSessionRepository.revoke(session.id);
    } catch (e) {
      handleServiceError(e, "Error revoking session by token.");
    }
  },

  /**
   * Revokes all sessions belonging to a specific user.
   * Used for global logouts, password resets, or suspected security breaches.
   *
   * @param userId The ID of the user.
   * @returns An array of revoked session entities.
   */
  async revokeAllForUser(userId: string): Promise<Session[]> {
    try {
      return await DrizzleSessionRepository.revokeAllForUser(userId);
    } catch (e) {
      handleServiceError(e, `Error revoking all sessions for user ${userId}.`);
    }
  },

  /**
   * Permanently hard-deletes a session.
   * Prefer \`revoke()\` for standard auth flows.
   *
   * @param id The internal session database ID.
   * @returns The deleted session entity.
   */
  async delete(id: string): Promise<Session> {
    try {
      return await DrizzleSessionRepository.delete(id);
    } catch (e) {
      handleServiceError(e, `Error deleting session with ID ${id}.`);
    }
  },

  /**
   * Hard-deletes permanently expired sessions from the database
   * to free up storage space. Useful for cron jobs.
   *
   * @returns The number of sessions successfully deleted.
   */
  async deleteExpired(): Promise<number> {
    try {
      return (await DrizzleSessionRepository.deleteExpired()).length;
    } catch (e) {
      handleServiceError(e, "Error flushing expired sessions from database.");
    }
  },
};
