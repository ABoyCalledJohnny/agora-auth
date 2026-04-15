"use server";

/**
 * Register action.
 * Creates a new user account with uniqueness checks and email verification.
 */

import { withActionHandler } from "@/src/lib/action-wrapper.ts";

import { registerSchema } from "../contracts.ts";
import { AuthService } from "../services/auth.service.ts";

export const registerAction = withActionHandler(
  {
    bodySchema: registerSchema,
    auth: false,
  },
  async ({ data, client }) => {
    // AuthService performs uniqueness checks, hashes the password,
    // saves the user, and sends the verification email.
    const newUser = await AuthService.register(
      {
        username: data.username,
        email: data.email,
        password: data.password,
      },
      client,
    );

    // The withActionHandler wrapper automatically wraps this return value
    // into a standard { success: true, data: newUser } structure.
    return newUser;
  },
);
