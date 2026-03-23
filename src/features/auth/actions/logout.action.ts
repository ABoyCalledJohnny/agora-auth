"use server";

import { redirect } from "next/navigation";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";
import { clearSessionCookies, getSessionCookies } from "@/src/lib/utils.ts";

import { AuthService } from "../services/auth.service.ts";

export const logoutAction = withActionHandler(
  {
    auth: false, // Don't require strict auth, let them log out even if tokens are expired
  },
  async () => {
    const { refreshCookie } = await getSessionCookies();

    // 1. If we have a refresh token, revoke it in the database
    if (refreshCookie?.value) {
      // Intentionally wrap in try-catch so that even if the session doesn't exist
      // in the DB, we still proceed to clear the user's cookies below.
      try {
        await AuthService.logout(refreshCookie.value);
      } catch {
        // Ignore errors (e.g. token already revoked or invalid)
      }
    }

    // 2. Clear the HttpOnly session cookies from the browser
    await clearSessionCookies();

    // 3. Redirect back to the login page
    redirect("/login");
  },
);
