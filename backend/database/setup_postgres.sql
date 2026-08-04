-- ============================================================================
-- GET Solar Energy
-- PostgreSQL Development Setup Script
--
-- Run as a PostgreSQL superuser (e.g. postgres)
--
-- Usage:
-- psql -U postgres -f backend/database/setup_postgres.sql
--
-- IMPORTANT:
-- Replace APP_USER and APP_PASSWORD below before running.
-- This script is safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- CONFIGURATION
-- ============================================================================

-- Change these values before running
-- Example:
-- APP_USER = mhhaq
-- APP_PASSWORD = YourPassword123

-- ============================================================================
-- CREATE APPLICATION USER
-- ============================================================================

DO
$$
BEGIN
    IF NOT EXISTS (
        SELECT
        FROM pg_roles
        WHERE rolname = 'APP_USER'
    ) THEN

        EXECUTE format(
            'CREATE ROLE %I LOGIN PASSWORD %L CREATEDB',
            'APP_USER',
            'APP_PASSWORD'
        );

    END IF;
END
$$;

-- ============================================================================
-- CREATE DATABASE
-- ============================================================================

SELECT format(
    'CREATE DATABASE get_solar_energy OWNER %I',
    'APP_USER'
)
WHERE NOT EXISTS (
    SELECT
    FROM pg_database
    WHERE datname = 'get_solar_energy'
)
\gexec

-- ============================================================================
-- CONNECT TO DATABASE
-- ============================================================================

\connect get_solar_energy

-- ============================================================================
-- ENABLE COMMON EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- DATABASE OWNERSHIP
-- ============================================================================

ALTER DATABASE get_solar_energy OWNER TO APP_USER;
ALTER SCHEMA public OWNER TO APP_USER;

GRANT ALL PRIVILEGES ON DATABASE get_solar_energy TO APP_USER;
GRANT ALL ON SCHEMA public TO APP_USER;
GRANT USAGE, CREATE ON SCHEMA public TO APP_USER;

-- ============================================================================
-- TRANSFER EXISTING TABLE OWNERSHIP
-- ============================================================================

DO
$$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I OWNER TO APP_USER;',
            r.tablename
        );
    END LOOP;
END
$$;

-- ============================================================================
-- TRANSFER SEQUENCE OWNERSHIP
-- ============================================================================

DO
$$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT sequencename
        FROM pg_sequences
        WHERE schemaname='public'
    LOOP
        EXECUTE format(
            'ALTER SEQUENCE public.%I OWNER TO APP_USER;',
            r.sequencename
        );
    END LOOP;
END
$$;

-- ============================================================================
-- DEFAULT PRIVILEGES
-- ============================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO APP_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO APP_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO APP_USER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    current_database() AS database_name,
    current_user AS connected_user;

SELECT
    datname,
    pg_catalog.pg_get_userbyid(datdba) AS database_owner
FROM pg_database
WHERE datname='get_solar_energy';

SELECT
    nspname,
    nspowner::regrole AS schema_owner
FROM pg_namespace
WHERE nspname='public';

SELECT
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname='public'
ORDER BY tablename;

\echo
\echo =====================================================
\echo GET Solar Energy PostgreSQL setup completed.
\echo
\echo Database : get_solar_energy
\echo
\echo Update backend/.env
\echo DATABASE_URL=postgresql://APP_USER:APP_PASSWORD@localhost:5432/get_solar_energy
\echo
\echo =====================================================