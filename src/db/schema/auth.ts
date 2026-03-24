import { type InferInsertModel, type InferSelectModel, relations } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { VERIFICATION_TOKEN_TYPE } from "@/src/config/constants.ts";

import { createdAtColumn, idColumn, updatedAtColumn } from "./_helpers.ts";
import { users } from "./users.ts";

export const verificationTokenTypeEnum = pgEnum("verification_token_type", VERIFICATION_TOKEN_TYPE);

export const userCredentials = pgTable("user_credentials", {
  id: idColumn(),
  userId: uuid()
    .notNull()
    .unique() // 1:1 relationship
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text().notNull(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: idColumn(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text().notNull().unique(),
    type: verificationTokenTypeEnum().notNull(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("verification_tokens_user_id_type_idx").on(table.userId, table.type),
    index("verification_tokens_expires_at_idx").on(table.expiresAt),
  ],
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: idColumn(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionTokenHash: text().notNull().unique(),
    previousSessionTokenHash: text().unique(),
    ipAddress: text().notNull(),
    userAgent: text().notNull(),
    createdAt: createdAtColumn(),
    lastActiveAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("user_sessions_user_id_idx").on(table.userId),
    index("user_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const userCredentialsRelations = relations(userCredentials, ({ one }) => ({
  user: one(users, {
    fields: [userCredentials.userId],
    references: [users.id],
  }),
}));

export const verificationTokensRelations = relations(verificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [verificationTokens.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export type Session = InferSelectModel<typeof userSessions>;
export type NewSession = InferInsertModel<typeof userSessions>;

export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;
