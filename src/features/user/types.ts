import type { UserStatus } from "@/src/config/constants";
import type { User } from "@/src/db/schema";

export type UserListSortBy = "createdAt" | "updatedAt" | "username" | "email";
export type UserListSortDirection = "asc" | "desc";

export type ListUsersPageInput = {
  page: number;
  limit: number;
  status?: UserStatus;
  search?: string;
  roleId?: string;
  sortBy?: UserListSortBy;
  sortDirection?: UserListSortDirection;
};

export type ListUsersPageResult = {
  items: User[];
  total: number;
  page: number;
  limit: number;
};
