import type { AuthTokens } from "@/src/features/auth/types.ts";
import type { ApiSuccessResponse } from "@/src/types.ts";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { appConfig } from "@/src/config/index.ts";
import { refreshSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { clearSessionCookies, getRequestMetadata, getSessionCookies, setSessionCookies } from "@/src/lib/auth.ts";
import { AgoraError } from "@/src/lib/errors.ts";
import { isSafeRedirect } from "@/src/lib/utils.ts";

/**
 * GET /api/auth/refresh
 *
 * Browser-facing silent refresh endpoint. Called by `assertAuth()` when a
 * Server Component detects an expired access token but a refresh cookie
 * still exists. Rotates the session, writes new cookies, and redirects
 * back to the original page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextParam = url.searchParams.get("next") ?? "/";
  const safeRedirect = isSafeRedirect(appConfig.app.url, nextParam) ? nextParam : "/";
  const loginUrl = `/login?next=${encodeURIComponent(safeRedirect)}`;

  const { refreshCookie } = await getSessionCookies();
  if (!refreshCookie) {
    redirect(loginUrl);
  }

  let success = false;
  try {
    const { ipAddress } = await getRequestMetadata();
    const authTokens = await AuthService.refresh(refreshCookie.value, ipAddress);
    await setSessionCookies(authTokens.accessToken, authTokens.refreshToken);
    success = true;
  } catch (error) {
    if (error instanceof AgoraError) {
      if (["ACCOUNT_SUSPENDED", "ACCOUNT_PENDING", "UNAUTHORIZED"].includes(error.code)) {
        await clearSessionCookies();
      }
    }
  }

  redirect(success ? safeRedirect : loginUrl);
}

export const POST = withApiHandler(
  {
    bodySchema: refreshSchema,
  },
  async ({ data: { refreshToken } }) => {
    const authTokens = await AuthService.refresh(refreshToken);

    const data: ApiSuccessResponse<AuthTokens> = {
      success: true,
      message: enTranslations.Auth.refreshSuccess,
      data: {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        expiresAt: authTokens.expiresAt,
      },
    };

    return NextResponse.json(data);
  },
);
