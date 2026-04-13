import type { UserWithRolesAndProfile } from "@/src/db/schema/index.ts";
import type { PaginatedListResponse } from "@/src/types.ts";

export type AdminListUsersResult = PaginatedListResponse<UserWithRolesAndProfile>;
