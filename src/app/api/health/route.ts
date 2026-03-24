import type { ApiResponse, HealthData } from "@/src/types.ts";

import { NO_STORE_HEADERS } from "@/src/config/constants.ts";
import { client as sql } from "@/src/db/index.ts";
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

  let response: ApiResponse<HealthData, HealthData>;

  if (isDatabaseConnected) {
    response = {
      success: true,
      message: "Health check passed.",
      data: {
        status: "ok",
        app: "running",
        db: "connected",
        date: new Date().toISOString(),
      },
    };
  } else {
    response = {
      success: false,
      error: "Health check failed.",
      code: "INTERNAL",
      details: {
        status: "error",
        app: "running",
        db: "disconnected",
        date: new Date().toISOString(),
      },
    };
  }

  return Response.json(response, {
    status: isDatabaseConnected ? 200 : 503,
    headers: NO_STORE_HEADERS,
  });
}

export async function HEAD() {
  const isDatabaseConnected = await checkDatabaseConnection();

  return new Response(null, {
    status: isDatabaseConnected ? 200 : 503,
    headers: NO_STORE_HEADERS,
  });
}
