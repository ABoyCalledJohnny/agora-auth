import type { ApiSuccessResponse, LiveData } from "@/src/types.ts";

import { NO_STORE_HEADERS } from "@/src/config/constants.ts";

export async function GET() {
  const response: ApiSuccessResponse<LiveData> = {
    success: true,
    message: "Liveness check passed.",
    data: {
      status: "ok",
      app: "running",
      date: new Date().toISOString(),
    },
  };

  return Response.json(response, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}
