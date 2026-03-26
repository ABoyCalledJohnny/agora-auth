# =============================================================================
# Single-stage Dockerfile — Bun Migrator
#
# Stages:
#   1. runner    Minimal environment to execute TypeScript database tasks
#
# Requires: Drizzle ORM, Drizzle Kit, and TS files.
# =============================================================================

# ---------------------------------------------------------------------------
# Base & Runner
# ---------------------------------------------------------------------------
FROM oven/bun:1.3.11 AS runner
WORKDIR /app

# 1. Install dependencies
COPY package.json bun.lock ./
# Note: drizzle-kit is usually a devDependency. If you pruned to --production, 
# you might need to ensure drizzle-kit is available, or omit --production.
RUN bun install --frozen-lockfile

# 2. Copy the necessary modules for the database layer
COPY tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src/config ./src/config
COPY src/lib ./src/lib
COPY src/db ./src/db
COPY src/repositories ./src/repositories
COPY src/features/auth/contracts.ts ./src/features/auth/contracts.ts

# 3. Execute migrations and bootstrap scripts
CMD ["sh", "-c", "bunx drizzle-kit migrate && bun src/db/bootstrap.ts"]
