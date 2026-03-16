import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
const { combinedEnv } = loadEnvConfig(projectDir, process.env.NODE_ENV !== "production");

const migrationDatabaseUrl = `postgres://${combinedEnv.POSTGRES_USER}:${combinedEnv.POSTGRES_PASSWORD}@${combinedEnv.DB_HOST ?? "localhost"}:${combinedEnv.DB_PORT ?? 5432}/${combinedEnv.POSTGRES_DB}`;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: migrationDatabaseUrl,
  },
});
