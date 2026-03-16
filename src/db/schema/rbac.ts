import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { createdAtColumn, idColumn, uniqueNotNullableTextColumn, updatedAtColumn } from "./_helpers";
import { users } from "./users";

export const roles = pgTable("roles", {
  id: idColumn(),
  name: uniqueNotNullableTextColumn(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const usersRoles = pgTable(
  "users_roles",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: createdAtColumn(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] }), index("users_roles_role_id_idx").on(t.roleId)],
);

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(usersRoles),
}));

export const usersRolesRelations = relations(usersRoles, ({ one }) => ({
  user: one(users, {
    fields: [usersRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [usersRoles.roleId],
    references: [roles.id],
  }),
}));

export type Role = InferSelectModel<typeof roles>;
export type NewRole = InferInsertModel<typeof roles>;
export type UserRole = InferSelectModel<typeof usersRoles>;
export type NewUserRole = InferInsertModel<typeof usersRoles>;
