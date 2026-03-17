import type { UserStatus } from "@/src/config/constants";
import type { FullUser, NewUser, User, UserProfile, UserSettings } from "@/src/db/schema";

export interface UserRepository {
  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------
  create(data: NewUser): Promise<User>;

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findByRoleId(roleId: string): Promise<User[]>;
  findByStatus(status: UserStatus): Promise<User[]>;

  // Aggregate Reads
  findByIdWithDetails(id: string): Promise<FullUser | null>;

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  update(id: string, data: Partial<NewUser>): Promise<User>;

  // Sub-Entities (Profile & Settings)
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
  updateSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings>;

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  delete(id: string): Promise<User>;
}
