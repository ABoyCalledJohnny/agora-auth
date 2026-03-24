/**
 * Application Constants
 *
 * This file contains global configuration constants and defaults.
 * It is categorized into logical sections:
 * - App Routes
 * - I18N
 * - Domain Boundaries
 * - Enums/System Types
 * - Default Settings
 */

// ============================================================================
// 1. APP ROUTES & CLIENTS
// ============================================================================
export const DEFAULT_VERIFY_EMAIL_PATH = "/verify-email/{token}";
export const DEFAULT_RESET_PASSWORD_PATH = "/reset-password/{token}";
export const DEFAULT_CLIENT_NAME = "Agora Default Client";

// ============================================================================
// 2. I18N
// ============================================================================
export const LOCALES = ["en", "de"] as const;
export const DEFAULT_LOCALE = "en" as const;

// ============================================================================
// 3. DOMAIN BOUNDARIES
// ============================================================================
export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

// Letters-only public IDs need slightly more length than base36 to keep similar entropy.
export const PUBLIC_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
export const PUBLIC_ID_LENGTH = 27;

// 32-bytes of high-entropy data encoded as base64url will always be exactly 43 characters long.
export const TOKEN_BYTE_LENGTH = 32;
export const TOKEN_STRING_LENGTH = 43;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 72;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

// Block reserved words for usernames to avoid impersonation and route conflicts.
export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "support",
  "root",
  "system",
  "help",
  "info",
  "contact",
  "webmaster",
  "test",
  "dev",
  "billing",
  "sales",
  "security",
  "administrator",
  "hilfe",
  "kontakt",
  "team",
  "impressum",
  "datenschutz",
  "rechtliches",
  "service",
  "presse",
  "jobs",
  "karriere",
  "bewerbung",
  "rechnung",
  "pay",
  "zahlungen",
]);

// ============================================================================
// 4. ENUMS & SYSTEM TYPES
// ============================================================================
type ZodEnumTuple = readonly [string, ...string[]];

/** Status lifecycle of a user account (e.g., active, suspended) */
export const USER_STATUS = ["pending", "active", "suspended"] as const satisfies ZodEnumTuple;
export type UserStatus = (typeof USER_STATUS)[number];

/** Core RBAC system roles (e.g., admin, user) */
export const SYSTEM_ROLE_NAMES = ["admin", "user"] as const satisfies ZodEnumTuple;
export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number];

/** Types of short-lived verification tokens (e.g., email_verification) */
export const VERIFICATION_TOKEN_TYPE = ["email_verification", "password_reset"] as const satisfies ZodEnumTuple;
export type VerificationTokenType = (typeof VERIFICATION_TOKEN_TYPE)[number];

// ============================================================================
// 5. DEFAULT SETTINGS
// ============================================================================
/** Standardized privacy toggles for user profiles */
export const DEFAULT_PRIVACY_SETTINGS = {
  profileVisibility: "private",
  showOnlineStatus: false,
  allowIndexing: false,
} as const;

export const DEFAULT_PREFERENCES = {
  theme: "system",
  language: DEFAULT_LOCALE,
  notifications: {
    email: {
      transactional: true,
      marketing: false,
      security: true,
      newsletter: false,
    },
    push: {
      messages: false,
      mentions: false,
      updates: false,
      posts: false,
    },
  },
} as const;

// ============================================================================
// 6. SECURITY & LOGGING
// ============================================================================
/** Object keys that should be automatically redacted in server logs to prevent sensitive data leaks. */
export const SENSITIVE_LOG_KEYS = new Set([
  // Passwords
  "password",
  "oldpassword",
  "newpassword",
  "passwordhash",

  // Tokens & Secrets
  "token",
  "tokenhash",
  "accesstoken",
  "refreshtoken",
  "sessiontoken",
  "sessiontokenhash",
  "secret",

  // API Keys
  "apikey",
  "apikeyhash",

  // HTTP Headers
  "authorization",
]);
