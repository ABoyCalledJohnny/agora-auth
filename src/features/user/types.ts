import type { UserStatus } from "@/src/config/constants";
import type { User } from "@/src/db/schema";

export type UserListSortBy = "createdAt" | "updatedAt" | "username" | "email";
export type UserListSortDirection = "asc" | "desc";

export type ListUsersPageInput = {
  page: number;
  pageSize: number;
  status?: UserStatus;
  search?: string;
  sortBy?: UserListSortBy;
  sortDirection?: UserListSortDirection;
};

export type ListUsersPageResult = {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
};
