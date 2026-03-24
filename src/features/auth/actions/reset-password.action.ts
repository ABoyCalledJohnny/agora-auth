"use server";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";

import { resetPasswordConfirmSchema } from "../contracts.ts";
import { AuthService } from "../services/auth.service.ts";

export const resetPasswordAction = withActionHandler(
  {
    bodySchema: resetPasswordConfirmSchema,
    auth: false,
  },
  async ({ data: { token, password } }) => {
    await AuthService.resetPassword({ token, password });

    // The action wrapper will map this to { success: true, data: null }
    return null;
  },
);
