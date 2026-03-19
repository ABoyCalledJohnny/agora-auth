import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { appConfig } from "../config";
import * as schema from "./schema";

// 1. Define the Global type
// This prevents TypeScript from complaining that 'conn' doesn't exist on globalThis
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// 2. Reuse existing connection or create a new one
// LAYER 1: The Connection Pool
// We call this 'client' to represent the raw driver instance.
export const client =
  globalForDb.conn ??
  postgres(appConfig.db.url, {
    max: 10, // Connection pool size
    // Optional: Add strict SSL for production
    // ssl: process.env.NODE_ENV === 'production' ? 'require' : false
  });

// 3. Save the connection to global in development
if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = client;
}

// 4. Initialise Drizzle
// LAYER 2: The ORM Wrapper
// We call this 'db' to represent the high-level query interface.
export const db = drizzle(client, { schema, casing: "snake_case" });
