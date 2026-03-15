/**
 * Setup Utility Functions:
 *
 * - `sanitizeInput`: Recursively sanitises string values in request payloads.
 * - `parseDuration`: Parses a human-readable duration string into milliseconds.
 * - `setSessionCookies`: Sets the session cookie pair with secure defaults.
 * - `clearSessionCookies`: Clears both session cookies.
 * - `cn`: A utility to merge Tailwind classes cleanly using clsx and tailwind-merge.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { cookies } from "next/headers";
import { appConfig } from "@/src/config/";
import { AgoraError } from "@/src/lib/errors";

/**
 * Recursively sanitises string values in the input by trimming whitespace.
 *
 * NOTE: This function strips prototypes and methods from complex objects
 * (like class instances) and returns plain objects. It is only intended
 * for plain JSON-serializable structures (e.g., DTOs or Request payloads).
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
    throw new AgoraError("INTERNAL", `Invalid configuration duration string provided: ${str}`);
  }
  const [, value, unit] = match;
  const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000 };

  // `typeof multipliers` infers the shape { m: number, h: number, d: number }
  // `keyof typeof multipliers` extracts the exact literal union "m" | "h" | "d"
  // `keyof` itself only works on Types, not JavaScript values, so `typeof` bridges the gap.
  return Number(value) * multipliers[unit as keyof typeof multipliers];
}

/**
 * Sets the session cookie pair (access + refresh tokens) with secure defaults
 * from appConfig. Used by withApiHandler, withActionHandler, and proxy.ts.
 */
export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const shared = {
    httpOnly: true,
    secure: appConfig.app.env === "production",
    sameSite: appConfig.auth.cookieSameSite,
    path: "/",
  } as const;

  cookieStore.set(appConfig.auth.accessCookieName, accessToken, {
    ...shared,
    maxAge: parseDuration(appConfig.auth.accessTokenExpiry) / 1000,
  });

  cookieStore.set(appConfig.auth.refreshCookieName, refreshToken, {
    ...shared,
    maxAge: parseDuration(appConfig.auth.refreshTokenExpiry) / 1000,
  });
}

/** Clears both session cookies. */
export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(appConfig.auth.accessCookieName);
  cookieStore.delete(appConfig.auth.refreshCookieName);
}

/**
 * Merges Tailwind classes dynamically. Usage: cn('text-red-500', isError && 'text-blue-500')
 * `cn` -> "class name"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
