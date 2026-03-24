import type { ApiSuccessResponse } from "@/src/types.ts";

import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { resendVerifyEmailSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";

export const POST = withApiHandler(
  {
    bodySchema: resendVerifyEmailSchema,
    auth: false,
  },
  async ({ data: { email }, client }) => {
    await AuthService.requestVerificationEmail(email, client);

    const responseBody: ApiSuccessResponse<null> = {
      success: true,
      message: enTranslations.Auth.VerifyEmail.resendSuccess,
      data: null,
    };

    return NextResponse.json(responseBody);
  },
);
