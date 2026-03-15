import { NextResponse } from "next/server";

export function notImplementedResponse(endpoint: string) {
  return NextResponse.json(
    {
      code: "NOT_IMPLEMENTED",
      error: "This endpoint is not implemented yet.",
      endpoint,
    },
    { status: 501 },
  );
}
