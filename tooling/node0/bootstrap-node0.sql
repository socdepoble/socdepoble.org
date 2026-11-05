-- Node 0 local compatibility only. NOT GoTrue, Storage service or Realtime delivery.
-- Run as a database owner on a dedicated database, never on the shared Supabase.
DO $guard$
BEGIN
  IF to_regclass('node0.schema_migrations') IS NULL AND
     (to_regclass('auth.users') IS NOT NULL OR to_regclass('public.towns') IS NOT NULL) THEN
    RAISE EXCEPTION 'node0_refuse_existing_non_node0_database';
  END IF;
END $guard$;
CREATE SCHEMA IF NOT EXISTS node0;
REVOKE ALL ON SCHEMA node0 FROM PUBLIC;
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='node0_runtime') THEN
    CREATE ROLE node0_runtime LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='node0_runtime' AND
     (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb OR rolreplication)) THEN
    RAISE EXCEPTION 'node0_runtime_privileged';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='node0_runtime') THEN
    RAISE EXCEPTION 'node0_runtime_has_role_memberships';
  END IF;
END $roles$;
CREATE TABLE IF NOT EXISTS node0.schema_migrations(
  version text PRIMARY KEY CHECK (version ~ '^[0-9]{10}$'),
  file text NOT NULL UNIQUE,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS node0.public_documents(
  kind text NOT NULL CHECK (kind IN ('towns','pages','agents','feedPosts','events','marketItems','mediaItems')),
  id text NOT NULL CHECK (length(id) BETWEEN 1 AND 2048),
  document jsonb NOT NULL CHECK (jsonb_typeof(document)='object'),
  source_uri text UNIQUE,
  PRIMARY KEY(kind,id)
);
REVOKE ALL ON ALL TABLES IN SCHEMA node0 FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA node0 TO node0_runtime;
GRANT SELECT ON node0.schema_migrations TO node0_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON node0.public_documents TO node0_runtime;

-- Només substituts de la infraestructura auth/rols de Supabase; cap taula
-- d'organitzacions o de pertinences es redefineix en esta fixture.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb NOT NULL DEFAULT '{}');
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;
CREATE TABLE IF NOT EXISTS auth.sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS banned_until timestamptz;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE IF NOT EXISTS storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text REFERENCES storage.buckets(id),name text,owner uuid,owner_id text,metadata jsonb,version text,created_at timestamptz DEFAULT now(),UNIQUE(bucket_id,name));
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
CREATE OR REPLACE FUNCTION storage.operation() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('storage.operation',true)$$;
GRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE TABLE IF NOT EXISTS realtime.messages(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,extension text,topic text,payload jsonb);
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('realtime.topic',true)$$;
-- No emissor de xarxa: els avisos de Realtime són infraestructura fora de l'assaig.
