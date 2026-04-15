/**
 * User feature types.
 * Shared type aliases for user-related responses.
 */

import type { UserWithRolesAndProfile } from "@/src/db/schema/index.ts";
import type { PaginatedListResponse } from "@/src/types.ts";

export type ListUsersPageResult = PaginatedListResponse<UserWithRolesAndProfile>;
