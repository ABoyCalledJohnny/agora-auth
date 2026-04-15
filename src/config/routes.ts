export type NavRoute = {
  /** URL path - must correspond to an existing page.tsx route. */
  href: string;
  /** Key inside the \"Nav\" i18n namespace (messages/en.json \u2192 Nav.*). */
  labelKey: string;
};

/**
 * Desktop navigation links displayed in the header.
 *
 * Auth-related links (login, register, settings, admin, logout) are handled
 * by their own components (header auth button, user menu sheet) and do not
 * belong here. The logo serves as the home link.
 *
 * Every entry must have a matching `src/app/.../page.tsx`.
 */
export const navRoutes: NavRoute[] = [
  { href: "/about", labelKey: "about" },
  { href: "/users", labelKey: "users" },
  { href: "/docs", labelKey: "docs" },
  { href: "/status", labelKey: "status" },
];
