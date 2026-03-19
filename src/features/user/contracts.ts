import type { ListUsersPageInput, ListUsersPageResult } from "./types.ts";
import type { UserStatus } from "@/src/config/constants.ts";
import type { FullUser, NewUser, User, UserProfile, UserSettings } from "@/src/db/schema/index.ts";
import type { CrudRepository } from "@/src/repositories/contracts.ts";

export interface UserRepository extends CrudRepository<
  User,
  NewUser,
  Partial<Omit<NewUser, "id" | "createdAt" | "updatedAt">>
> {
  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByRoleId(roleId: string): Promise<User[]>;
  findByStatus(status: UserStatus): Promise<User[]>;
  listPage(input: ListUsersPageInput): Promise<ListUsersPageResult>;

  // Aggregate Reads
  findByIdWithDetails(id: string): Promise<FullUser | null>;

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  // Sub-Entities (Profile & Settings)
  updateProfile(
    userId: string,
    data: Partial<Omit<UserProfile, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<UserProfile>;
  updateSettings(
    userId: string,
    data: Partial<Omit<UserSettings, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<UserSettings>;

  // -------------------------------------------------------------------------
  // Security
  // -------------------------------------------------------------------------
  getPasswordHash(userId: string): Promise<string | null>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
}
