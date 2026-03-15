import { appConfig } from "../config/index";

export type LogLevel = "debug" | "info" | "warn" | "error";

export const logLevelWeights: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Calculate the current threshold once based on zod-validated config
const currentLevelWeight = logLevelWeights[appConfig.logging.level as LogLevel] ?? 1;

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (currentLevelWeight <= logLevelWeights.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (currentLevelWeight <= logLevelWeights.info) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (currentLevelWeight <= logLevelWeights.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, error?: unknown) => {
    if (currentLevelWeight <= logLevelWeights.error) {
      console.error(`[ERROR] ${message}`, error);
    }
  },
};
