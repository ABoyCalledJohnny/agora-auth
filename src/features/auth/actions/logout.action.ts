"use server";

/**
 * Logout action.
 * Revokes the session in the database and clears browser cookies.
 */

import { redirect } from "next/navigation";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";
import { clearSessionCookies, getSessionCookies } from "@/src/lib/auth.ts";

import { AuthService } from "../services/auth.service.ts";

export const logoutAction = withActionHandler(
  {
    auth: false, // Do not require strict auth; allow logout even with expired tokens.
  },
  async () => {
    const { refreshCookie } = await getSessionCookies();

    // 1. If we have a refresh token, revoke it in the database.
    if (refreshCookie?.value) {
      // Wrapped in try-catch so that even if the session does not exist
      // in the database, we still proceed to clear the user's cookies below.
      try {
        await AuthService.logout(refreshCookie.value);
      } catch {
        // Ignore errors (e.g. token already revoked or invalid).
      }
    }

    // 2. Clear the HttpOnly session cookies from the browser.
    await clearSessionCookies();

    // 3. Redirect back to the login page.
    redirect("/login");
  },
);
