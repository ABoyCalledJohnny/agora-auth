import { eq, and } from "drizzle-orm";
import { db } from "@/src/db";
import { roles, usersRoles, type Role, type NewRole } from "@/src/db/schema/rbac";
import type { RoleRepository } from "@/src/features/user/contracts";

export const DrizzleRoleRepository: RoleRepository = {
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

  async create(data: NewRole): Promise<Role> {
    const [result] = await db.insert(roles).values(data).returning();
    if (!result) throw new Error("Failed to create role");
    return result;
  },

  async delete(id: string): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
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

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await db.insert(usersRoles).values({ userId, roleId }).onConflictDoNothing();
  },

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await db.delete(usersRoles).where(and(eq(usersRoles.userId, userId), eq(usersRoles.roleId, roleId)));
  },
};
