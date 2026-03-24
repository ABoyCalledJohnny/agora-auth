"use server";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";

import { verifyEmailSchema } from "../contracts.ts";
import { AuthService } from "../services/auth.service.ts";

export const verifyEmailAction = withActionHandler(
  {
    bodySchema: verifyEmailSchema,
    auth: false,
  },
  async ({ data: { token } }) => {
    await AuthService.verifyEmail(token);

    // The action wrapper will map this to { success: true, data: null }
    return null;
  },
);
