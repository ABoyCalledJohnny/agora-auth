# =============================================================================
# VPS Operations — convenience targets for production container management.
#
# Usage:  make <target>
# =============================================================================

COMPOSE := docker compose -f compose.yaml -f compose.production.yaml
CADDY   := docker compose -p caddy -f compose.caddy.yaml

# --- Logs ---

logs-app:
	$(COMPOSE) logs -f app

logs-postgres:
	$(COMPOSE) logs -f postgres

logs-caddy:
	$(CADDY) logs -f caddy

logs-migrator:
	$(COMPOSE) logs migrator
