export type ErrorCode =
  // Standard Application Errors
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "NOT_IMPLEMENTED"
  | "INTERNAL"
  // Auth & Access
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "TOKEN_REVOKED"
  // Account State
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_PENDING"
  // Conflicts
  | "EMAIL_EXISTS"
  | "USERNAME_EXISTS";

export const defaultErrorMessages: Record<ErrorCode, string> = {
  // Standard Application Errors
  VALIDATION_ERROR: "The provided data is invalid.",
  NOT_FOUND: "The requested resource could not be found.",
  NOT_IMPLEMENTED: "This endpoint is not implemented yet.",
  INTERNAL: "An unexpected internal server error occurred.",

  // Auth & Access
  UNAUTHORIZED: "You must be logged in to perform this action.",
  FORBIDDEN: "You do not have permission to perform this action.",
  INVALID_CREDENTIALS: "The email or password provided is incorrect.",
  TOKEN_EXPIRED: "Your session or verification token has expired.",
  TOKEN_INVALID: "The provided token is invalid or malformed.",
  TOKEN_REVOKED: "This token has been revoked.",

  // Account State
  ACCOUNT_SUSPENDED: "Your account has been suspended.",
  ACCOUNT_PENDING: "Your account is pending verification.",

  // Conflicts
  EMAIL_EXISTS: "A user with this email address already exists.",
  USERNAME_EXISTS: "This username is not available.",
};

export const defaultHttpStatus = {
  // Standard Application Errors
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  NOT_IMPLEMENTED: 501,
  INTERNAL: 500,

  // Auth & Access
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INVALID_CREDENTIALS: 401,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 400,
  TOKEN_REVOKED: 401,

  // Account State
  ACCOUNT_SUSPENDED: 403,
  ACCOUNT_PENDING: 403,

  // Conflicts
  EMAIL_EXISTS: 409,
  USERNAME_EXISTS: 409,
} as const satisfies Record<ErrorCode, number>;

export type AppHttpStatus = (typeof defaultHttpStatus)[ErrorCode];

/**
 * A unified application error class.
 * Ensures strict typing across the app and automatic mapping of HTTP status codes and default UI messages.
 */
export class AgoraError extends Error {
  public readonly code: ErrorCode;
  public readonly status: AppHttpStatus;
  // Structured app context (e.g. validation field errors) that can be mapped to API responses.
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message?: string,
    options?: {
      // Override only with statuses supported by this app's error mapping.
      status?: AppHttpStatus;
      // Low-level underlying error for debugging/tracing (not for end users).
      cause?: unknown;
      // High-level structured context for app/UI/API consumers.
      details?: unknown;
    },
  ) {
    // We pass both the message and the 'cause' safely to the native ES2022 Error constructor.
    super(message ?? defaultErrorMessages[code], { cause: options?.cause });

    this.name = "AgoraError";
    this.code = code;
    this.status = options?.status ?? defaultHttpStatus[code] ?? 500;
    this.details = options?.details;
  }
}
