/**
 * Admin Contracts
 *
 * Validation schemas and types for admin user management endpoints.
 */

import { z } from "zod";

import { statusSchema, systemRoleSchema, userListBaseSchema } from "@/src/lib/validation.ts";

// ---------------------------------------------------------------------------
// Admin User Management
// ---------------------------------------------------------------------------

/** Query schema for paginated admin user listing (GET /api/admin/users). */
export const adminListUsersSchema = userListBaseSchema;

export type AdminListUsersQuery = z.infer<typeof adminListUsersSchema>;

/** Schema for updating a user's status (PATCH /api/admin/users/:id/status). */
export const adminUpdateUserStatusSchema = z.object({
  status: statusSchema,
});

export type AdminUpdateUserStatusRequest = z.infer<typeof adminUpdateUserStatusSchema>;

/** Schema for updating a user's role (PATCH /api/admin/users/:id/role). */
export const adminUpdateUserRoleSchema = z.object({
  role: systemRoleSchema,
});

export type AdminUpdateUserRoleRequest = z.infer<typeof adminUpdateUserRoleSchema>;
