/**
 * Utility Functions
 *
 * - `sanitizeInput`: Recursively sanitises string values in request payloads.
 * - `parseDuration`: Parses a human-readable duration string into milliseconds.
 * - `cn`: Merges Tailwind classes dynamically using clsx and tailwind-merge.
 * - `createPublicId`: Creates a unique public ID of 24 alphanumeric characters.
 * - `stripUndefined`: Strips explicit `undefined` values from an object to satisfy Drizzle types.
 * - `isSafeRedirect`: Validates if a provided target URL or origin securely matches an allowed base URL.
 */

import { type ClassValue, clsx } from "clsx";
import { customAlphabet } from "nanoid";
import { twMerge } from "tailwind-merge";

import { PUBLIC_ID_ALPHABET, PUBLIC_ID_LENGTH } from "@/src/config/constants.ts";
import { AgoraError } from "@/src/lib/errors.ts";

/**
 * Recursively sanitises string values in the input by trimming whitespace.
 *
 * Note: This function strips prototypes and methods from complex objects
 * (like class instances) and returns plain objects. Only intended for
 * plain JSON-serialisable structures (e.g. DTOs or request payloads).
 */
export function sanitizeInput<T>(data: T): T {
  if (typeof data === "string") {
    return data.trim() as T;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeInput) as T;
  }
  // The null check is required because in JavaScript, `typeof null` evaluates to "object".
  // Without it, Object.entries(null) would throw a TypeError.
  if (data !== null && typeof data === "object" && !(data instanceof Date)) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, sanitizeInput(value)])) as T;
  }
  return data;
}

/**
 * Parses a human-readable duration string (e.g. '15m', '7d', '24h') into
 * milliseconds. Used to compute DB `expires_at` timestamps from config values.
 */
export function parseDuration(str: string): number {
  const match = str.match(/^(\d+)([mhd])$/);
  if (!match) {
    throw new AgoraError("INTERNAL", `Invalid configuration duration string provided: ${str}.`);
  }
  const [, value, unit] = match;
  const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000 };

  // `typeof multipliers` infers the shape { m: number, h: number, d: number }
  // `keyof typeof multipliers` extracts the exact literal union "m" | "h" | "d"
  // `keyof` itself only works on Types, not JavaScript values, so `typeof` bridges the gap.
  return Number(value) * multipliers[unit as keyof typeof multipliers];
}

/** Merges Tailwind classes dynamically. Usage: cn('text-red-500', isError && 'text-blue-500') */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Creates a unique public ID of 24 alphanumeric characters. */
export const createPublicId = customAlphabet(PUBLIC_ID_ALPHABET, PUBLIC_ID_LENGTH);

/**
 * Strips explicit `undefined` values from an object.
 * Essential for passing partial payloads into Drizzle ORM schemas whilst
 * satisfying the strict `exactOptionalPropertyTypes` TypeScript configuration.
 */
export function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]: Exclude<T[K], undefined>;
  };
}

/**
 * Validates if a provided target URL or origin securely matches an allowed base URL.
 * Useful for preventing open redirect attacks on frontend login forms
 * and backend API client validations.
 *
 * @param allowedBaseUrl The trusted base URL (e.g. "https://example.com/app").
 * @param urlToVerify The requested redirect URL or origin (e.g. "/login" or "https://evil.com").
 * @returns True if the target URL safely falls under the allowed base URL.
 */
export function isSafeRedirect(allowedBaseUrl: string, urlToVerify: string): boolean {
  try {
    const allowed = new URL(allowedBaseUrl);

    // Passing allowed.origin acts as a fallback for relative paths.
    // If urlToVerify is relative (e.g., "/login"), it prepends allowed.origin.
    // If urlToVerify is absolute (e.g., "https://evil.com"), it ignores the fallback entirely.
    const target = new URL(urlToVerify, allowed.origin);

    // 1. Strict origin check (protocol, domain, port).
    // This protects against string-based bypasses like https://example.com.evil.com/
    if (target.origin !== allowed.origin) {
      return false;
    }

    // 2. Strict path prefix check.
    // We append a trailing slash to both paths to prevent prefix bypass attacks.
    // E.g. protecting "/app" from being bypassed by "/app-evil".
    const allowedPath = allowed.pathname.endsWith("/") ? allowed.pathname : allowed.pathname + "/";
    const targetPath = target.pathname.endsWith("/") ? target.pathname : target.pathname + "/";

    return targetPath.startsWith(allowedPath);
  } catch {
    // Rejects malformed URLs securely.
    return false;
  }
}
