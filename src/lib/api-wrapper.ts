import type { HandlerConfig } from "@/src/lib/wrapper-types.ts";
import type { ApiErrorResponse } from "@/src/types.ts";
import type { z } from "zod";

import { type NextRequest, NextResponse } from "next/server";

import { authenticate, authorize, type Session } from "@/src/lib/auth.ts";
import { AgoraError, defaultErrorMessages } from "@/src/lib/errors.ts";
import { logger } from "@/src/lib/logger.ts";
import { sanitizeInput } from "@/src/lib/utils.ts";

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

/** With schema — handler receives `{ request, data, session, params }`. */
export function withApiHandler<TSchema extends z.ZodType>(
  config: HandlerConfig<TSchema> & { bodySchema: TSchema },
  handler: (context: {
    request: NextRequest;
    data: z.infer<TSchema>;
    session: Session | null;
    params: RouteParams;
  }) => Promise<NextResponse>,
): (request: NextRequest, routeContext: { params: RouteParams }) => Promise<NextResponse>;

/** Without schema — handler receives `{ request, session, params }`. */
export function withApiHandler(
  config: Omit<HandlerConfig, "bodySchema">,
  handler: (context: { request: NextRequest; session: Session | null; params: RouteParams }) => Promise<NextResponse>,
): (request: NextRequest, routeContext: { params: RouteParams }) => Promise<NextResponse>;

// Implementation
export function withApiHandler(
  config: HandlerConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- required for overload compatibility
  handler: (context: any) => Promise<NextResponse>,
) {
  return async (request: NextRequest, routeContext: { params: RouteParams }) => {
    try {
      // 1. Authentication
      let session: Session | null = null;
      // Check for roles also so that a forgotten auth `true` argument doesn't cause this step to be skipped.
      if (config.auth || config.roles?.length) {
        session = await authenticate();
      }

      // 2. Authorisation
      if (config.roles?.length && session) {
        authorize(session, config.roles);
      }

      // 3. Validation & sanitisation (JSON body)
      let data: unknown;
      if (config.bodySchema) {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          throw new AgoraError("VALIDATION_ERROR", "Invalid or missing JSON body.");
        }
        const sanitised = sanitizeInput(body);
        const result = config.bodySchema.safeParse(sanitised);
        if (!result.success) {
          throw new AgoraError("VALIDATION_ERROR", "Validation failed.", {
            details: result.error.issues,
          });
        }
        data = result.data;
      }

      // 4. Execute handler
      const context = config.bodySchema
        ? { request, data, session, params: routeContext.params }
        : { request, session, params: routeContext.params };

      return await handler(context);
    } catch (error) {
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
