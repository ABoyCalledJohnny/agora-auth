import { z } from "zod";
import { DEFAULT_LOCALE, LOCALES } from "./constants";

// ---------------------------------------------------------------------------
// 1. Environment schema — validates process.env at import time.
//    If a required variable is missing the server won't start.
//
//    z.coerce.number() converts the env string ("5432") to a number before
//    validating. `.default()` applies when the value is undefined/missing;
//    if a value is present but invalid (e.g. "abc" for a number), Zod throws.
// ---------------------------------------------------------------------------

// TODO stricter checks

const envSchema = z.object({
  // App
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  HOSTNAME: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database variables
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_DB: z.string().min(1),

  // App User (Limited privileges - used by Next.js at runtime)
  APP_DB_USER: z.string().min(1),
  APP_DB_PASSWORD: z.string().min(1),

  // Auth
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  AUTH_SECRET: z.string().min(1),

  // Bootstrap / Initialization
  INITIAL_ADMIN_EMAIL: z.string().email(),
  INITIAL_ADMIN_USERNAME: z.string().min(1),
  INITIAL_ADMIN_PASSWORD: z.string().min(1),
  DEFAULT_CLIENT_SECRET: z.string().min(1),

  // Email (SMTP)
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  MAIL_FROM: z.string().default("noreply@localhost.com"),

  // Feature flags
  NEXT_PUBLIC_ENABLE_REGISTRATION: z.string().default("true"),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const env = envSchema.parse(process.env);

// ---------------------------------------------------------------------------
// 2. Derived URL — composed once from validated parts.
//    CI/CD injects app-user creds for the runtime step and superuser creds
//    for the migration step. Same env var names, different values per step.
// ---------------------------------------------------------------------------

const databaseUrl = `postgres://${env.APP_DB_USER}:${env.APP_DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.POSTGRES_DB}`;

// ---------------------------------------------------------------------------
// 3. Application configuration — single source of truth.
//
//    Token expiry strings ('15m', '7d', '24h') are consumed by the `jose`
//    library: new SignJWT(payload).setExpirationTime(appConfig.auth.accessTokenExpiry)
//    For cookies, use cookieMaxAge (integer in seconds) instead.
// ---------------------------------------------------------------------------

export const appConfig = {
  app: {
    name: "Agora Auth",
    tagline: "A robust, secure, and modern authentication and user management system.",
    url: env.APP_URL,
    env: env.APP_ENV,
    hostname: env.HOSTNAME,
    port: env.PORT,
  },

  i18n: {
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
  },

  db: {
    url: databaseUrl,
  },

  auth: {
    secret: env.AUTH_SECRET,
    jwtPrivateKey: env.JWT_PRIVATE_KEY,
    jwtPublicKey: env.JWT_PUBLIC_KEY,
    refreshCookieName: "agora_refresh",
    accessCookieName: "agora_access",
    cookieSameSite: "lax",
    accessTokenExpiry: "15m", // jose string — JWT exp claim / access cookie lifespan
    refreshTokenExpiry: "7d", // jose string — DB session claim / refresh cookie lifespan
    verificationTokenExpiry: "24h", // jose string — email verification / password reset
    allowSessionIpChange: true,
    allowSessionAgentChange: true,
  },

  clients: {
    defaultClientId: "agora_web_default",
  },

  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.MAIL_FROM,
  },

  bootstrap: {
    initialAdminEmail: env.INITIAL_ADMIN_EMAIL,
    initialAdminUsername: env.INITIAL_ADMIN_USERNAME,
    initialAdminPassword: env.INITIAL_ADMIN_PASSWORD,
    defaultClientSecret: env.DEFAULT_CLIENT_SECRET,
  },

  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

// ---------------------------------------------------------------------------
// 4. Convenience re-exports for hot paths (middleware, i18n).
// ---------------------------------------------------------------------------

export const locales = appConfig.i18n.locales;
export const defaultLocale = appConfig.i18n.defaultLocale;
