import "server-only";

import type { SystemRoleName } from "../config/constants.ts";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { appConfig } from "@/src/config/index.ts";
import { JwtService } from "@/src/features/auth/services/jwt.service.ts";
import { AgoraError } from "@/src/lib/errors.ts";
import { logger } from "@/src/lib/logger.ts";

import { AuthService } from "../features/auth/services/auth.service.ts";
import { parseDuration } from "./utils.ts";

/**
 * Global Authentication Context
 *
 * Server-side mechanisms for retrieving, verifying, and asserting user session
 * state. Single source of truth for "who the user is" inside Next.js Server
 * Components, Server Actions, and API Route Handlers.
 *
 * - `getSession()`: Soft check. Returns the session from cookies, or null.
 * - `authenticate()`: Hard check. Guarantees a valid session or throws UNAUTHORIZED.
 * - `authorize()`: Validates RBAC roles against a required list.
 * - `assertAuth()`: Convenience helper for protecting page components.
 * - `getSessionCookies()`: Retrieves the raw access and refresh cookies.
 * - `setSessionCookies()`: Sets the session cookie pair with secure defaults.
 * - `clearSessionCookies()`: Clears both session cookies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// This becomes the standard user context available to all Next.js pages/components.
export type AppSession = {
  user: {
    id: string; // mapped from sub
    username: string;
    roles: string[];
  };
  sessionId: string; // mapped from sid
};

// ---------------------------------------------------------------------------
// Session retrieval (read-only - safe for Server Components)
// ---------------------------------------------------------------------------

/**
 * Reads the access JWT from the cookie and verifies it.
 *
 * This is a read-only check: it never writes cookies, so it is safe to call
 * from Server Components, Server Actions, and Route Handlers alike.
 *
 * If the access JWT is expired or missing, returns `null` without attempting
 * a refresh. Silent token refresh is handled by:
 * - `proxy.ts` - for page navigations (runs before the render).
 * - `authenticate()` - for Server Actions / Route Handlers.
 */
export const getSession = cache(_getSession);

async function _getSession(): Promise<AppSession | null> {
  const { accessCookie } = await getSessionCookies();

  if (!accessCookie) {
    return null;
  }

  try {
    const payload = await JwtService.verify(accessCookie.value);
    return {
      sessionId: payload.sid,
      user: {
        id: payload.sub,
        username: payload.username,
        roles: payload.roles,
      },
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Verifies a valid access JWT exists and returns the decoded payload.
 * If the access token is expired but a valid refresh cookie is present,
 * silently rotates the session and updates the cookies.
 *
 * Only safe in Server Actions and Route Handlers (contexts that can
 * write cookies). For Server Components, use `getSession()` / `assertAuth()`.
 *
 * @throws {AgoraError} UNAUTHORIZED if no valid session can be established.
 */
export async function authenticate(): Promise<AppSession> {
  const { accessCookie, refreshCookie } = await getSessionCookies();

  // No tokens at all - nothing to do.
  if (!accessCookie && !refreshCookie) {
    throw new AgoraError("UNAUTHORIZED");
  }

  // Fast path: verify access token directly.
  if (accessCookie) {
    try {
      const payload = await JwtService.verify(accessCookie.value);
      return {
        sessionId: payload.sid,
        user: {
          id: payload.sub,
          username: payload.username,
          roles: payload.roles,
        },
      };
    } catch {
      // Expired or invalid - fall through to refresh attempt.
    }
  }

  // Slow path: attempt silent refresh.
  if (!refreshCookie) {
    throw new AgoraError("UNAUTHORIZED");
  }

  try {
    const { ipAddress } = await getRequestMetadata();
    const authTokens = await AuthService.refresh(refreshCookie.value, ipAddress);
    await setSessionCookies(authTokens.accessToken, authTokens.refreshToken);

    const payload = await JwtService.verify(authTokens.accessToken);
    return {
      sessionId: payload.sid,
      user: {
        id: payload.sub,
        username: payload.username,
        roles: payload.roles,
      },
    };
  } catch (error) {
    if (error instanceof AgoraError) {
      if (["ACCOUNT_SUSPENDED", "ACCOUNT_PENDING", "UNAUTHORIZED"].includes(error.code)) {
        await clearSessionCookies();
      }
    }
    throw new AgoraError("UNAUTHORIZED");
  }
}

// ---------------------------------------------------------------------------
// Authorisation
// ---------------------------------------------------------------------------

/**
 * Checks that the decoded JWT payload holds at least one of the required roles.
 *
 * @throws {AgoraError} FORBIDDEN if the check fails.
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
 * Redirects unauthenticated users to `/login` (with optional `?next=` path).
 *
 * @throws {AgoraError} FORBIDDEN if the user lacks required roles.
 */
export async function assertAuth(options: { roles?: SystemRoleName[]; redirectTo?: string } = {}): Promise<AppSession> {
  const session = await getSession();
  if (!session) {
    // By the time we reach here, proxy.ts has already attempted a silent
    // refresh. If there is still no session the user must log in.
    const destination = options.redirectTo ?? "/";
    redirect(`/login?next=${encodeURIComponent(destination)}`);
  }
  if (options.roles) {
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

  const accessCookie = cookieStore.get(appConfig.auth.accessCookieName) ?? null;
  const refreshCookie = cookieStore.get(appConfig.auth.refreshCookieName) ?? null;

  return { accessCookie, refreshCookie };
}

/**
 * Sets the session cookie pair (access + refresh tokens) with secure defaults
 * from appConfig. Used by withApiHandler, withActionHandler, and proxy.ts.
 */
export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(appConfig.auth.accessCookieName, accessToken, {
    ...appConfig.auth.cookieDefaults,
    maxAge: parseDuration(appConfig.auth.accessTokenExpiry) / 1000,
  });

  cookieStore.set(appConfig.auth.refreshCookieName, refreshToken, {
    ...appConfig.auth.cookieDefaults,
    maxAge: parseDuration(appConfig.auth.refreshTokenExpiry) / 1000,
  });
}

/** Clears both session cookies. */
export async function clearSessionCookies() {
  const cookieStore = await cookies();

  const deleteOptions = {
    path: appConfig.auth.cookieDefaults.path,
    secure: appConfig.auth.cookieDefaults.secure,
    sameSite: appConfig.auth.cookieDefaults.sameSite,
  } as const;

  cookieStore.delete({ name: appConfig.auth.accessCookieName, ...deleteOptions });
  cookieStore.delete({ name: appConfig.auth.refreshCookieName, ...deleteOptions });
}

/** Extracts the IP address and user agent from the current request headers. */
export async function getRequestMetadata(): Promise<{ ipAddress: string; userAgent: string }> {
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}
