import type { UserStatus } from "@/src/config/constants.ts";
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
   * Creates a new user in the database. Initiates a strictly atomic database transaction
   * guaranteeing synchronized generation of linked `userProfiles` and `userSettings`.
   *
   * @param data The validated payload for generating a user.
   * @returns The fully persisted root User entity.
   * @throws {AgoraError} EMAIL_EXISTS if email constraint violated.
   * @throws {AgoraError} USERNAME_EXISTS if username constraint violated.
   *
   */
  async create(data: NewUser): Promise<User> {
    try {
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
    } catch (e: unknown) {
      if (e instanceof AgoraError) throw e;

      // PostgreSQL unique constraint violation code is '23505'
      const pgError = e as Record<string, unknown>;
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
   * Looks up a user completely internally via their database auto-increment ID.
   *
   * @param id The internal database ID.
   * @returns The resolved User object, or null if missing.
   *
   */
  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  },

  /**
   * Fetches a user specifically by their registered, unique username.
   * Supports authentication architectures where users login via handles.
   *
   * @param username The exactly spelled domain username.
   * @returns The resolved User, or null if missing.
   *
   */
  async findByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user ?? null;
  },

  /**
   * Fetches a user specifically by their registered email address exactly.
   * Standard query path for generic authentication flows.
   *
   * @param email The valid email address to query.
   * @returns The resolved User, or null if missing.
   *
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
   * Retrieves a paginated list of users, with optional filtering, searching, and sorting.
   *
   * @param page - The current page number (e.g. 1). Used to calculate how many records to skip.
   * @param limit - How many records to return per page (e.g. 10).
   * @param status - (Optional) Filter users by their account status (e.g. 'active', 'suspended'). If omitted, all statuses are returned.
   * @param roleId - (Optional) Filter users by a specific assigned role ID.
   * @param search - (Optional) Text string to search for. If provided, checks if the username OR email contains this text (case-insensitive).
   * @param sortBy - Which column to sort the results by (e.g. 'username', 'email', 'createdAt'). Defaults to 'createdAt'.
   * @param sortDirection - The direction to sort the column ('asc' for A-Z / newest first, 'desc' for Z-A / oldest first).
   */
  async listPage({ page, limit, status, search, roleId, sortBy = "createdAt", sortDirection = "desc" }) {
    // Offset calculates the number of rows to skip before beginning to return rows.
    // If you are on page 2 and want 10 items, you skip the first 10 items: (2 - 1) * 10 = 10.
    const offset = (page - 1) * limit;

    // Search condition: We use Drizzle's `ilike` operator (case-insensitive LIKE) to check
    // if the substring (`%search%`) matches either the username or the email.
    // If `search` is not provided, this simply evaluates to `undefined` and Drizzle ignores it.
    const searchCondition = search
      ? or(ilike(users.username, `%${search}%`), ilike(users.email, `%${search}%`))
      : undefined;

    // Role condition: If filtering by a roleId, we look up users whose ID exists in the usersRoles junction table.
    const roleCondition = roleId
      ? inArray(
          users.id,
          db.select({ userId: usersRoles.userId }).from(usersRoles).where(eq(usersRoles.roleId, roleId)),
        )
      : undefined;

    // Filter condition: We use `and()` to combine multiple conditions.
    // In Drizzle, if any condition passed to `and()` is `undefined`, it is safely ignored.
    const whereClause = and(status ? eq(users.status, status) : undefined, roleCondition, searchCondition);

    // Sorting string to DB column mapping: Since user input (`sortBy` 'username') is just a string,
    // we explicitly map it to the actual database column reference (like `users.username`) to
    // guarantee no generic strings end up in the raw SQL (which prevents SQL injection).
    const sortColumn =
      sortBy === "username"
        ? users.username
        : sortBy === "email"
          ? users.email
          : sortBy === "updatedAt"
            ? users.updatedAt
            : users.createdAt;

    // Create the final ORDER BY clause utilizing Drizzle's `asc` and `desc` helper functions
    // wrapping our chosen database column.
    const orderByClause = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Fetch the paginated rows from the database (e.g. "select * from users where ... order by ... limit 10 offset 10")
    const items = whereClause
      ? await db.select().from(users).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset)
      : await db.select().from(users).orderBy(orderByClause).limit(limit).offset(offset);

    // Count query: A data table needs to know the total number of items available to render
    // its pagination numbers (e.g. "Page 1 of 5"). We issue a separate query to just get the count.
    const totalResult = whereClause
      ? await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereClause)
      : await db.select({ count: sql<number>`count(*)` }).from(users);

    const total = totalResult[0]?.count ?? 0;

    // Return the required struct for standard paginated responses.
    return {
      items,
      total,
      page,
      limit,
    };
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
  /**
   * Applies partial updates directly to the root User entity table.
   *
   * @param id The internal ID of the target user.
   * @param data Disjoint subset of user properties.
   * @returns The successfully mutated User object.
   * @throws {AgoraError} NOT_FOUND if the target did not exist.
   * @throws {AgoraError} EMAIL_EXISTS if unique constraint violated on email updates.
   *
   */
  async update(id: string, data: Partial<Omit<NewUser, "id" | "createdAt" | "updatedAt">>): Promise<User> {
    try {
      const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();

      if (!updatedUser) throw new AgoraError("NOT_FOUND", "User not found.");
      return updatedUser;
    } catch (e: unknown) {
      if (e instanceof AgoraError) throw e;
      const pgError = e as Record<string, unknown>;
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
   * Applies partial updates specifically to the chained UserProfile entity.
   *
   * @param userId The internal root user ID.
   * @param data Disjoint subset of user profile properties.
   * @returns The successfully mutated UserProfile object.
   *
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
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while updating the user profile.");
    }
  },

  /**
   * Applies partial updates specifically to the chained UserSettings entity.
   *
   * @param userId The internal root user ID.
   * @param data Disjoint subset of user settings properties.
   * @returns The successfully mutated UserSettings object.
   *
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
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while updating the user settings.");
    }
  },

  // -------------------------------------------------------------------------
  // Security
  // -------------------------------------------------------------------------
  /**
   * Strict lookup isolating solely the encrypted `passwordHash`.
   * Architectural separation of credentials prevents leaky data returns.
   *
   * @param userId The target user ID.
   * @returns The complete raw hash string, or null if missing.
   *
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
   * Persists or forcefully overrides the secure hash for a specific user ID.
   * Automatically upserts using PostgreSQL `onConflictDoUpdate`.
   *
   * @param userId The target user ID.
   * @param passwordHash The newly computed Argon2 hash.
   *
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
   * Totally eradicates a User from the database completely. Cascades
   * effectively remove corresponding roles and properties depending on constraints.
   *
   * @param id The internal lookup ID.
   * @returns The fundamentally deleted User context structure.
   *
   */
  async delete(id: string): Promise<User> {
    const [deletedUser] = await db.delete(users).where(eq(users.id, id)).returning();
    if (!deletedUser) throw new AgoraError("NOT_FOUND", "User not found.");
    return deletedUser;
  },
};
