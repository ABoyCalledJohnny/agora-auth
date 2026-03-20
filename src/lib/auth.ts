import { AgoraError } from "@/src/lib/errors.ts";
import { logger } from "@/src/lib/logger.ts";

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
  // TODO: IMPLEMENTATION STEPS
  // 1. Instatiate `cookies()` and format the secret names safely out of `appConfig`.
  // 2. Grab the Access JWT from the cookies.
  // 3. Call `JwtService.verify(token)`. If valid, map the AccessTokenPayload to `AppSession` and return it. (No DB call needed!).
  // 4. Catch `TOKEN_EXPIRED` inside the try/catch. If so, attempt to grab the Refresh Token.
  // 5. Call `AuthService.refresh(refreshToken)` to securely rotate the DB session and emit new tokens.
  // 6. Write the new tokens strictly back to the incoming/outgoing Next headers via `setSessionCookies()`.
  // 7. Map the newly generated parameters into `AppSession` and cleanly return it.

  throw new Error("getSession() is not implemented — connect your auth library here.");
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
