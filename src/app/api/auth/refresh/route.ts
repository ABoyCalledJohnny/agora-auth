import type { AuthTokens } from "@/src/features/auth/types.ts";
import type { ApiSuccessResponse } from "@/src/types.ts";

import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { refreshSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { getRequestMetadata } from "@/src/lib/auth.ts";

/**
 * POST /api/auth/refresh
 *
 * Accepts a refresh token in the JSON body, rotates the session, and returns
 * fresh access + refresh tokens. Used by:
 * - `proxy.ts` — silent refresh before page navigations
 * - External API clients
 */
export const POST = withApiHandler(
  {
    bodySchema: refreshSchema,
  },
  async ({ data: { refreshToken } }) => {
    const { ipAddress } = await getRequestMetadata();
    const authTokens = await AuthService.refresh(refreshToken, ipAddress);

    const data: ApiSuccessResponse<AuthTokens> = {
      success: true,
      message: enTranslations.Auth.refreshSuccess,
      data: {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        expiresAt: authTokens.expiresAt,
      },
    };

    return NextResponse.json(data);
  },
);
