import type { RoleRepository } from "@/src/features/auth/contracts.ts";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db/index.ts";
import { type NewRole, type Role, roles, usersRoles } from "@/src/db/schema/rbac.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const DrizzleRoleRepository: RoleRepository = {
  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  async create(data: NewRole): Promise<Role> {
    try {
      const [result] = await db.insert(roles).values(data).onConflictDoNothing({ target: roles.name }).returning();

      if (result) return result;

      // If we got no result, a conflict occurred, so fetch and return the existing one.
      const [existingRole] = await db.select().from(roles).where(eq(roles.name, data.name)).limit(1);
      if (!existingRole) throw new AgoraError("INTERNAL", "Failed to create or fetch role.");

      return existingRole;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while creating the role.");
    }
  },

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<Role | null> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return role ?? null;
  },

  async findByName(name: string): Promise<Role | null> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    return role ?? null;
  },

  async findAll(): Promise<Role[]> {
    return await db.select().from(roles);
  },

  async getUserRoles(userId: string): Promise<Role[]> {
    const result = await db
      .select({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(usersRoles)
      .innerJoin(roles, eq(usersRoles.roleId, roles.id))
      .where(eq(usersRoles.userId, userId));

    return result;
  },

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      await db.insert(usersRoles).values({ userId, roleId }).onConflictDoNothing();
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while assigning the role.");
    }
  },

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await db.delete(usersRoles).where(and(eq(usersRoles.userId, userId), eq(usersRoles.roleId, roleId)));
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while removing the role.");
    }
  },

  async update(id: string, data: Partial<Omit<NewRole, "id" | "createdAt" | "updatedAt">>): Promise<Role> {
    try {
      const [updatedRole] = await db.update(roles).set(data).where(eq(roles.id, id)).returning();

      if (!updatedRole) throw new AgoraError("NOT_FOUND", "Role not found.");
      return updatedRole;
    } catch (e: unknown) {
      if (e instanceof AgoraError) throw e;

      const pgError = e as Record<string, unknown>;
      if (pgError && pgError.code === "23505") {
        throw new AgoraError("ROLE_EXISTS");
      }

      throw new AgoraError("INTERNAL", "A database error occurred while updating the role.");
    }
  },

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  async delete(id: string): Promise<Role> {
    try {
      const [deletedRole] = await db.delete(roles).where(eq(roles.id, id)).returning();
      if (!deletedRole) throw new AgoraError("NOT_FOUND", "Role not found.");
      return deletedRole;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting the role.");
    }
  },
};
