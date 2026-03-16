import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";
import { USER_STATUS } from "@/src/lib/validation";
import {
  createdAtColumn,
  idColumn,
  uniqueNotNullableTextColumn,
  updatedAtColumn,
  verifiedAtColumn,
} from "./_helpers.ts";
import { usersRoles, type Role } from "./rbac";

export const userStatusEnum = pgEnum("user_status", USER_STATUS);

export const users = pgTable("users", {
  id: idColumn(),
  publicId: uniqueNotNullableTextColumn("publicId"),
  username: uniqueNotNullableTextColumn("username"),
  email: uniqueNotNullableTextColumn("email"),
  emailVerifiedAt: verifiedAtColumn("emailVerifiedAt"),
  status: userStatusEnum("status").notNull().default("pending"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
  lastSignInAt: timestamp("lastSignInAt", { withTimezone: true }),
});

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(usersRoles),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
// Used for sessions & auth where roles are explicitly joined/fetched
export type UserWithRoles = User & {
  roles: { role: Role }[];
};
