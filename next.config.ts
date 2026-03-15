import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy (CSP)
 *
 * ⚠️ IMPORTANT REALITY CHECK
 * --------------------------
 * Next.js (even in production) injects inline scripts for hydration.
 * Libraries like `next-themes` and UI toolkits also rely on inline scripts/styles.
 *
 * Because this is a BOILERPLATE, we intentionally allow:
 * - 'unsafe-inline'
 * - 'unsafe-eval'
 *
 * This gives ~90% CSP protection without breaking apps.
 * Teams that want stricter CSP must implement a nonce-based solution via Middleware.
 */
const csp = `
  default-src 'self';

  /* Required for Next.js hydration & common UI libraries */
  script-src 'self' 'unsafe-inline' 'unsafe-eval';

  /* Required for CSS-in-JS, Tailwind runtime styles, toast libraries, etc. */
  style-src 'self' 'unsafe-inline';

  /* Images via <Image>, data URLs, and blobs (e.g. avatars, uploads) */
  img-src 'self' data: blob:;

  /* Fonts served locally */
  font-src 'self';

  /* Completely disable legacy plugins (Flash, etc.) */
  object-src 'none';

  /* Prevent <base> tag abuse */
  base-uri 'self';

  /* Prevent form submissions to other origins */
  form-action 'self';

  /* Prevent clickjacking entirely */
  frame-ancestors 'none';

  /* Force HTTPS links in production only */
  ${isProd ? "upgrade-insecure-requests;" : ""}
`;

/**
 * Centralized security headers
 *
 * This mirrors Helmet defaults where sensible,
 * tightens them where modern browsers allow,
 * and avoids headers that cause real-world breakage.
 */
const securityHeaders = [
  /**
   * Prevent MIME type sniffing.
   * Stops browsers from interpreting files as something else.
   */
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  /**
   * Control how much referrer information is sent.
   * This is the modern default used by most major sites.
   */
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  /**
   * Prevent clickjacking entirely.
   * DENY is stricter than SAMEORIGIN and safe for most apps.
   */
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  /**
   * Lock down powerful browser APIs.
   * Principle of least privilege.
   */
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },

  /**
   * Disable speculative DNS prefetching for privacy.
   */
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },

  /**
   * Legacy IE header.
   * Harmless, still included by Helmet.
   */
  {
    key: "X-Download-Options",
    value: "noopen",
  },

  /**
   * Prevent Adobe Flash / PDF cross-domain data leaks.
   */
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },

  /**
   * Content Security Policy
   */
  {
    key: "Content-Security-Policy",
    value: csp
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s{2,}/g, " ")
      .trim(),
  },

  /**
   * HTTP Strict Transport Security (HSTS)
   *
   * Only enabled in production.
   * ❗ No `preload` — that is a permanent, domain-level decision.
   */
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  /**
   * Emit a standalone build (server.js + node_modules subset).
   * Required for the Docker production image.
   */
  output: "standalone",

  /**
   * Removes the `X-Powered-By: Next.js` header.
   * Security-through-obscurity? Mostly.
   * Noise reduction? Absolutely.
   */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
