import { defineConfig } from "drizzle-kit";

const migrationDatabaseUrl = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? 5432}/${process.env.POSTGRES_DB}`;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: migrationDatabaseUrl,
  },
});
