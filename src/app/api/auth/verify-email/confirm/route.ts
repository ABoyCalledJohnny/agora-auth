import type { ApiSuccessResponse } from "@/src/types.ts";

import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { verifyEmailSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";

export const POST = withApiHandler(
  {
    bodySchema: verifyEmailSchema,
    auth: false,
  },
  async ({ data: { token } }) => {
    await AuthService.verifyEmail(token);

    const responseBody: ApiSuccessResponse<null> = {
      success: true,
      message: enTranslations.Auth.VerifyEmail.verified,
      data: null,
    };

    return NextResponse.json(responseBody);
  },
);
