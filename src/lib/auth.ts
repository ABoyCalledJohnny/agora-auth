import type { Session as DbSession } from "@/src/db/schema/auth";
import { AgoraError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// This is the rich object your wrapper and handlers will actually use!
export type Session = DbSession & {
  user: {
    id: string;
    username: string;
    roles: string[]; // <-- Attached seamlessly
  };
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
export async function getSession(): Promise<Session | null> {
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
export async function authenticate(): Promise<Session> {
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
export function authorize(session: Session, requiredRoles: string[]): void {
  if (requiredRoles.length === 0) return;

  const hasRole = requiredRoles.some((role) => session.user.roles.includes(role));
  if (!hasRole) {
    logger.warn(`Authorisation denied for user ${session.userId}`, {
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
export async function assertAuth(options?: { roles?: string[] }): Promise<Session> {
  const session = await authenticate();
  if (options?.roles) {
    authorize(session, options.roles);
  }
  return session;
}
