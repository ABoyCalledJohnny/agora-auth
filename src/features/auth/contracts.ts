import type { VerificationTokenType } from "@/src/config/constants.ts";
import type {
  ApiClient,
  NewApiClient,
  NewSession,
  NewVerificationToken,
  Session,
  VerificationToken,
} from "@/src/db/schema/index.ts";
import type { NewRole, Role } from "@/src/db/schema/rbac.ts";
import type { BaseRepository, CrudRepository } from "@/src/repositories/contracts.ts";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { TOKEN_STRING_LENGTH } from "@/src/config/constants.ts";
import { apiClients, users } from "@/src/db/schema/index.ts";
import { passwordRules } from "@/src/lib/validation.ts";

export interface RoleRepository extends CrudRepository<
  Role,
  NewRole,
  Partial<Omit<NewRole, "id" | "createdAt" | "updatedAt">>
> {
  // Read
  findByName(name: string): Promise<Role | null>;
  getUserRoles(userId: string): Promise<Role[]>;

  // Update
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;
}

export interface ApiClientRepository extends CrudRepository<
  ApiClient,
  NewApiClient,
  Partial<Omit<NewApiClient, "id" | "createdAt" | "updatedAt">>
> {
  // Read
  findByName(name: string): Promise<ApiClient | null>;
  findByClientId(clientId: string): Promise<ApiClient | null>;
}

export interface SessionRepository extends BaseRepository<Session, NewSession> {
  // Read
  findByToken(tokenHash: string): Promise<Session | null>;
  findActiveByToken(tokenHash: string): Promise<Session | null>;
  findByPreviousToken(tokenHash: string): Promise<Session | null>;

  // Update
  updateToken(id: string, newTokenHash: string, oldTokenHash: string): Promise<Session>;

  // Revoke (Soft-Delete)
  revoke(id: string): Promise<Session>;
  revokeAllForUser(userId: string): Promise<Session[]>;

  // Delete (Hard-Delete)
  deleteExpired(): Promise<Session[]>;
}

export interface VerificationTokenRepository extends BaseRepository<VerificationToken, NewVerificationToken> {
  // Read
  findByToken(tokenHash: string): Promise<VerificationToken | null>;
  findByUserIdAndType(userId: string, type: VerificationTokenType): Promise<VerificationToken[]>;
  tryConsumeByToken(tokenHash: string, type: VerificationTokenType): Promise<VerificationToken | null>;

  // Delete
  deleteByUserIdAndType(userId: string, type: VerificationTokenType): Promise<number>;
  deleteExpired(): Promise<VerificationToken[]>;
}

/** Schema to validate high-entropy 32-byte base64url encoded tokens via API / JSON inputs */
export const tokenStringSchema = z
  .string()
  // 32 byte base64url is exactly 43 characters long
  .length(TOKEN_STRING_LENGTH, "Token format invalid (must be 43-character base64url string)")
  // Base64url character set standard
  .regex(/^[A-Za-z0-9_-]+$/, "Token format invalid (must be 43-character base64url string)");

const ClientSchema = createInsertSchema(apiClients);

export const createClientSchema = ClientSchema.pick({
  name: true,
  baseUrl: true,
  verifyEmailPath: true,
  resetPasswordPath: true,
  isActive: true,
  skipEmailVerification: true,
}).extend({
  plainApiKey: tokenStringSchema,
});

export type CreateClientRequest = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.omit({ plainApiKey: true }).partial();

export type UpdateClientRequest = z.infer<typeof updateClientSchema>;

const UserSchema = createInsertSchema(users);

export const registerSchema = UserSchema.pick({
  username: true,
  email: true,
}).extend({
  password: passwordRules((key) => key),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string(),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export const resetPasswordRequestSchema = UserSchema.pick({
  email: true,
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const resetPasswordConfirmSchema = z.object({
  token: tokenStringSchema,
  password: passwordRules((key) => key),
});

export type ResetPasswordConfirmRequest = z.infer<typeof resetPasswordConfirmSchema>;

export const logoutSchema = z.object({
  refreshToken: tokenStringSchema,
});

export type LogoutRequest = z.infer<typeof logoutSchema>;

export const refreshSchema = z.object({
  refreshToken: tokenStringSchema,
});

export type RefreshRequest = z.infer<typeof refreshSchema>;

export const verifyEmailSchema = z.object({
  token: tokenStringSchema,
});

export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;

export const resendVerifyEmailSchema = z.object({
  email: z.email(),
});

export type ResendVerifyEmailRequest = z.infer<typeof resendVerifyEmailSchema>;
