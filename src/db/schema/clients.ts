import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { createdAtColumn, idColumn, updatedAtColumn } from "./_helpers.ts";
import { DEFAULT_RESET_PASSWORD_PATH, DEFAULT_VERIFY_EMAIL_PATH } from "@/src/config/constants";

export const apiClients = pgTable("api_clients", {
  id: idColumn(),
  name: text().notNull().unique(),
  clientId: text().notNull().unique(),
  apiKeyHash: text().notNull().unique(),
  baseUrl: text().notNull().unique(), // e.g., "https://example.com" or "http://localhost:3000"
  verifyEmailPath: text().notNull().default(DEFAULT_VERIFY_EMAIL_PATH),
  resetPasswordPath: text().notNull().default(DEFAULT_RESET_PASSWORD_PATH),
  isActive: boolean().notNull().default(true),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export type ApiClient = InferSelectModel<typeof apiClients>;
export type NewApiClient = InferInsertModel<typeof apiClients>;
