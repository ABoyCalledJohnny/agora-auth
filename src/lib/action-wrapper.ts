import type { ApiClient } from "@/src/db/schema/index.ts";
import type { HandlerConfig } from "@/src/lib/wrapper-types.ts";
import type { ApiErrorResponse, ApiResponse } from "@/src/types.ts";
import type { z } from "zod";

import { isRedirectError } from "next/dist/client/components/redirect-error";

import { ApiClientService } from "@/src/features/auth/services/api-client.service.ts";
import { type AppSession, authenticate, authorize } from "@/src/lib/auth.ts";
import { AgoraError, defaultErrorMessages } from "@/src/lib/errors.ts";
import { logger } from "@/src/lib/logger.ts";
import { sanitizeInput } from "@/src/lib/utils.ts";

/**
 * Action Wrapper
 *
 * A higher-order function that wraps Next.js Server Actions to provide a unified
 * pipeline for authentication, authorisation, validation, and error handling.
 *
 * Typical Flow:
 * 1. Authentication: If `auth: true` or `roles` are provided, it calls `authenticate()` to verify the access token/session.
 * 2. Authorisation: If `roles` are provided, it calls `authorize()` to check if the user has the required roles.
 * 3. Client Resolution: Resolves the default internal API client (since this is a server action originating from our own frontend).
 * 4. Validation: If `bodySchema` is provided, it normalizes (handles FormData or plain objects), sanitizes, and validates the input against the Zod schema.
 * 5. Execution: Runs your specific server action handler with the strongly-typed `data`, `session`, and `client`.
 * 6. Error Handling: Catches `AgoraError` (or internal errors) and transforms them into a standard `ActionResult` union, preventing untyped exceptions from crashing the frontend.
 */

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
    error: defaultErrorMessages.INTERNAL,
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

/** With schema — handler receives `{ data, session, client }`. */
export function withActionHandler<TSchema extends z.ZodType, TResult>(
  config: HandlerConfig<TSchema> & { bodySchema: TSchema },
  handler: (context: { data: z.infer<TSchema>; session: AppSession | null; client: ApiClient }) => Promise<TResult>,
): (rawInput: z.input<TSchema> | FormData) => Promise<ActionResult<TResult>>;

/** Without schema — handler receives `{ session, client }`. */
export function withActionHandler<TResult>(
  config: Omit<HandlerConfig, "bodySchema">,
  handler: (context: { session: AppSession | null; client: ApiClient }) => Promise<TResult>,
): () => Promise<ActionResult<TResult>>;

// Implementation
export function withActionHandler(
  config: HandlerConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required to satisfy varied generic overload signatures
  handler: (context: any) => Promise<unknown>,
) {
  return async (rawInput?: unknown) => {
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
      // Server actions originate from our own frontend, so we always use the default client here.
      const client = await ApiClientService.getDefaultClient();

      // 4. Validation & sanitisation
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

      // 5. Execute handler & return success
      const context = config.bodySchema ? { data, session, client } : { session, client };
      const result = await handler(context);

      return { success: true as const, data: result };
    } catch (error) {
      // 6. Error Handling

      if (isRedirectError(error)) {
        throw error;
      }
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
