import type { ApiClient } from "@/src/db/schema/index.ts";
import type { HandlerConfig } from "@/src/lib/wrapper-types.ts";
import type { ApiErrorResponse } from "@/src/types.ts";
import type { z } from "zod";

import { type NextRequest, NextResponse } from "next/server";

import { ApiClientService } from "@/src/features/auth/services/api-client.service.ts";
import { type AppSession, authenticate, authorize } from "@/src/lib/auth.ts";
import { AgoraError, defaultErrorMessages } from "@/src/lib/errors.ts";
import { logger } from "@/src/lib/logger.ts";
import { sanitizeInput } from "@/src/lib/utils.ts";

/**
 * API Wrapper
 *
 * A higher-order function that wraps Next.js API Route Handlers to provide a unified
 * pipeline for authentication, authorisation, validation, and error handling.
 *
 * Typical Flow:
 * 1. Authentication: If `auth: true` or `roles` are provided, it calls `authenticate()` to verify the access token/session.
 * 2. Authorisation: If `roles` are provided, it calls `authorize()` to check if the user has the required roles.
 * 3. Client Resolution: Resolves the API client making the request (useful for tenant/client-specific logic).
 * 4. Validation: If `bodySchema` is provided, it parses the payload as JSON, sanitizes it, and validates against the Zod schema.
 * 5. Execution: Runs your specific route handler with the strongly-typed `data`, `session`, `client`, and route `params`.
 * 6. Error Handling: Catches `AgoraError` (or internal errors) and transforms them into a standard `ApiErrorResponse` with correct HTTP status codes.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RouteParams = Promise<Record<string, string>>;

// Note: When `auth: true` is set, `session` is guaranteed non-null at runtime.
// TypeScript still types it as `Session | null` — use `session!` or a guard.

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function formatApiError(error: unknown): NextResponse {
  if (error instanceof AgoraError) {
    const response: ApiErrorResponse = {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    };

    const headers = new Headers();
    if (error.status === 401) {
      const isTokenError =
        error.code === "TOKEN_EXPIRED" || error.code === "TOKEN_INVALID" || error.code === "TOKEN_REVOKED";

      const authParams = isTokenError ? ' error="invalid_token"' : "";
      headers.set("WWW-Authenticate", `Bearer${authParams}`);
    }

    return NextResponse.json(response, { status: error.status, headers });
  }
  logger.error("Unhandled API error", error);
  const response: ApiErrorResponse = {
    success: false,
    error: defaultErrorMessages.INTERNAL,
    code: "INTERNAL",
  };
  return NextResponse.json(response, { status: 500 });
}

// ---------------------------------------------------------------------------
// withApiHandler
// ---------------------------------------------------------------------------

/** With schema — handler receives `{ request, data, session, client, params }`. */
export function withApiHandler<TSchema extends z.ZodType>(
  config: HandlerConfig<TSchema> & { bodySchema: TSchema },
  handler: (context: {
    request: NextRequest;
    data: z.infer<TSchema>;
    session: AppSession | null;
    client: ApiClient;
    params: RouteParams;
  }) => Promise<NextResponse>,
): (request: NextRequest, routeContext: { params: RouteParams }) => Promise<NextResponse>;

/** Without schema — handler receives `{ request, session, client, params }`. */
export function withApiHandler(
  config: Omit<HandlerConfig, "bodySchema">,
  handler: (context: {
    request: NextRequest;
    session: AppSession | null;
    client: ApiClient;
    params: RouteParams;
  }) => Promise<NextResponse>,
): (request: NextRequest, routeContext: { params: RouteParams }) => Promise<NextResponse>;

// Implementation
export function withApiHandler(
  config: HandlerConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required to satisfy varied generic overload signatures
  handler: (context: any) => Promise<NextResponse>,
) {
  return async (request: NextRequest, routeContext: { params: RouteParams }) => {
    try {
      // 1. Authentication
      let session: AppSession | null = null;
      // Check for roles also so that a forgotten auth `true` argument doesn't cause this step to be skipped.
      if (config.auth || config.roles?.length) {
        session = await authenticate();
      }

      // 2. Authorisation
      if (config.roles?.length && session) {
        authorize(session, config.roles);
      }

      // 3. Client Resolution
      let client: ApiClient;
      const clientId = request.headers.get("x-client-id");
      const apiKey = request.headers.get("x-api-key");

      if (clientId && apiKey) {
        try {
          client = await ApiClientService.authenticate(clientId, apiKey);
        } catch {
          throw new AgoraError("UNAUTHORIZED", "Invalid API client credentials provided.");
        }
      } else {
        client = await ApiClientService.getDefaultClient();
      }

      // 4. Validation & sanitisation (JSON body)
      let data: unknown;
      if (config.bodySchema) {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          throw new AgoraError("VALIDATION_ERROR", "Invalid or missing JSON body.");
        }
        // TODO: TEMPORARY — remove after debugging classmate's register issue
        console.log(`[DEBUG] ${request.method} ${request.nextUrl.pathname}`, {
          contentType: request.headers.get("content-type"),
          body,
        });
        const sanitised = sanitizeInput(body);
        const result = config.bodySchema.safeParse(sanitised);
        if (!result.success) {
          throw new AgoraError("VALIDATION_ERROR", "Validation failed.", {
            details: result.error.issues,
          });
        }
        data = result.data;
      }

      // 5. Execute handler
      const context = config.bodySchema
        ? { request, data, session, client, params: routeContext.params }
        : { request, session, client, params: routeContext.params };

      return await handler(context);
    } catch (error) {
      // 6. Error Handling
      return formatApiError(error);
    }
  };
}

// ---------------------------------------------------------------------------
// Usage examples
// ---------------------------------------------------------------------------
//
// // GET (no body, with auth):
// export const GET = withApiHandler(
//   { auth: true },
//   async ({ request, session, params }) => {
//     const { id } = await params;
//     const post = await postService.getById(id, session!.userId);
//     return NextResponse.json(post);
//   },
// );
//
// // POST (with body schema + auth):
// export const POST = withApiHandler(
//   { bodySchema: createPostSchema, auth: true },
//   async ({ data, session }) => {
//     const post = await postService.create(data, session!.userId);
//     return NextResponse.json(post, { status: 201 });
//   },
// );
//
// // Public POST (webhook, no auth):
// export const POST = withApiHandler(
//   { bodySchema: webhookSchema },
//   async ({ data }) => {
//     await webhookService.handle(data);
//     return NextResponse.json({ received: true });
//   },
// );
