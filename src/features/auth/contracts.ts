import type {
  ApiClient,
  NewApiClient,
  NewSession,
  NewVerificationToken,
  Session,
  VerificationToken,
} from "@/src/db/schema";
import type { Role, NewRole } from "@/src/db/schema/rbac";

export interface RoleRepository {
  // Create
  create(data: NewRole): Promise<Role>;

  // Read
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  getUserRoles(userId: string): Promise<Role[]>;

  // Update
  update(id: string, data: Partial<NewRole>): Promise<Role>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;

  // Delete
  delete(id: string): Promise<Role>;
}

export interface ApiClientRepository {
  // Create
  create(data: NewApiClient): Promise<ApiClient>;

  // Read
  findById(id: string): Promise<ApiClient | null>;
  findByName(name: string): Promise<ApiClient | null>;
  findByClientId(clientId: string): Promise<ApiClient | null>;
  findAll(): Promise<ApiClient[]>;

  // Update
  update(id: string, data: Partial<NewApiClient>): Promise<ApiClient>;

  // Delete
  delete(id: string): Promise<ApiClient>;
}

// src/features/auth/contracts.ts
export interface SessionRepository {
  // Create
  create(data: NewSession): Promise<Session>;

  // Read
  findById(id: string): Promise<Session | null>;
  findByToken(tokenHash: string): Promise<Session | null>;

  // Update
  updateToken(id: string, newTokenHash: string, oldTokenHash: string): Promise<Session>;

  // Revoke (Soft-Delete)
  revoke(id: string): Promise<Session>;
  revokeAllForUser(userId: string): Promise<Session[]>;

  // Delete (Hard-Delete)
  delete(id: string): Promise<Session>;
  deleteExpired(): Promise<Session[]>;
}

export interface VerificationTokenRepository {
  // Create
  create(data: NewVerificationToken): Promise<VerificationToken>;

  // Read
  findById(id: string): Promise<VerificationToken | null>;
  findByToken(tokenHash: string): Promise<VerificationToken | null>;
  findByUserIdAndType(userId: string, type: string): Promise<VerificationToken[]>;

  // Delete
  delete(id: string): Promise<VerificationToken>;
  deleteByUserIdAndType(userId: string, type: string): Promise<number>;
  deleteExpired(): Promise<VerificationToken[]>;
}
