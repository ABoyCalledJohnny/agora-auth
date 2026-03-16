// App routes / Route templates
export const DEFAULT_VERIFY_EMAIL_PATH = "/verify-email/{token}";
export const DEFAULT_RESET_PASSWORD_PATH = "/reset-password/{token}";

// Internationalization
export const LOCALES = ["en", "de"] as const;
export const DEFAULT_LOCALE = "en" as const;

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

// Letters-only public IDs need slightly more length than base36 to keep similar entropy.
export const PUBLIC_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
export const PUBLIC_ID_LENGTH = 27;

// Block reserved words for usernames to avoid impersonation and route conflicts.
export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "support",
  "root",
  "system",
  "help",
  "info",
  "contact",
  "webmaster",
  "test",
  "dev",
  "billing",
  "sales",
  "security",
  "administrator",
  "hilfe",
  "kontakt",
  "team",
  "impressum",
  "datenschutz",
  "rechtliches",
  "service",
  "presse",
  "jobs",
  "karriere",
  "bewerbung",
  "rechnung",
  "pay",
  "zahlungen",
] as const;
