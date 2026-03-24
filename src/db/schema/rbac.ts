import { type InferInsertModel, type InferSelectModel, relations } from "drizzle-orm";
import { index, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

import { createdAtColumn, idColumn, updatedAtColumn } from "./_helpers.ts";
import { users } from "./users.ts";

export const roles = pgTable("roles", {
  id: idColumn(),
  name: text().notNull().unique(),
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
