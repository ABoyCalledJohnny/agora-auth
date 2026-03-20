import type { UserStatus } from "@/src/config/constants.ts";
import type { User } from "@/src/db/schema/index.ts";
import type { PaginatedListRequest, PaginatedListResponse } from "@/src/types.ts";

export type UserListSortBy = "createdAt" | "updatedAt" | "username" | "email";
export type UserListSortDirection = "asc" | "desc";

export type ListUsersPageInput = PaginatedListRequest<UserListSortBy, UserListSortDirection> & {
  page: number;
  limit: number;
  status?: UserStatus;
  roleId?: string;
};

export type ListUsersPageResult = PaginatedListResponse<User>;
