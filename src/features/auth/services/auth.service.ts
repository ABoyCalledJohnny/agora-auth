import type { LoginRequest, NewPasswordRequest, RegisterRequest, ResetPasswordRequest } from "../contracts.ts";
import type { ApiClient, User } from "@/src/db/schema/index.ts";

import { RESERVED_USERNAMES } from "@/src/config/constants.ts";
import { hashPassword } from "@/src/lib/crypto.ts";
import { AgoraError, handleServiceError } from "@/src/lib/errors.ts";
import { createPublicId } from "@/src/lib/utils.ts";
import { DrizzleUserRepository } from "@/src/repositories/user.repository.ts";

import { VerificationTokenService } from "./verification-token.service.ts";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

/**
 * AuthService
 *
 * Central orchestrator (Facade) for user authentication and identity flows.
 * Connects repositories, session management, and verification token logic
 * into cohesive user journeys.
 */
export const AuthService = {
  /**
   * 1. Registration Flow
   */
  async register(input: RegisterRequest, client: ApiClient): Promise<User> {
    try {
      //  1. Check for duplicates.
      if (await DrizzleUserRepository.findByEmail(input.email)) throw new AgoraError("EMAIL_EXISTS");
      if (
        (await DrizzleUserRepository.findByUsername(input.username)) ||
        (RESERVED_USERNAMES as readonly string[]).includes(input.username)
      )
        throw new AgoraError("USERNAME_EXISTS");

      // 2. Hash the user's plaintext password.
      const hashedPassword = await hashPassword(input.password);

      // 3. Save the new user and their credentials to the database.
      const newUser = await DrizzleUserRepository.create({
        publicId: createPublicId(),
        username: input.username,
        email: input.email,
      });
      await DrizzleUserRepository.setPasswordHash(newUser.id, hashedPassword);

      // TODO Implement/finalise after NotificationService creation.

      // 4. If email verification is required: Create a verification token via `VerificationTokenService.create()`.
      if (!client.skipEmailVerification) {
        // const verificationToken = await VerificationTokenService.create({userId: newUser.id, type: 'email_verification'});
      }

      // 5. Dispatch the welcome/verification email using the NotificationService.

      // 6. Return the safely mapped user object (omit password).
      return newUser;
    } catch (e) {
      handleServiceError(e, "Error during user registration.");
    }
  },

  /**
   * 2. Login Flow
   */
  async login(input: LoginRequest, ipAddress: string, userAgent: string): Promise<LoginResponse> {
    try {
      // TODO: IMPLEMENTATION STEPS
      // 1. Look up the user by email OR username (input.identifier) using UserRepository.
      //    If not found, throw INVALID_CREDENTIALS to prevent user enumeration.
      // 2. Verify the password hash via `verifyPassword()` from crypto.ts. Throw INVALID_CREDENTIALS if it fails.
      // 3. Check account state (e.g., throw ACCOUNT_PENDING if email verification is mandatory and they haven't verified).
      // 4. Call `SessionService.create({ userId, ipAddress, userAgent })` to generate a Refresh Token.
      // 5. Call `JwtService.sign(payload)` to generate a short-lived Access Token.
      // 6. Return both tokens along with the safe user object.

      throw new Error("Not implemented");
    } catch (e) {
      handleServiceError(e, "Error during user login.");
    }
  },

  /**
   * 3. Refresh Flow
   */
  async refresh(plainSessionToken: string): Promise<AuthTokens> {
    try {
      // TODO: IMPLEMENTATION STEPS
      // 1. Call `SessionService.rotate(plainSessionToken)` to invalidate the old refresh token and get a new one.
      //    (This inherently checks for Token Reuse and triggers full revocation if stolen).
      // 2. Lookup the user from the rotated session's `userId` to ensure they are still active (not suspended/deleted).
      // 3. Call `JwtService.sign(payload)` to generate a fresh Access Token reflecting their current roles.
      // 4. Return new Access Token and new Refresh Token.

      throw new Error("Not implemented");
    } catch (e) {
      handleServiceError(e, "Error refreshing session tokens.");
    }
  },

  /**
   * 4. Logout Flow
   */
  async logout(plainSessionToken: string): Promise<void> {
    try {
      // TODO: IMPLEMENTATION STEPS
      // 1. Call `SessionService.revokeByToken(plainSessionToken)` to formally terminate it in the database.
      // 2. (Optional) Any other cleanup tasks if necessary.

      throw new Error("Not implemented");
    } catch (e) {
      handleServiceError(e, "Error logging out user.");
    }
  },

  /**
   * 5. Verification & Recovery Flows
   */

  async verifyEmail(plainToken: string): Promise<void> {
    try {
      // TODO: IMPLEMENTATION STEPS
      // 1. Call `VerificationTokenService.consume(plainToken, "email_verification")`.
      // 2. Update the user record (`emailVerified: new Date()`) using UserRepository.

      throw new Error("Not implemented");
    } catch (e) {
      handleServiceError(e, "Error verifying email.");
    }
  },

  async requestPasswordReset(input: ResetPasswordRequest): Promise<void> {
    try {
      // TODO: IMPLEMENTATION STEPS
      // 1. Look up the user by email (input.email).
      // 2. If user exists, call `VerificationTokenService.create({ userId, type: "password_reset" })`.
      // 3. Dispatch the password reset email using the MailService.
      //    (Security Best Practice: Do not throw an error if the user doesn't exist, just return silently to prevent email enumeration).

      throw new Error("Not implemented");
    } catch (e) {
      handleServiceError(e, "Error requesting password reset.");
    }
  },

  async resetPassword(plainToken: string, input: NewPasswordRequest): Promise<void> {
    try {
      // TODO: IMPLEMENTATION STEPS
      // 1. Call `VerificationTokenService.consume(plainToken, "password_reset")` to get the target userId.
      // 2. Hash the `input.password` via `hashPassword()`.
      // 3. Update the user's credentials in `user_credentials` table.
      // 4. (Recommended) Call `SessionService.revokeAllForUser(userId)` to invalidate all active sessions in case of account compromise.

      throw new Error("Not implemented");
    } catch (e) {
      handleServiceError(e, "Error resetting password.");
    }
  },
};
