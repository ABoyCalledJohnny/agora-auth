import "server-only";

import { AgoraError } from "@/src/lib/errors.ts";
import { logger } from "@/src/lib/logger.ts";

/**
 * Standardised error handler for service layers.
 * Rethrows known application errors and logs unexpected (internal) errors
 * before throwing a generic 500 INTERNAL error.
 */
export function handleServiceError(error: unknown, logMessage: string): never {
  if (error instanceof AgoraError) throw error;
  logger.error(logMessage, error);
  throw new AgoraError("INTERNAL");
}
