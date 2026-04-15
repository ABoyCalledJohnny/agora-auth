"use server";

/**
 * Login action.
 * Authenticates credentials, sets session cookies, and redirects.
 */

import { redirect } from "next/navigation";
import { z } from "zod";

import { appConfig } from "@/src/config/index.ts";
import { withActionHandler } from "@/src/lib/action-wrapper.ts";
import { setSessionCookies } from "@/src/lib/auth.ts";
import { getRequestMetadata } from "@/src/lib/auth.ts";
import { isSafeRedirect } from "@/src/lib/utils.ts";

import { loginSchema } from "../contracts.ts";
import { AuthService } from "../services/auth.service.ts";

const loginActionSchema = loginSchema.extend({
  redirectTo: z.string().optional(),
});

export const loginAction = withActionHandler(
  {
    bodySchema: loginActionSchema,
    auth: false,
  },
  async ({ data: { identifier, password, redirectTo } }) => {
    // 1. Extract request metadata for the session.
    const { ipAddress, userAgent } = await getRequestMetadata();

    // 2. Authenticate credentials via AuthService.login.
    const loginResponse = await AuthService.login({ identifier, password }, ipAddress, userAgent);

    // 3. Set session cookies.
    await setSessionCookies(loginResponse.accessToken, loginResponse.refreshToken);

    // 4. Validate the redirect URL and fall back to the home page if unsafe.
    const redirectPath = redirectTo && isSafeRedirect(appConfig.app.url, redirectTo) ? redirectTo : "/";
    redirect(redirectPath);
  },
);
