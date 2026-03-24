import { SENSITIVE_LOG_KEYS } from "../config/constants.ts";
import { appConfig } from "../config/index.ts";

export type LogLevel = "debug" | "info" | "warn" | "error";

export const logLevelWeights: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Calculate the current threshold once based on zod-validated config
const currentLevelWeight = logLevelWeights[appConfig.logging.level as LogLevel] ?? 1;

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

function redactData(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;

  if (Array.isArray(data)) {
    return data.map(redactData);
  }

  // Handle Error objects specially because message/stack are non-enumerable
  if (data instanceof Error) {
    const errorObj: Record<string, unknown> = {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };

    // Include custom properties (like code, details) which are usually enumerable
    for (const [key, value] of Object.entries(data)) {
      errorObj[key] = value;
    }

    // Redact the resulting plain object
    return redactData(errorObj);
  }

  const redactedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_LOG_KEYS.has(key.toLowerCase())) {
      redactedObj[key] = "[REDACTED]";
    } else {
      redactedObj[key] = redactData(value);
    }
  }

  return redactedObj;
}

function processArgs(args: unknown[]): unknown[] {
  // To allow un-redacted logs in development:
  // if (appConfig.app.env === "development") return args;

  return args.map(redactData);
}

// ---------------------------------------------------------------------------
// Logger Main
// ---------------------------------------------------------------------------

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (currentLevelWeight <= logLevelWeights.debug) {
      console.debug(`[DEBUG] ${message}`, ...processArgs(args));
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (currentLevelWeight <= logLevelWeights.info) {
      console.log(`[INFO] ${message}`, ...processArgs(args));
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (currentLevelWeight <= logLevelWeights.warn) {
      console.warn(`[WARN] ${message}`, ...processArgs(args));
    }
  },
  error: (message: string, error?: unknown) => {
    if (currentLevelWeight <= logLevelWeights.error) {
      console.error(`[ERROR] ${message}`, ...processArgs([error]));
    }
  },
};
