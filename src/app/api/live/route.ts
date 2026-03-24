import { NO_STORE_HEADERS } from "@/src/config/constants.ts";

export async function GET() {
  return Response.json(
    {
      success: true,
      message: "Liveness check passed.",
      data: {
        status: "ok",
        app: "running",
        date: new Date().toISOString(),
      },
    },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}
