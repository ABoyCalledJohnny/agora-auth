import { NO_STORE_HEADERS } from "@/src/config/constants.ts";
import { client as sql } from "@/src/db";
import { logger } from "@/src/lib/logger.ts";

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Execute a minimal query to verify the connection
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database ping failed", error);
    return false;
  }
}

export async function GET() {
  const isDatabaseConnected = await checkDatabaseConnection();

  return Response.json(
    {
      status: isDatabaseConnected ? "ok" : "error",
      app: "running",
      db: isDatabaseConnected ? "connected" : "disconnected",
      date: new Date().toISOString(),
    },
    {
      status: isDatabaseConnected ? 200 : 503,
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function HEAD() {
  const isDatabaseConnected = await checkDatabaseConnection();

  return new Response(null, {
    status: isDatabaseConnected ? 200 : 503,
    headers: NO_STORE_HEADERS,
  });
}
