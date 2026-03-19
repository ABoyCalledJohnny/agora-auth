import type {
  ApiClient,
  NewApiClient,
  NewSession,
  NewVerificationToken,
  Session,
  VerificationToken,
} from "@/src/db/schema";
import type { Role, NewRole } from "@/src/db/schema/rbac";
import type { VerificationTokenType } from "@/src/config/constants";
import type { BaseRepository, CrudRepository } from "@/src/repositories/contracts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { apiClients } from "@/src/db/schema/index.ts";

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

const ClientInsertSchema = createInsertSchema(apiClients);

export const createClientSchema = ClientInsertSchema.pick({
  name: true,
  baseUrl: true,
  verifyEmailPath: true,
  resetPasswordPath: true,
  isActive: true,
}).extend({
  plainApiKey: z
    .string()
    .length(43)
    .regex(/^[A-Za-z0-9_-]+$/, "Must be a valid base64url string"),
});

export type CreateClientRequest = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.omit({ plainApiKey: true }).partial();

export type UpdateClientRequest = z.infer<typeof updateClientSchema>;
