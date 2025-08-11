-- Create schema for public API views
CREATE SCHEMA IF NOT EXISTS public_api;

-- Role that can read public_api views only
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'opl_public_reader') THEN
      CREATE ROLE opl_public_reader NOINHERIT;
   END IF;
END$$;
