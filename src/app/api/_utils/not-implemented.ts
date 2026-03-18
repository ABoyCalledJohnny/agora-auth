import { NextResponse } from "next/server";
import { AgoraError } from "@/src/lib/errors";
import type { ApiErrorResponse } from "@/src/types";

export function notImplementedResponse(endpoint: string) {
  const error = new AgoraError("NOT_IMPLEMENTED", undefined, {
    details: { endpoint },
  });

  const response: ApiErrorResponse<{ endpoint: string }> = {
    success: false,
    code: error.code,
    error: error.message,
    details: { endpoint },
  };

  return NextResponse.json(response, { status: error.status });
}
