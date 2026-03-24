import type { AuthTokens } from "@/src/features/auth/types.ts";
import type { ApiSuccessResponse } from "@/src/types.ts";

import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { refreshSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";

export const POST = withApiHandler(
  {
    bodySchema: refreshSchema,
  },
  async ({ data: { refreshToken } }) => {
    const authTokens = await AuthService.refresh(refreshToken);

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
