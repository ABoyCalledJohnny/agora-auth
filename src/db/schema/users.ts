import { DEFAULT_PREFERENCES, DEFAULT_PRIVACY_SETTINGS, USER_STATUS } from "@/src/config/constants";
import { type Preferences, type PrivacySettings } from "@/src/lib/validation";
import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAtColumn, idColumn, updatedAtColumn, verifiedAtColumn } from "./_helpers.ts";
import { userCredentials, userSessions, verificationTokens } from "./auth";
import { usersRoles, type Role } from "./rbac";

export const userStatusEnum = pgEnum("user_status", USER_STATUS);

export const users = pgTable("users", {
  id: idColumn(),
  publicId: text().notNull().unique(),
  username: text().notNull().unique(),
  email: text().notNull().unique(),
  emailVerifiedAt: verifiedAtColumn("emailVerifiedAt"),
  status: userStatusEnum().notNull().default("pending"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
  lastSignInAt: timestamp({ withTimezone: true }),
});

export const userSettings = pgTable("user_settings", {
  id: idColumn(),
  userId: uuid()
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  privacySettings: jsonb().notNull().default(DEFAULT_PRIVACY_SETTINGS).$type<PrivacySettings>(),
  preferences: jsonb().notNull().default(DEFAULT_PREFERENCES).$type<Preferences>(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const userProfiles = pgTable("user_profiles", {
  id: idColumn(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text(),
  lastName: text(),
  displayName: text(),
  avatarUrl: text(),
  tagline: text(),
  bio: text(),
  hobbies: text().array(),
  websiteUrl: text(),
  location: text(),
  pronouns: text(),
  socialLinks: jsonb().$type<Record<string, string>>(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  roles: many(usersRoles),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  credentials: one(userCredentials, {
    fields: [users.id],
    references: [userCredentials.userId],
  }),
  sessions: many(userSessions),
  verificationTokens: many(verificationTokens),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type UserProfile = InferSelectModel<typeof userProfiles>;
export type UserSettings = InferSelectModel<typeof userSettings>;

export type UserWithRoles = User & {
  roles: { role: Role }[];
};

export type FullUser = User & {
  roles: { role: Role }[];
  settings: UserSettings;
  profile: UserProfile | null;
};
