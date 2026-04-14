import type { ErrorCode } from "@/src/lib/errors.ts";

export type ApiErrorCode = ErrorCode;

export type ApiSuccessResponse<TData = unknown> = {
  success: true;
  data: TData;
  message: string;
};

export type ApiErrorResponse<TDetails = unknown> = {
  success: false;
  error: string;
  code: ApiErrorCode;
  details?: TDetails;
};

export type ApiResponse<TData = unknown, TDetails = unknown> = ApiSuccessResponse<TData> | ApiErrorResponse<TDetails>;

export type PaginatedListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type HealthData = {
  status: "ok" | "error";
  app: "running";
  db: "connected" | "disconnected";
  date: string;
};

export type LiveData = {
  status: "ok";
  app: "running";
  date: string;
};
