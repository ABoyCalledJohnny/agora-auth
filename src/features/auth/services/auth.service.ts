import type { LoginRequest, RegisterRequest, ResetPasswordConfirmRequest, ResetPasswordRequest } from "../contracts.ts";
import type { AuthTokens, LoginResponse } from "../types.ts";
import type { ApiClient, User } from "@/src/db/schema/index.ts";

import { RESERVED_USERNAMES } from "@/src/config/constants.ts";
import { appConfig } from "@/src/config/index.ts";
import { hashPassword, verifyPassword } from "@/src/lib/crypto.ts";
import { AgoraError, handleServiceError } from "@/src/lib/errors.ts";
import { createPublicId, parseDuration } from "@/src/lib/utils.ts";
import { DrizzleRoleRepository } from "@/src/repositories/role.repository.ts";
import { DrizzleUserRepository } from "@/src/repositories/user.repository.ts";

import { JwtService } from "./jwt.service.ts";
import { SessionService } from "./session.service.ts";
import { VerificationTokenService } from "./verification-token.service.ts";

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
      if ((await DrizzleUserRepository.findByUsername(input.username)) || RESERVED_USERNAMES.has(input.username))
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
        throw new AgoraError("NOT_IMPLEMENTED");
        // const verificationToken = await VerificationTokenService.create({userId: newUser.id, type: 'email_verification'});
      }

      // 5. Dispatch the welcome/verification email using the NotificationService.

      // 6. Return the safely mapped user object (omit password).
      return newUser;
    } catch (error) {
      handleServiceError(error, "Error during user registration.");
    }
  },

  /**
   * 2. Login Flow
   */
  async login(input: LoginRequest, ipAddress: string, userAgent: string): Promise<LoginResponse> {
    try {
      // 1. Look up the user by email OR username (input.identifier).
      const user = await DrizzleUserRepository.findByIdentifier(input.identifier);

      let isCorrectPassword = false;

      if (user) {
        // User exists, check real password
        const hashedPassword = await DrizzleUserRepository.getPasswordHash(user.id);
        if (hashedPassword) {
          isCorrectPassword = await verifyPassword(input.password, hashedPassword);
        }
      } else {
        // 🔒 TIMING ATTACK MITIGATION
        // User doesn't exist. Hash a dummy password anyway so the execution time is identical
        // This prevents attackers from knowing which emails exist simply by measuring response times.
        await hashPassword(input.password);
      }

      if (!user || !isCorrectPassword) throw new AgoraError("INVALID_CREDENTIALS");

      // 3. Check account state
      if (user.status === "pending") throw new AgoraError("ACCOUNT_PENDING");
      if (user.status === "suspended") throw new AgoraError("ACCOUNT_SUSPENDED");

      // 4. Update the user's last sign-in timestamp
      await DrizzleUserRepository.update(user.id, {
        lastSignInAt: new Date(),
      });

      // 5. Generate Session / Refresh Token
      const refreshTokenWrapper = await SessionService.create({
        userId: user.id,
        ipAddress,
        userAgent,
      });

      const userRoles = await DrizzleRoleRepository.getUserRoles(user.id);

      // 6. Generate short-lived Access Token
      const accessToken = await JwtService.sign({
        sub: user.id,
        sid: refreshTokenWrapper.session.id,
        username: user.username,
        roles: userRoles,
      });

      // Calculate exact expiration ISO string to align with the JWT `exp` claim.
      const expiresAt = new Date(Date.now() + parseDuration(appConfig.auth.accessTokenExpiry)).toISOString();

      // 6. Return both tokens along with the safe user object
      return {
        accessToken,
        refreshToken: refreshTokenWrapper.plainToken,
        expiresAt,
        user,
      };
    } catch (error) {
      handleServiceError(error, "Error during user login.");
    }
  },

  /**
   * 3. Refresh Flow
   */
  async refresh(plainSessionToken: string): Promise<AuthTokens> {
    try {
      // 1. Call `SessionService.rotate(plainSessionToken)` to invalidate the old refresh token and get a new one.
      //    (This inherently checks for Token Reuse and triggers full revocation if stolen).
      const refreshTokenWrapper = await SessionService.rotate(plainSessionToken);

      // 2. Lookup the user from the rotated session's `userId` to ensure they are still active (not suspended/deleted).
      const user = await DrizzleUserRepository.findById(refreshTokenWrapper.session.userId);
      if (!user) throw new AgoraError("UNAUTHORIZED");
      if (user.status === "pending") throw new AgoraError("ACCOUNT_PENDING");
      if (user.status === "suspended") throw new AgoraError("ACCOUNT_SUSPENDED");

      // 3. Call `JwtService.sign(payload)` to generate a fresh Access Token reflecting their current roles.
      const userRoles = await DrizzleRoleRepository.getUserRoles(user.id);
      const accessToken = await JwtService.sign({
        sub: user.id,
        sid: refreshTokenWrapper.session.id,
        username: user.username,
        roles: userRoles,
      });

      const expiresAt = new Date(Date.now() + parseDuration(appConfig.auth.accessTokenExpiry)).toISOString();

      // 4. Return new Access Token and new Refresh Token.
      return {
        accessToken,
        refreshToken: refreshTokenWrapper.plainToken,
        expiresAt,
      };
    } catch (error) {
      handleServiceError(error, "Error refreshing session tokens.");
    }
  },

  /**
   * 4. Logout Flow
   */
  async logout(plainSessionToken: string): Promise<void> {
    try {
      // 1. Terminate the session in the database via the token.
      await SessionService.revokeByToken(plainSessionToken);
    } catch (error) {
      handleServiceError(error, "Error logging out user.");
    }
  },

  /**
   * 5. Verification & Recovery Flows
   */

  async requestVerificationEmail(email: string, client: ApiClient): Promise<void> {
    try {
      // 1. Look up the user by email
      const user = await DrizzleUserRepository.findByEmail(email);

      // Security Best Practice: Silently succeed if user is not found, or already verified
      if (!user || user.status !== "pending") return;

      if (!client.skipEmailVerification) {
        // 2. Create verification token
        const { plainToken } = await VerificationTokenService.create({
          userId: user.id,
          type: "email_verification",
        });

        // 3. Dispatch the email using NotificationService
        // await NotificationService.sendVerificationEmail(user.email, plainToken, client);
        void plainToken; // Remove this once NotificationService is implemented
      }
      // Remove this throw once NotificationService is implemented
      throw new AgoraError("NOT_IMPLEMENTED");
    } catch (error) {
      handleServiceError(error, "Error requesting verification email.");
    }
  },

  async verifyEmail(plainToken: string): Promise<void> {
    try {
      // 1. Consume the token to ensure it's valid and unused
      const consumedToken = await VerificationTokenService.consume(plainToken, "email_verification");

      // 2. Fetch the user to determine if we should transition their status
      const user = await DrizzleUserRepository.findById(consumedToken.userId);
      if (!user) throw new AgoraError("NOT_FOUND", "User associated with this token no longer exists.");

      // 3. Mark the email as verified, and activate the user if they were pending
      await DrizzleUserRepository.update(consumedToken.userId, {
        emailVerifiedAt: new Date(),
        ...(user.status === "pending" && { status: "active" }),
      });
    } catch (error) {
      handleServiceError(error, "Error verifying email.");
    }
  },

  async requestPasswordReset(input: ResetPasswordRequest, client: ApiClient): Promise<void> {
    try {
      // 1. Look up the user by email (input.email).
      const user = await DrizzleUserRepository.findByEmail(input.email);

      // Security Best Practice: To prevent user enumeration attacks, we do not throw an error
      // if the email doesn't exist in our system. We silently succeed.
      if (user) {
        // 2. Create token.
        const verificationToken = await VerificationTokenService.create({ userId: user.id, type: "password_reset" });

        // 3. Dispatch the password reset email using the NotificationService.
        // await NotificationService.sendPasswordResetEmail(user.email, plainToken, client);
        void verificationToken; // Remove this once NotificationService is implemented
        void client;
      }
      // Remove this throw once NotificationService is implemented
      throw new AgoraError("NOT_IMPLEMENTED");
    } catch (error) {
      handleServiceError(error, "Error requesting password reset.");
    }
  },

  async resetPassword(input: ResetPasswordConfirmRequest): Promise<void> {
    try {
      // 1. Consume the token to get the target userId and guarantee it was valid/unused.
      const consumedToken = await VerificationTokenService.consume(input.token, "password_reset");

      // 2. Hash the new password securely via Argon2.
      const hashedPassword = await hashPassword(input.password);

      // 3. Update the user's credentials in the `user_credentials` table via the `UserRepository`.
      await DrizzleUserRepository.setPasswordHash(consumedToken.userId, hashedPassword);

      // 4. Invalidate all active sessions across all devices for security.
      // E.g., if their email was compromised, kicking out attackers is mandatory.
      await SessionService.revokeAllForUser(consumedToken.userId);
    } catch (error) {
      handleServiceError(error, "Error resetting password.");
    }
  },
};
