"use server";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";

import { resetPasswordRequestSchema } from "../contracts.ts";
import { AuthService } from "../services/auth.service.ts";

export const requestPasswordResetAction = withActionHandler(
  {
    bodySchema: resetPasswordRequestSchema,
    auth: false,
  },
  async ({ data: { email }, client }) => {
    await AuthService.requestPasswordReset({ email }, client);

    // The action wrapper will map this to { success: true, data: null }
    return null;
  },
);
