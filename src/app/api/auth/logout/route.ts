import type { ApiSuccessResponse } from "@/src/types.ts";

import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { logoutSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";

export const POST = withApiHandler({ bodySchema: logoutSchema }, async ({ data: { refreshToken } }) => {
  await AuthService.logout(refreshToken);
  // Note: AuthService.logout expects the plainSessionToken (which is the refresh token).

  const response: ApiSuccessResponse<null> = {
    success: true,
    message: enTranslations.Auth.logoutSuccess,
    data: null,
  };

  return NextResponse.json(response);
});
