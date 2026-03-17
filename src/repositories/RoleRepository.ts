import { eq, and } from "drizzle-orm";
import { db } from "@/src/db";
import { roles, usersRoles, type Role, type NewRole } from "@/src/db/schema/rbac";
import type { RoleRepository } from "@/src/features/auth/contracts";
import { AgoraError } from "@/src/lib/errors";

export const DrizzleRoleRepository: RoleRepository = {
  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  async create(data: NewRole): Promise<Role> {
    const [result] = await db.insert(roles).values(data).onConflictDoNothing({ target: roles.name }).returning();

    if (result) return result;

    // If we got no result, a conflict occurred, so fetch and return the existing one.
    const [existingRole] = await db.select().from(roles).where(eq(roles.name, data.name)).limit(1);
    if (!existingRole) throw new AgoraError("INTERNAL", "Failed to create or fetch role.");

    return existingRole;
  },

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<Role | null> {
    const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return result[0] || null;
  },

  async findByName(name: string): Promise<Role | null> {
    const result = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    return result[0] || null;
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
    await db.insert(usersRoles).values({ userId, roleId }).onConflictDoNothing();
  },

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await db.delete(usersRoles).where(and(eq(usersRoles.userId, userId), eq(usersRoles.roleId, roleId)));
  },

  async update(id: string, data: Partial<Omit<NewRole, "id" | "createdAt" | "updatedAt">>): Promise<Role> {
    const [updatedRole] = await db
      .update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();

    if (!updatedRole) throw new AgoraError("NOT_FOUND", "Role not found.");
    return updatedRole;
  },

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  async delete(id: string): Promise<Role> {
    const [deletedRole] = await db.delete(roles).where(eq(roles.id, id)).returning();
    if (!deletedRole) throw new AgoraError("NOT_FOUND", "Role not found.");
    return deletedRole;
  },
};
