/**
 * @module validation
 * @description
 * Centralised Zod validation schemas and translation maps for the application.
 *
 * Sections:
 * 1. MESSAGES & I18N - Types for bridging translation keys with validation errors.
 * 2. PRIMITIVE CONSTANTS - Helper sets and pure values used strictly for validation.
 * 3. ENUMS & SYSTEM TYPES - Zod enum schemas tying into our database/routing constants.
 * 4. REUSABLE FIELD SCHEMAS - Base field schemas (passwords, slugs, etc.) with i18n support.
 * 5. COMPOSITE DOMAIN SCHEMAS - Complex object definitions for configurations and forms.
 */

import { z } from "zod";

import {
  DEFAULT_PREFERENCES,
  DEFAULT_PRIVACY_SETTINGS,
  LOCALES,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PUBLIC_ID_LENGTH,
  RESERVED_USERNAMES,
  SYSTEM_ROLE_NAMES,
  USER_STATUS,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  VERIFICATION_TOKEN_TYPE,
} from "@/src/config/constants.ts";

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

// ============================================================================
// 3. ENUMS & SYSTEM TYPES
// ============================================================================
// Data enums that are strictly tied to Database representations or routing.

/** Status lifecycle of a user account (e.g., active, suspended) */
export const statusSchema = z.enum(USER_STATUS);

/** Core RBAC system roles (e.g., admin, user) */
export const systemRoleSchema = z.enum(SYSTEM_ROLE_NAMES);

/** Types of short-lived verification tokens (e.g., email_verification) */
export const verificationTokenTypeSchema = z.enum(VERIFICATION_TOKEN_TYPE);

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

/**
 * Extension of paginationSchema for user list queries.
 * This guarantees safe inputs before hitting the UserRepository.
 */
export const userListQuerySchema = paginationSchema.extend({
  status: statusSchema.optional(),
  search: z.string().max(100).optional(),
  roleId: z.uuid().optional(), // assuming roleId is a UUID
  sortBy: z.enum(["username", "email", "createdAt", "updatedAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

/** Standardized privacy toggles for user profiles */
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(["members_only", "private"]).default(DEFAULT_PRIVACY_SETTINGS.profileVisibility),
  showOnlineStatus: z.boolean().default(DEFAULT_PRIVACY_SETTINGS.showOnlineStatus),
  allowIndexing: z.boolean().default(DEFAULT_PRIVACY_SETTINGS.allowIndexing),
});

export type PrivacySettings = z.infer<typeof privacySettingsSchema>;

/** Deeply nested User Application Preferences structure with safe fallbacks */
export const preferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).default(DEFAULT_PREFERENCES.theme),
  language: z.enum(LOCALES).default(DEFAULT_PREFERENCES.language), // Type assertion to avoid literal vs enum mismatch
  notifications: z
    .object({
      email: z
        .object({
          transactional: z.boolean().default(DEFAULT_PREFERENCES.notifications.email.transactional), // Essential system emails
          marketing: z.boolean().default(DEFAULT_PREFERENCES.notifications.email.marketing),
          security: z.boolean().default(DEFAULT_PREFERENCES.notifications.email.security), // Password changed, new login anomaly
          newsletter: z.boolean().default(DEFAULT_PREFERENCES.notifications.email.newsletter),
        })
        .default(DEFAULT_PREFERENCES.notifications.email),
      push: z
        .object({
          messages: z.boolean().default(DEFAULT_PREFERENCES.notifications.push.messages),
          mentions: z.boolean().default(DEFAULT_PREFERENCES.notifications.push.mentions),
          updates: z.boolean().default(DEFAULT_PREFERENCES.notifications.push.updates),
          posts: z.boolean().default(DEFAULT_PREFERENCES.notifications.push.posts),
        })
        .default(DEFAULT_PREFERENCES.notifications.push),
    })
    .default(DEFAULT_PREFERENCES.notifications),
});

export type Preferences = z.infer<typeof preferencesSchema>;
