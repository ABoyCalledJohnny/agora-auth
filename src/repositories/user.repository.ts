/**
 * User Repository
 *
 * Data-access layer for user accounts, profiles, settings, and credentials.
 * Works with the Drizzle ORM and PostgreSQL.
 */

import type { UserStatus } from "@/src/config/constants.ts";
import type { UserWithRolesAndProfile } from "@/src/db/schema/index.ts";
import type { UserRepository } from "@/src/features/user/contracts.ts";

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/src/db/index.ts";
import {
  type FullUser,
  type NewUser,
  type User,
  userCredentials,
  type UserProfile,
  userProfiles,
  users,
  type UserSettings,
  userSettings,
  usersRoles,
} from "@/src/db/schema/index.ts";

import { AgoraError } from "../lib/errors.ts";

export const DrizzleUserRepository: UserRepository = {
  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------
  /**
   * Creates a new user in a strictly atomic database transaction,
   * guaranteeing synchronised generation of linked profiles and settings.
   *
   * @param data The validated payload for creating a user.
   * @returns The fully persisted root User entity.
   * @throws {AgoraError} EMAIL_EXISTS if email constraint is violated.
   * @throws {AgoraError} USERNAME_EXISTS if username constraint is violated.
   */
  async create(data: NewUser): Promise<User> {
    try {
      const newUser = await db.transaction(async (tx) => {
        // 2. Insert the user and capture the result.
        const [createdUser] = await tx.insert(users).values(data).returning();

        if (!createdUser) {
          // Throwing inside a transaction automatically triggers a ROLLBACK.
          throw new AgoraError("INTERNAL", "User creation failed.");
        }

        // 3. Create the dependent records using the ID from step 2.
        await tx.insert(userProfiles).values({ userId: createdUser.id });
        await tx.insert(userSettings).values({ userId: createdUser.id });

        // 4. Return the created user out of the transaction.
        return createdUser;
      });

      return newUser;
    } catch (error: unknown) {
      if (error instanceof AgoraError) throw error;

      // PostgreSQL unique constraint violation code is '23505'.
      const pgError = error as Record<string, unknown>;
      if (pgError && pgError.code === "23505") {
        const errorDetails = String(pgError.constraint || pgError.detail || pgError.message).toLowerCase();
        if (errorDetails.includes("email")) throw new AgoraError("EMAIL_EXISTS");
        if (errorDetails.includes("username")) throw new AgoraError("USERNAME_EXISTS");
        throw new AgoraError("INTERNAL", "A duplicate user constraint violation occurred.");
      }

      throw new AgoraError("INTERNAL", "A database error occurred while creating the user.");
    }
  },

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------
  /**
   * Looks up a user by their internal database ID.
   *
   * @param id The internal database ID.
   * @returns The resolved User object, or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  },

  /**
   * Fetches a user by their unique username.
   *
   * @param username The exact username to look up.
   * @returns The resolved User, or null if not found.
   */
  async findByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user ?? null;
  },

  /**
   * Fetches a user by their registered email address.
   *
   * @param email The email address to query.
   * @returns The resolved User, or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  },

  async findByIdentifier(identifier: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)))
      .limit(1);
    return user ?? null;
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
    const result = await db.select().from(users).where(eq(users.status, status));
    return result;
  },

  /**
   * Retrieves a paginated list of users with optional filtering, searching, and sorting.
   *
   * @param page The current page number (1-based).
   * @param limit How many records to return per page.
   * @param status Optional account status filter.
   * @param roleId Optional role ID filter.
   * @param search Optional case-insensitive substring search on username or email.
   * @param sortBy Column to sort by. Defaults to 'createdAt'.
   * @param sortDirection Sort direction ('asc' or 'desc').
   */
  async listPage({ page, limit, status, search, roleId, sortBy = "createdAt", sortDirection = "desc" }) {
    // Offset calculates the number of rows to skip.
    // Page 2 with limit 10 skips the first 10 items: (2 - 1) * 10 = 10.
    const offset = (page - 1) * limit;

    // Search condition: case-insensitive LIKE on username or email.
    // If `search` is not provided, evaluates to `undefined` and Drizzle ignores it.
    const searchCondition = search
      ? or(ilike(users.username, `%${search}%`), ilike(users.email, `%${search}%`))
      : undefined;

    // Role condition: sub-query on the users_roles junction table.
    const roleCondition = roleId
      ? inArray(
          users.id,
          db.select({ userId: usersRoles.userId }).from(usersRoles).where(eq(usersRoles.roleId, roleId)),
        )
      : undefined;

    // Status condition.
    const statusCondition = status ? eq(users.status, status) : undefined;

    // Combined filter. In Drizzle, `undefined` conditions passed to `and()` are safely ignored.
    const whereClause = and(statusCondition, roleCondition, searchCondition);

    // Map the sort string to an actual database column reference to prevent SQL injection.
    const sortColumn =
      sortBy === "username"
        ? users.username
        : sortBy === "email"
          ? users.email
          : sortBy === "updatedAt"
            ? users.updatedAt
            : users.createdAt;

    // Build the ORDER BY clause.
    const orderByClause = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

    const items: UserWithRolesAndProfile[] = await db.query.users.findMany({
      where: whereClause,
      orderBy: orderByClause,
      limit,
      offset,
      with: {
        roles: { with: { role: true } },
        profile: true,
      },
    });

    const totalResult = whereClause
      ? await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereClause)
      : await db.select({ count: sql<number>`count(*)` }).from(users);

    const total = Number(totalResult[0]?.count ?? 0);

    return { items, total, page, limit };
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
            role: true, // Traverse the junction table and fetch the actual Role entity.
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
  /**
   * Applies partial updates to the root User entity table.
   *
   * @param id The internal ID of the target user.
   * @param data Partial subset of user properties.
   * @returns The updated User object.
   * @throws {AgoraError} NOT_FOUND if the target does not exist.
   * @throws {AgoraError} EMAIL_EXISTS if unique constraint is violated on email.
   */
  async update(id: string, data: Partial<Omit<NewUser, "id" | "createdAt" | "updatedAt">>): Promise<User> {
    try {
      const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();

      if (!updatedUser) throw new AgoraError("NOT_FOUND", "User not found.");
      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof AgoraError) throw error;
      const pgError = error as Record<string, unknown>;
      if (pgError && pgError.code === "23505") {
        const errorDetails = String(pgError.constraint || pgError.detail || pgError.message).toLowerCase();
        if (errorDetails.includes("email")) throw new AgoraError("EMAIL_EXISTS");
        if (errorDetails.includes("username")) throw new AgoraError("USERNAME_EXISTS");
        throw new AgoraError("INTERNAL", "A duplicate user constraint violation occurred.");
      }
      throw new AgoraError("INTERNAL", "A database error occurred while updating the user.");
    }
  },

  // Sub-Entities (Profile & Settings)
  /**
   * Applies partial updates to the user's profile.
   *
   * @param userId The internal root user ID.
   * @param data Partial subset of user profile properties.
   * @returns The updated UserProfile object.
   */
  async updateProfile(
    userId: string,
    data: Partial<Omit<UserProfile, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<UserProfile> {
    try {
      const [updatedUserProfile] = await db
        .update(userProfiles)
        .set(data)
        .where(eq(userProfiles.userId, userId))
        .returning();

      if (!updatedUserProfile) throw new AgoraError("NOT_FOUND", "User profile not found.");
      return updatedUserProfile;
    } catch (error) {
      if (error instanceof AgoraError) throw error;
      throw new AgoraError("INTERNAL", "A database error occurred while updating the user profile.");
    }
  },

  /**
   * Applies partial updates to the user's settings.
   *
   * @param userId The internal root user ID.
   * @param data Partial subset of user settings properties.
   * @returns The updated UserSettings object.
   */
  async updateSettings(
    userId: string,
    data: Partial<Omit<UserSettings, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<UserSettings> {
    try {
      const [updatedUserSettings] = await db
        .update(userSettings)
        .set(data)
        .where(eq(userSettings.userId, userId))
        .returning();

      if (!updatedUserSettings) throw new AgoraError("NOT_FOUND", "User settings not found.");
      return updatedUserSettings;
    } catch (error) {
      if (error instanceof AgoraError) throw error;
      throw new AgoraError("INTERNAL", "A database error occurred while updating the user settings.");
    }
  },

  // -------------------------------------------------------------------------
  // Security
  // -------------------------------------------------------------------------
  /**
   * Retrieves solely the encrypted password hash for a user.
   * Architectural separation of credentials prevents leaky data returns.
   *
   * @param userId The target user ID.
   * @returns The raw hash string, or null if not found.
   */
  async getPasswordHash(userId: string): Promise<string | null> {
    const result = await db
      .select({ passwordHash: userCredentials.passwordHash })
      .from(userCredentials)
      .where(eq(userCredentials.userId, userId))
      .limit(1);

    return result[0]?.passwordHash || null;
  },

  /**
   * Persists or overwrites the secure hash for a specific user ID.
   * Automatically upserts using PostgreSQL `onConflictDoUpdate`.
   *
   * @param userId The target user ID.
   * @param passwordHash The newly computed Argon2 hash.
   */
  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await db.insert(userCredentials).values({ userId, passwordHash }).onConflictDoUpdate({
      target: userCredentials.userId,
      set: { passwordHash },
    });
  },

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  /**
   * Permanently deletes a user from the database.
   * Cascades remove corresponding roles and related entities.
   *
   * @param id The internal user ID.
   * @returns The deleted User entity.
   * @throws {AgoraError} NOT_FOUND if the target does not exist.
   */
  async delete(id: string): Promise<User> {
    const [deletedUser] = await db.delete(users).where(eq(users.id, id)).returning();
    if (!deletedUser) throw new AgoraError("NOT_FOUND", "User not found.");
    return deletedUser;
  },
};
