import type { z } from "zod";

/** Shared config shape used by API and server-action wrappers. */
export type HandlerConfig<TSchema extends z.ZodType = z.ZodType> = {
  /** Zod schema to validate the incoming payload. */
  schema?: TSchema;
  /** Require authentication. Defaults to false. */
  auth?: boolean;
  /** Roles required when auth is enabled. */
  roles?: string[];
};
