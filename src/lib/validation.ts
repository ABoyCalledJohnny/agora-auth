import { PUBLIC_ID_LENGTH, RESERVED_USERNAMES } from "@/src/config/constants";
import { defaultLocale, locales } from "@/src/config/index";
import { z } from "zod";

// ============================================================================
// 1. MESSAGES & I18N
// ============================================================================
// Defines the keys required for internationalizing validation errors.

type ValidationMessageKey =
  | "passwordMinLength"
  | "passwordMaxLength"
  | "passwordLowercase"
  | "passwordUppercase"
  | "passwordNumber"
  | "passwordSpecial"
  | "usernameMinLength"
  | "usernameMaxLength"
  | "usernameFormat"
  | "usernameReserved"
  | "publicIdFormat"
  | "internalPathStartsWithSlash"
  | "internalPathProtocolRelative"
  | "slugFormat"
  | "slugMinLength"
  | "slugMaxLength";

export type ValidationTranslator = (key: ValidationMessageKey) => string;

// ============================================================================
// 2. PRIMITIVE CONSTANTS
// ============================================================================
// Validation limits and sets used to power the schemas below.

const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES);
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 72;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

// ============================================================================
// 3. ENUMS & SYSTEM TYPES
// ============================================================================
// Data enums that are strictly tied to Database representations or routing.

type ZodEnumTuple = readonly [string, ...string[]];

/** Status lifecycle of a user account (e.g., active, suspended) */
export const USER_STATUS = ["pending", "active", "suspended"] as const satisfies ZodEnumTuple;
export type UserStatus = (typeof USER_STATUS)[number];
export const statusSchema = z.enum(USER_STATUS);

/** Core RBAC system roles (e.g., admin, user) */
export const SYSTEM_ROLE_NAMES = ["admin", "user"] as const satisfies ZodEnumTuple;
export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number];
export const systemRoleSchema = z.enum(SYSTEM_ROLE_NAMES);

/** Types of short-lived verification tokens (e.g., email_verification) */
export const VERIFICATION_TOKEN_TYPE = ["email_verification", "password_reset"] as const satisfies ZodEnumTuple;
export const verificationTokenTypeSchema = z.enum(VERIFICATION_TOKEN_TYPE);
export type VerificationTokenType = (typeof VERIFICATION_TOKEN_TYPE)[number];

// ============================================================================
// 4. REUSABLE FIELD SCHEMAS
// ============================================================================
// Factory functions that accept a translation hook to return localized errors.

/** Strict identifier validation for NanoIDs exposed in public URLs */
export const publicIdSchema = (t: ValidationTranslator) =>
  z.string().regex(new RegExp(`^[a-z]{${PUBLIC_ID_LENGTH}}$`), t("publicIdFormat"));

/** Comprehensive password security policy */
export const passwordRules = (t: ValidationTranslator) =>
  z
    .string()
    .min(PASSWORD_MIN_LENGTH, { message: t("passwordMinLength") })
    .max(PASSWORD_MAX_LENGTH, { message: t("passwordMaxLength") })
    .regex(/[a-z]/, { message: t("passwordLowercase") })
    .regex(/[A-Z]/, { message: t("passwordUppercase") })
    .regex(/[0-9]/, { message: t("passwordNumber") })
    .regex(/[\W_]/, { message: t("passwordSpecial") });

/** Unique username rules including bounds, formatting, and reserved words */
export const usernameRules = (t: ValidationTranslator) =>
  z
    .string()
    .min(USERNAME_MIN_LENGTH, { message: t("usernameMinLength") })
    .max(USERNAME_MAX_LENGTH, { message: t("usernameMaxLength") })
    .regex(/^[a-z0-9_-]+$/, { message: t("usernameFormat") })
    .refine((value) => !RESERVED_USERNAME_SET.has(value), {
      message: t("usernameReserved"),
    });

/** Validates strictly internal generic paths to prevent Open Redirect attacks */
export const internalPathSchema = (t: ValidationTranslator) =>
  z
    .string()
    .startsWith("/", { message: t("internalPathStartsWithSlash") })
    .refine((value) => !value.startsWith("//"), { message: t("internalPathProtocolRelative") });

/** Standard URL-friendly slug generator validation */
export const slugSchema = (t: ValidationTranslator) =>
  z
    .string()
    .min(3, { message: t("slugMinLength") })
    .max(64, { message: t("slugMaxLength") })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: t("slugFormat") });

// ============================================================================
// 5. COMPOSITE DOMAIN SCHEMAS
// ============================================================================
// Complex object schemas representing configuration, settings, and forms.

/** Standard Pagination bounds for Search Parameters */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(10), // Limit per page DoS protection
});

/** Standardized privacy toggles for user profiles */
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(["members_only", "private"]).default("private"),
  showOnlineStatus: z.boolean().default(false),
  allowIndexing: z.boolean().default(false),
});

/** Deeply nested User Application Preferences structure with safe fallbacks */
export const preferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).default("system"),
  language: z.enum(locales).default(defaultLocale),
  notifications: z
    .object({
      email: z
        .object({
          transactional: z.boolean().default(true), // Essential system emails
          marketing: z.boolean().default(false),
          security: z.boolean().default(true), // Password changed, new login anomaly
          newsletter: z.boolean().default(false),
        })
        .default({
          transactional: true,
          marketing: false,
          security: true,
          newsletter: false,
        }),
      push: z
        .object({
          messages: z.boolean().default(false),
          mentions: z.boolean().default(false),
          updates: z.boolean().default(false),
          posts: z.boolean().default(false),
        })
        .default({
          messages: false,
          mentions: false,
          updates: false,
          posts: false,
        }),
    })
    .default({
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
    }),
});
