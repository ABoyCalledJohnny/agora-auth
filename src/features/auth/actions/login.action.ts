"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { appConfig } from "@/src/config/index.ts";
import { withActionHandler } from "@/src/lib/action-wrapper.ts";
import { setSessionCookies } from "@/src/lib/auth.ts";
import { getRequestMetadata, isSafeRedirect } from "@/src/lib/utils.ts";

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
    // Step 1: Extract request metadata for the session
    const { ipAddress, userAgent } = await getRequestMetadata();

    // Step 2: Authenticate credentials via `AuthService.login`
    const loginResponse = await AuthService.login({ identifier, password }, ipAddress, userAgent);

    // Step 3: Call `setSessionCookies(accessToken, refreshToken)`
    await setSessionCookies(loginResponse.accessToken, loginResponse.refreshToken);

    // Step 4: Validate the `redirectTo` URL. If it's provided and passes `isSafeRedirect(appConfig.app.baseUrl, data.redirectTo)`, use it. Otherwise, fallback to a default (e.g., "/profile").
    const redirectPath = redirectTo && isSafeRedirect(appConfig.app.url, redirectTo) ? redirectTo : "/";
    redirect(redirectPath);
  },
);
