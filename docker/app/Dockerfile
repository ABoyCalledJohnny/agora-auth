# =============================================================================
# Multi-stage Dockerfile — Bun + Next.js standalone build
#
# Stages:
#   1. deps      Install production + dev dependencies (cached layer)
#   2. builder   Build the Next.js standalone bundle
#   3. runner    Minimal production image
#
# Requires next.config.ts → output: "standalone"
# =============================================================================

# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------
FROM oven/bun:1.3.11 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------------------
# 1. Install dependencies
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# 2. Build the application
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# ---------------------------------------------------------------------------
# 3. Production runner
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production

# Copy public assets and the standalone server.
# Files stay owned by root (read-only) — only the cache dir is writable.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# ISR / Data Cache — writable by the runtime user.
RUN mkdir -p .next/cache && chown -R bun:bun .next/cache

# Upload directory — writable by the runtime user.
RUN mkdir -p uploads && chown -R bun:bun uploads

USER bun

EXPOSE 3000

CMD ["bun", "server.js"]
