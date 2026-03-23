import type { ApiSuccessResponse } from "@/src/types";

import { NextResponse } from "next/server";

import { loginSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { getRequestMetadata } from "@/src/lib/utils.ts";

export const POST = withApiHandler({ bodySchema: loginSchema }, async ({ data: { identifier, password } }) => {
  // Step 1: Extract request metadata for the session
  const { ipAddress, userAgent } = await getRequestMetadata();

  // Step 2: Verify credentials (find user by identifier, compare password hash via AuthService)
  const loginResponse = await AuthService.login({ identifier, password }, ipAddress, userAgent);

  const responseBody: ApiSuccessResponse = {
    success: true,
    message: "Login successful",
    data: {
      user: loginResponse.user,
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      expiresAt: loginResponse.expiresAt,
    },
  };

  return NextResponse.json(responseBody);
});
