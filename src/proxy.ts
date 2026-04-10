import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { appConfig } from "@/src/config/index.ts";
import { JwtService } from "@/src/features/auth/services/jwt.service.ts";
import { parseDuration } from "@/src/lib/utils.ts";

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

const IS_PROD = appConfig.app.env === "production";
const COOKIE_PREFIX = IS_PROD ? "__Secure-" : "";
const ACCESS_COOKIE = `${COOKIE_PREFIX}${appConfig.auth.accessCookieName}`;
const REFRESH_COOKIE = `${COOKIE_PREFIX}${appConfig.auth.refreshCookieName}`;
const ACCESS_MAX_AGE = parseDuration(appConfig.auth.accessTokenExpiry) / 1000;
const REFRESH_MAX_AGE = parseDuration(appConfig.auth.refreshTokenExpiry) / 1000;

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
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // No tokens at all — nothing to do
  if (!accessToken && !refreshToken) {
    return NextResponse.next();
  }

  // Access token present — verify it
  if (accessToken) {
    try {
      await JwtService.verify(accessToken);
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
    const cookieOptions = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: appConfig.auth.cookieSameSite,
      path: "/",
    };

    response.cookies.set(ACCESS_COOKIE, data.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_MAX_AGE,
    });
    response.cookies.set(REFRESH_COOKIE, data.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_MAX_AGE,
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
