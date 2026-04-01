import type { SystemRoleName } from "./constants.ts";

/**
 * Visibility determines who can see a navigation link:
 * - "public"  → everyone (logged-in or not)
 * - "guest"   → only unauthenticated visitors
 * - "auth"    → any authenticated user
 * - "admin"   → authenticated users with the "admin" role
 */
type NavVisibility = "public" | "guest" | "auth" | SystemRoleName;

export interface NavRoute {
  /** URL path — must correspond to an existing page.tsx route. */
  href: string;
  /** Key inside the "Nav" i18n namespace (messages/en.json → Nav.*). */
  labelKey: string;
  /** Who should see this link. */
  visibility: NavVisibility;
}

/**
 * Central navigation link registry.
 *
 * Every entry must have a matching `src/app/.../page.tsx`.
 * `nav.tsx` maps over this array; update here to add/remove links.
 */
export const navRoutes: NavRoute[] = [
  // ── Public (always visible) ──────────────────────────────────────────
  { href: "/", labelKey: "home", visibility: "public" },
  { href: "/docs", labelKey: "docs", visibility: "public" },
  { href: "/about", labelKey: "about", visibility: "public" },
  { href: "/status", labelKey: "status", visibility: "public" },

  // ── Guest only (unauthenticated) ─────────────────────────────────────
  { href: "/login", labelKey: "login", visibility: "guest" },
  { href: "/register", labelKey: "register", visibility: "guest" },

  // ── Authenticated ────────────────────────────────────────────────────
  { href: "/settings", labelKey: "settings", visibility: "auth" },

  // ── Admin ────────────────────────────────────────────────────────────
  { href: "/admin", labelKey: "admin", visibility: "admin" },
];
