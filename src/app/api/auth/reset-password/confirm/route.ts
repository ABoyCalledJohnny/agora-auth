import type { ApiSuccessResponse } from "@/src/types.ts";

import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { resetPasswordConfirmSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";

export const POST = withApiHandler(
  {
    bodySchema: resetPasswordConfirmSchema,
    auth: false,
  },
  async ({ data: { token, password } }) => {
    await AuthService.resetPassword({ token, password });

    const responseBody: ApiSuccessResponse<null> = {
      success: true,
      message: enTranslations.Auth.ResetPassword.success,
      data: null,
    };

    return NextResponse.json(responseBody);
  },
);
