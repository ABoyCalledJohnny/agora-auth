#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	-- 1. Create the app user
	CREATE USER $APP_DB_USER WITH PASSWORD '$APP_DB_PASSWORD';
	
	-- DB is already created by POSTGRES_DB env var. We are already connected to it via psql arguments.
	
	-- 3. Now these commands apply to the database specifically:
	GRANT CONNECT ON DATABASE $POSTGRES_DB TO $APP_DB_USER;
	
	GRANT USAGE ON SCHEMA public TO $APP_DB_USER;
	
	-- 4. Initial Permissions (For anything that already exists)
	GRANT SELECT, INSERT, UPDATE, DELETE 
	    ON ALL TABLES IN SCHEMA public 
	    TO $APP_DB_USER;
	
	GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public 
	    TO $APP_DB_USER;
	
	-- 5. Future Permissions (The "Magic Glue")
	-- This tells Postgres: "When *I* (the Superuser) create a table in the future,
	-- automatically give myapp_user access to it."
	ALTER DEFAULT PRIVILEGES IN SCHEMA public
	    GRANT SELECT, INSERT, UPDATE, DELETE 
	    ON TABLES TO $APP_DB_USER;
	
	ALTER DEFAULT PRIVILEGES IN SCHEMA public
	    GRANT USAGE, SELECT ON SEQUENCES 
	    TO $APP_DB_USER;
EOSQL
