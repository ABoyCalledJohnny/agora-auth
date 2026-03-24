import { NextResponse } from "next/server";

import { JwtService } from "@/src/features/auth/services/jwt.service.ts";
import { logger } from "@/src/lib/logger.ts";

/**
 * Notice: We intentionally do NOT use `withApiHandler` here.
 * The JWKS endpoint is an IETF standard (RFC 7517). Standard third-party JWT
 * verification libraries expect the exact JSON shape `{ "keys": [...] }` at the root.
 * Wrapping this response in our custom `ApiSuccessResponse` would break compatibility.
 */
export const GET = async () => {
  try {
    const jwk = await JwtService.getPublicKey();

    return NextResponse.json({
      keys: [jwk],
    });
  } catch (error) {
    logger.error("Failed to fetch JWKS", error);

    // Returning a standard 500 error is universally understood by standard libraries
    // polling this endpoint. They do not know how to parse custom JSON error bodies anyway.
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
