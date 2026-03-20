import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { createdAtColumn, idColumn, updatedAtColumn } from "./_helpers.ts";

export const apiClients = pgTable("api_clients", {
  id: idColumn(),
  name: text().notNull().unique(),
  clientId: text().notNull().unique(),
  apiKeyHash: text().notNull().unique(),
  baseUrl: text().notNull().unique(), // e.g., "https://example.com" or "http://localhost:3000"
  verifyEmailPath: text().notNull(),
  resetPasswordPath: text().notNull(),
  isActive: boolean().notNull().default(true),
  skipEmailVerification: boolean().notNull().default(false),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export type ApiClient = InferSelectModel<typeof apiClients>;
export type NewApiClient = InferInsertModel<typeof apiClients>;
