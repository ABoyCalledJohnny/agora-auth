"use server";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";

import { resendVerifyEmailSchema } from "../contracts.ts";
import { AuthService } from "../services/auth.service.ts";

export const resendVerifyEmailAction = withActionHandler(
  {
    bodySchema: resendVerifyEmailSchema,
    auth: false,
  },
  async ({ data: { email }, client }) => {
    await AuthService.requestVerificationEmail(email, client);

    // The action wrapper will map this to { success: true, data: null }
    return null;
  },
);
