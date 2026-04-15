/**
 * Database Connection
 *
 * Initialises the PostgreSQL connection pool (Layer 1) and the Drizzle ORM
 * query interface (Layer 2). Reuses the connection across hot reloads in
 * development via globalThis.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { appConfig } from "../config/index.ts";
import * as schema from "./schema/index.ts";

// Extend globalThis to prevent TypeScript errors for the cached connection.
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Reuse existing connection or create a new one.
const client =
  globalForDb.conn ??
  postgres(appConfig.db.url, {
    max: 10,
  });

// Persist the connection in development to survive hot reloads.
if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = client;
}

export { client };
export const db = drizzle(client, { schema, casing: "snake_case" });
