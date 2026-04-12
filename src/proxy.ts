import type { NextRequest } from "next/server";

import { importSPKI, jwtVerify } from "jose";
import { NextResponse } from "next/server";

import { appConfig } from "@/src/config/index.ts";
import { parseDuration } from "@/src/lib/utils.ts";

// JWT verification — uses jose directly instead of JwtService because
// proxy.ts is bundled separately by Next.js and cannot import `server-only`.
let cachedPublicKey: Awaited<ReturnType<typeof importSPKI>> | null = null;

async function verifyAccessToken(token: string) {
  if (!cachedPublicKey) {
    cachedPublicKey = await importSPKI(appConfig.auth.jwtPublicKey, "RS256");
  }
  await jwtVerify(token, cachedPublicKey, {
    issuer: appConfig.app.url,
    audience: appConfig.app.url,
  });
}

// ---------------------------------------------------------------------------
// Proxy — Silent Token Refresh
//
// Runs before every matched page navigation. If the access token is expired
// but a refresh token exists, it fetches POST /api/auth/refresh to rotate
// the session and sets fresh cookies on the forwarded request.
//
// This replaces the old redirect-based flow where assertAuth() redirected
// to GET /api/auth/refresh, which caused two extra HTTP round-trips and a
// duplicate page render.
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(appConfig.auth.accessCookieName)?.value;
  const refreshToken = request.cookies.get(appConfig.auth.refreshCookieName)?.value;

  // No tokens at all — nothing to do
  if (!accessToken && !refreshToken) {
    return NextResponse.next();
  }

  // Access token present — verify it
  if (accessToken) {
    try {
      await verifyAccessToken(accessToken);
      // Still valid — proceed normally
      return NextResponse.next();
    } catch {
      // Expired or invalid — fall through to refresh attempt
    }
  }

  // No refresh token available — can't refresh, let the page handle it
  if (!refreshToken) {
    return NextResponse.next();
  }

  // Attempt silent refresh via POST /api/auth/refresh
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;

    const res = await fetch(`${appConfig.app.url}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientIp && { "x-forwarded-for": clientIp }),
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return NextResponse.next();
    }

    const { data } = await res.json();

    // Set fresh cookies on both the forwarded request (for downstream
    // Server Components) and the outgoing response (for the browser).
    const response = NextResponse.next();

    response.cookies.set(appConfig.auth.accessCookieName, data.accessToken, {
      ...appConfig.auth.cookieDefaults,
      maxAge: parseDuration(appConfig.auth.accessTokenExpiry) / 1000,
    });
    response.cookies.set(appConfig.auth.refreshCookieName, data.refreshToken, {
      ...appConfig.auth.cookieDefaults,
      maxAge: parseDuration(appConfig.auth.refreshTokenExpiry) / 1000,
    });

    return response;
  } catch {
    // Refresh failed — proceed without session (page will redirect to login)
    return NextResponse.next();
  }
}

// ---------------------------------------------------------------------------
// Matcher — skip API routes and static assets
// ---------------------------------------------------------------------------

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
