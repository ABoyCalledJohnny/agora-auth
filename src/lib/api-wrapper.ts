import { type NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { type Session, authenticate, authorize } from "@/src/lib/auth";
import { AgoraError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger.ts";
import type { ApiErrorResponse } from "@/src/types";
import { sanitizeInput } from "@/src/lib/utils";

//  TODO catch all for not implemented routes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RouteParams = Promise<Record<string, string>>;

/** Configuration for `withApiHandler`. */
type ApiConfig<TSchema extends z.ZodType = z.ZodType> = {
  /** Zod schema to validate the JSON request body. Omit for bodyless routes (GET, DELETE). */
  schema?: TSchema;
  /** Require authentication. Defaults to `false`. */
  auth?: boolean;
  /** Roles the user must hold (only checked when `auth` is `true`). */
  roles?: string[];
};

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

    // TODO(auth): For 401 responses, include `WWW-Authenticate` header
    // (e.g. `Bearer` or `Bearer error="invalid_token"`) so clients can
    // reliably detect authentication challenges.
    return NextResponse.json(response, { status: error.status });
  }
  logger.error("Unhandled API error", error);
  const response: ApiErrorResponse = {
    success: false,
    error: "An unexpected error occurred.",
    code: "INTERNAL",
  };
  return NextResponse.json(response, { status: 500 });
}

// ---------------------------------------------------------------------------
// withApiHandler
// ---------------------------------------------------------------------------

/** With schema — handler receives `{ request, data, session, params }`. */
export function withApiHandler<TSchema extends z.ZodType>(
  config: ApiConfig<TSchema> & { schema: TSchema },
  handler: (context: {
    request: NextRequest;
    data: z.infer<TSchema>;
    session: Session | null;
    params: RouteParams;
  }) => Promise<NextResponse>,
): (request: NextRequest, routeContext: { params: RouteParams }) => Promise<NextResponse>;

/** Without schema — handler receives `{ request, session, params }`. */
export function withApiHandler(
  config: Omit<ApiConfig, "schema">,
  handler: (context: { request: NextRequest; session: Session | null; params: RouteParams }) => Promise<NextResponse>,
): (request: NextRequest, routeContext: { params: RouteParams }) => Promise<NextResponse>;

// Implementation
export function withApiHandler(
  config: ApiConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- required for overload compatibility
  handler: (context: any) => Promise<NextResponse>,
) {
  return async (request: NextRequest, routeContext: { params: RouteParams }) => {
    try {
      // 1. Authentication
      let session: Session | null = null;
      if (config.auth) {
        session = await authenticate();
      }

      // 2. Authorisation
      if (config.roles?.length && session) {
        authorize(session, config.roles);
      }

      // 3. Validation & sanitisation (JSON body)
      let data: unknown;
      if (config.schema) {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          throw new AgoraError("VALIDATION_ERROR", "Invalid or missing JSON body.");
        }
        const sanitised = sanitizeInput(body);
        const result = config.schema.safeParse(sanitised);
        if (!result.success) {
          throw new AgoraError("VALIDATION_ERROR", "Validation failed.", {
            details: result.error.flatten(),
          });
        }
        data = result.data;
      }

      // 4. Execute handler
      const context = config.schema
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
//   { schema: createPostSchema, auth: true },
//   async ({ data, session }) => {
//     const post = await postService.create(data, session!.userId);
//     return NextResponse.json(post, { status: 201 });
//   },
// );
//
// // Public POST (webhook, no auth):
// export const POST = withApiHandler(
//   { schema: webhookSchema },
//   async ({ data }) => {
//     await webhookService.handle(data);
//     return NextResponse.json({ received: true });
//   },
// );
