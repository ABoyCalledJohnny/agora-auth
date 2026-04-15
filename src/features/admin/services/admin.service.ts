import "server-only";

import type { AdminListUsersQuery, AdminUpdateUserStatusRequest } from "../contracts.ts";
import type { AdminListUsersResult } from "../types.ts";
import type { User } from "@/src/db/schema/index.ts";

import { AgoraError } from "@/src/lib/errors.ts";
import { handleServiceError } from "@/src/lib/service-error.ts";
import { DrizzleSessionRepository } from "@/src/repositories/session.repository.ts";
import { DrizzleUserRepository } from "@/src/repositories/user.repository.ts";

/**
 * Admin Service
 *
 * Admin-specific user management operations. Uses shared repositories
 * for data access, adding admin-level business rules (self-action guards,
 * session revocation).
 */
export const AdminService = {
  /** Lists users with pagination, filtering, sorting, and search. */
  async listUsers(query: AdminListUsersQuery): Promise<AdminListUsersResult> {
    try {
      return await DrizzleUserRepository.listPage(query);
    } catch (error) {
      handleServiceError(error, "Error listing users.");
    }
  },

  /**
   * Change a user's account status (e.g. activate, suspend).
   * Guards against admins changing their own status.
   * Revokes all active sessions when suspending a user.
   */
  async updateUserStatus(
    targetUserId: string,
    actorUserId: string,
    input: AdminUpdateUserStatusRequest,
  ): Promise<User> {
    try {
      // Self-action guard: prevent admins from suspending themselves.
      if (targetUserId === actorUserId) {
        throw new AgoraError("FORBIDDEN", "You cannot change your own account status.");
      }

      // Verify target user exists.
      const targetUser = await DrizzleUserRepository.findById(targetUserId);
      if (!targetUser) throw new AgoraError("NOT_FOUND", "User not found.");

      // No-op guard: reject if user is already in the requested status.
      if (targetUser.status === input.status) {
        throw new AgoraError("VALIDATION_ERROR", `User is already ${input.status}.`);
      }

      // Apply the status change.
      const updatedUser = await DrizzleUserRepository.update(targetUserId, { status: input.status });

      // If the user is being suspended, revoke all their active sessions.
      if (input.status === "suspended") {
        await DrizzleSessionRepository.revokeAllForUser(targetUserId);
      }

      return updatedUser;
    } catch (error) {
      handleServiceError(error, "Error updating user status.");
    }
  },

  /**
   * Permanently delete a user account.
   * Guards against admins deleting their own account.
   */
  async deleteUser(targetUserId: string, actorUserId: string): Promise<User> {
    try {
      // Self-action guard: prevent admins from deleting themselves.
      if (targetUserId === actorUserId) {
        throw new AgoraError("FORBIDDEN", "You cannot delete your own account.");
      }

      // Verify target user exists.
      const targetUser = await DrizzleUserRepository.findById(targetUserId);
      if (!targetUser) throw new AgoraError("NOT_FOUND", "User not found.");

      // Revoke all sessions before deletion.
      await DrizzleSessionRepository.revokeAllForUser(targetUserId);

      // Delete the user (cascades handled by DB constraints).
      return await DrizzleUserRepository.delete(targetUserId);
    } catch (error) {
      handleServiceError(error, "Error deleting user.");
    }
  },
};
