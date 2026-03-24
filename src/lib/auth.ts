import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

import { cookies } from "next/headers";

import { appConfig } from "@/src/config/index.ts";
import { JwtService } from "@/src/features/auth/services/jwt.service.ts";
import { AgoraError } from "@/src/lib/errors.ts";
import { logger } from "@/src/lib/logger.ts";

import { AuthService } from "../features/auth/services/auth.service.ts";
import { parseDuration } from "./utils.ts";

/**
 * Global Authentication Context
 *
 * This file contains the primary Server-Side mechanisms for retrieving,
 * verifying, and asserting the user's secure session state. It serves as the
 * single source of truth for "who the user is" inside Next.js Server Components,
 * Server Actions, and API Route Handlers.
 *
 * Functions available:
 * - `getSession()`: Soft check. Resolves user from cookies, or returns null if no valid session exists. Handled gracefully.
 * - `authenticate()`: Hard check. Guarantees a valid user or throws an `UNAUTHORIZED` AgoraError immediately.
 * - `authorize()`: Validates Role-Based Access Control against a required list.
 * - `assertAuth()`: Convenience helper for protecting Next.js Page components.
 * - `getSessionCookies()`: Retrieves the raw access and refresh cookies from the request.
 * - `setSessionCookies()`: Securely sets the session cookie pair (access + refresh) with secure defaults.
 * - `clearSessionCookies()`: Clears both session cookies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// This becomes the standard user context available to all your Next.js pages/components!
export type AppSession = {
  user: {
    id: string; // mapped from sub
    username: string;
    roles: string[];
  };
  sessionId: string; // mapped from sid
};

// ---------------------------------------------------------------------------
// Session retrieval
// ---------------------------------------------------------------------------

/**
 * Reads the Access JWT from the cookie and decodes it.
 *
 * If the Access JWT is expired but a valid Refresh token cookie is present,
 * silently rotates the Refresh token via `SessionService`, issues a new
 * Access JWT via `JwtService`, updates both cookies, and returns the
 * decoded payload.
 *
 * Returns `null` if no tokens are present or the refresh fails.
 */
export async function getSession(): Promise<AppSession | null> {
  // 1. Grab both cookies
  const { accessCookie, refreshCookie } = await getSessionCookies();

  // 2. Gatekeeper Check: If neither exists, user is a guest.
  if (!accessCookie && !refreshCookie) {
    return null;
  }

  // 3. Access Cookie Strategy
  if (accessCookie) {
    try {
      // Verify signature & expiration. If valid, we are done!
      const payload = await JwtService.verify(accessCookie.value);
      return {
        sessionId: payload.sid,
        user: {
          id: payload.sub,
          username: payload.username,
          roles: payload.roles,
        },
      };
    } catch (error) {
      // If error is NOT an expiration error (e.g. tampering, invalid signature), reject immediately
      if (!(error instanceof AgoraError && error.code === "TOKEN_EXPIRED")) {
        return null;
      }
      // If it IS expired, swallow the error and fall through to the Refresh Flow.
    }
  }

  // 4. Refresh Strategy (Reached if access token is missing or expired)
  if (!refreshCookie) {
    return null; // Cannot refresh without a refresh token.
  }

  try {
    // 5. Call `AuthService.refresh(refreshToken)` to securely rotate the DB session
    const authTokens = await AuthService.refresh(refreshCookie.value);

    // 6. Write the new tokens strictly back to the headers
    setSessionCookies(authTokens.accessToken, authTokens.refreshToken);

    // 7. Map the newly generated parameters into `AppSession` and cleanly return it.
    const decodedNewToken = await JwtService.verify(authTokens.accessToken);
    return {
      sessionId: decodedNewToken.sid,
      user: {
        id: decodedNewToken.sub,
        username: decodedNewToken.username,
        roles: decodedNewToken.roles,
      },
    };
  } catch (error) {
    // The database rejected the refresh token!
    if (error instanceof AgoraError) {
      // If they are suspended/pending/revoked, actively delete the cookies
      if (["ACCOUNT_SUSPENDED", "ACCOUNT_PENDING", "UNAUTHORIZED"].includes(error.code)) {
        clearSessionCookies();
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Verifies a valid Access JWT exists and returns the decoded payload.
 * Triggers a silent token refresh if the Access JWT is expired.
 * Throws `UNAUTHORIZED` if no valid session can be established.
 */
export async function authenticate(): Promise<AppSession> {
  const session = await getSession();
  if (!session) {
    throw new AgoraError("UNAUTHORIZED");
  }
  return session;
}

// ---------------------------------------------------------------------------
// Authorisation
// ---------------------------------------------------------------------------

/**
 * Checks that the decoded JWT payload holds at least one of the required roles.
 * Throws `FORBIDDEN` if the check fails.
 */
export function authorize(session: AppSession, requiredRoles: string[]): void {
  if (requiredRoles.length === 0) return;

  const hasRole = requiredRoles.some((role) => session.user.roles.includes(role));
  if (!hasRole) {
    logger.warn(`Authorisation denied for user ${session.user.id}`, {
      required: requiredRoles,
      actual: session.user.roles,
    });
    throw new AgoraError("FORBIDDEN");
  }
}

// ---------------------------------------------------------------------------
// Combined guard for Server Components (page.tsx)
// ---------------------------------------------------------------------------

/**
 * Authenticates and (optionally) authorises the current user.
 * Intended for use at the top of protected `page.tsx` files.
 *
 * @example
 * ```ts
 * // app/(protected)/dashboard/page.tsx
 * export default async function DashboardPage() {
 *   const session = await assertAuth();
 *   // …
 * }
 *
 * // app/(protected)/admin/page.tsx
 * export default async function AdminPage() {
 *   const session = await assertAuth({ roles: ["admin"] });
 *   // …
 * }
 * ```
 */
export async function assertAuth(options?: { roles?: string[] }): Promise<AppSession> {
  const session = await authenticate();
  if (options?.roles) {
    authorize(session, options.roles);
  }
  return session;
}

// ---------------------------------------------------------------------------
// Cookie Management
// ---------------------------------------------------------------------------

export async function getSessionCookies(): Promise<{
  accessCookie: RequestCookie | null;
  refreshCookie: RequestCookie | null;
}> {
  const cookieStore = await cookies();
  const isProd = appConfig.app.env === "production";
  const cookiePrefix = isProd ? "__Secure-" : "";

  const accessCookieName = `${cookiePrefix}${appConfig.auth.accessCookieName}`;
  const refreshCookieName = `${cookiePrefix}${appConfig.auth.refreshCookieName}`;

  // Grab the Access JWT from the cookies.
  const accessCookie = cookieStore.get(accessCookieName) ?? null;
  const refreshCookie = cookieStore.get(refreshCookieName) ?? null;

  return { accessCookie, refreshCookie };
}

/**
 * Sets the session cookie pair (access + refresh tokens) with secure defaults
 * from appConfig. Used by withApiHandler, withActionHandler, and proxy.ts.
 */
export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const shared = {
    httpOnly: true,
    secure: appConfig.app.env === "production",
    sameSite: appConfig.auth.cookieSameSite,
    path: "/",
  } as const;

  cookieStore.set(appConfig.auth.accessCookieName, accessToken, {
    ...shared,
    maxAge: parseDuration(appConfig.auth.accessTokenExpiry) / 1000,
  });

  cookieStore.set(appConfig.auth.refreshCookieName, refreshToken, {
    ...shared,
    maxAge: parseDuration(appConfig.auth.refreshTokenExpiry) / 1000,
  });
}

/** Clears both session cookies. */
export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(appConfig.auth.accessCookieName);
  cookieStore.delete(appConfig.auth.refreshCookieName);
}
