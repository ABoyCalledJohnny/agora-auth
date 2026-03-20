import type { HandlerConfig } from "@/src/lib/wrapper-types.ts";
import type { ApiErrorResponse, ApiResponse } from "@/src/types.ts";
import type { z } from "zod";

import { type AppSession, authenticate, authorize } from "@/src/lib/auth.ts";
import { AgoraError } from "@/src/lib/errors.ts";
import { logger } from "@/src/lib/logger.ts";
import { sanitizeInput } from "@/src/lib/utils.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Discriminated union returned by every wrapped server action. */
export type ActionResult<T = void> = ApiResponse<T>;

// Note: When `auth: true` is set, `session` is guaranteed non-null at runtime.
// TypeScript still types it as `Session | null` — use `session!` or a guard.

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function formatActionError(error: unknown): ActionResult<never> {
  if (error instanceof AgoraError) {
    const response: ApiErrorResponse = {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    };
    return response;
  }
  logger.error("Unhandled action error", error);
  const response: ApiErrorResponse = {
    success: false,
    error: "An unexpected error occurred.",
    code: "INTERNAL",
  };
  return response;
}

function parseFormData(input: unknown): unknown {
  if (input instanceof FormData) {
    return Object.fromEntries(input);
  }
  return input;
}

// ---------------------------------------------------------------------------
// withActionHandler
// ---------------------------------------------------------------------------

/** With schema — handler receives `{ data, session }`. */
export function withActionHandler<TSchema extends z.ZodType, TResult>(
  config: HandlerConfig<TSchema> & { bodySchema: TSchema },
  handler: (context: { data: z.infer<TSchema>; session: AppSession | null }) => Promise<TResult>,
): (rawInput: z.input<TSchema> | FormData) => Promise<ActionResult<TResult>>;

/** Without schema — handler receives `{ session }`. */
export function withActionHandler<TResult>(
  config: Omit<HandlerConfig, "bodySchema">,
  handler: (context: { session: AppSession | null }) => Promise<TResult>,
): () => Promise<ActionResult<TResult>>;

// Implementation
export function withActionHandler(
  config: HandlerConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- required for overload compatibility
  handler: (context: any) => Promise<unknown>,
) {
  return async (rawInput?: unknown) => {
    try {
      // 1. Authentication
      let session: AppSession | null = null;
      if (config.auth) {
        session = await authenticate();
      }

      // 2. Authorisation
      if (config.roles?.length && session) {
        authorize(session, config.roles);
      }

      // 3. Validation & sanitisation
      let data: unknown;
      if (config.bodySchema) {
        const input = parseFormData(rawInput);
        const sanitised = sanitizeInput(input);
        const result = config.bodySchema.safeParse(sanitised);
        if (!result.success) {
          throw new AgoraError("VALIDATION_ERROR", "Validation failed.", {
            details: result.error.flatten(),
          });
        }
        data = result.data;
      }

      // 4. Execute handler
      const context = config.bodySchema ? { data, session } : { session };
      const result = await handler(context);

      // 5. Return success
      return { success: true as const, data: result };
    } catch (error) {
      return formatActionError(error);
    }
  };
}

// ---------------------------------------------------------------------------
// Usage examples
// ---------------------------------------------------------------------------
//
// // With schema + auth:
// "use server";
// export const createPost = withActionHandler(
//   { bodySchema: createPostSchema, auth: true, roles: ["author"] },
//   async ({ data, session }) => {
//     return postService.create(data, session!.userId);
//   },
// );
//
// // Without schema (e.g. logout):
// "use server";
// export const logout = withActionHandler(
//   { auth: true },
//   async ({ session }) => {
//     await authService.logout(session!.userId);
//   },
// );
//
// // Public action with schema (e.g. newsletter signup):
// "use server";
// export const subscribe = withActionHandler(
//   { bodySchema: subscribeSchema },
//   async ({ data }) => {
//     await newsletterService.subscribe(data.email);
//   },
// );
