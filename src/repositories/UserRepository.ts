import type { UserStatus } from "@/src/config/constants";
import { db } from "@/src/db";
import {
  type FullUser,
  type NewUser,
  type User,
  type UserProfile,
  type UserSettings,
  userProfiles,
  userSettings,
  users,
  usersRoles,
  userCredentials,
} from "@/src/db/schema";
import type { UserRepository } from "@/src/features/user/contracts";
import { eq } from "drizzle-orm";
import { AgoraError } from "../lib/errors";

export const DrizzleUserRepository: UserRepository = {
  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------
  async create(data: NewUser): Promise<User> {
    const newUser = await db.transaction(async (tx) => {
      // 2. Do the first insert and capture it
      const [createdUser] = await tx.insert(users).values(data).returning();

      if (!createdUser) {
        // Throwing inside a transaction automatically triggers a ROLLBACK
        throw new AgoraError("INTERNAL", "User creation failed.");
      }

      // 3. Do the dependent inserts using the ID from step 2
      await tx.insert(userProfiles).values({ userId: createdUser.id });
      await tx.insert(userSettings).values({ userId: createdUser.id });

      // 4. Return the object we want to "bubble up" out of the transaction
      return createdUser;
    });

    return newUser;
  },

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------
  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  },

  async findAll(): Promise<User[]> {
    return await db.select().from(users);
  },

  async findByRoleId(roleId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        publicId: users.publicId,
        username: users.username,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastSignInAt: users.lastSignInAt,
      })
      .from(usersRoles)
      .innerJoin(users, eq(usersRoles.userId, users.id))
      .where(eq(usersRoles.roleId, roleId));

    return result;
  },

  async findByStatus(status: UserStatus): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.status, status)).limit(1);
    return result;
  },

  // -------------------------------------------------------------------------
  // Aggregate Reads
  // -------------------------------------------------------------------------
  async findByIdWithDetails(id: string): Promise<FullUser | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        roles: {
          with: {
            role: true, // <-- This tells Drizzle to traverse the junction table and fetch the actual Role entity
          },
        },
        settings: true,
        profile: true,
      },
    });

    if (!result) return null;
    return result;
  },

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  async update(id: string, data: Partial<Omit<NewUser, "id" | "createdAt" | "updatedAt">>): Promise<User> {
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();

    if (!updatedUser) throw new AgoraError("NOT_FOUND", "User not found.");
    return updatedUser;
  },

  // Sub-Entities (Profile & Settings)
  async updateProfile(
    userId: string,
    data: Partial<Omit<UserProfile, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<UserProfile> {
    const [updatedUserProfile] = await db
      .update(userProfiles)
      .set(data)
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (!updatedUserProfile) throw new AgoraError("NOT_FOUND", "User not found.");
    return updatedUserProfile;
  },

  async updateSettings(
    userId: string,
    data: Partial<Omit<UserSettings, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<UserSettings> {
    const [updatedUserSettings] = await db
      .update(userSettings)
      .set(data)
      .where(eq(userSettings.userId, userId))
      .returning();

    if (!updatedUserSettings) throw new AgoraError("NOT_FOUND", "User not found.");
    return updatedUserSettings;
  },

  // -------------------------------------------------------------------------
  // Security
  // -------------------------------------------------------------------------
  async getPasswordHash(userId: string): Promise<string | null> {
    const result = await db
      .select({ passwordHash: userCredentials.passwordHash })
      .from(userCredentials)
      .where(eq(userCredentials.userId, userId))
      .limit(1);

    return result[0]?.passwordHash || null;
  },

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await db.insert(userCredentials).values({ userId, passwordHash }).onConflictDoUpdate({
      target: userCredentials.userId,
      set: { passwordHash },
    });
  },

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  async delete(id: string): Promise<User> {
    const [deletedUser] = await db.delete(users).where(eq(users.id, id)).returning();
    if (!deletedUser) throw new AgoraError("NOT_FOUND", "User not found.");
    return deletedUser;
  },
};
