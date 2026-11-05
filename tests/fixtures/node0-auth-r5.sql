-- Node 0 only: install as the dedicated database owner after the 75 canonical
-- migrations. No seed person, verified email, consent or session is fabricated.
BEGIN;
DO $guard$
BEGIN
  IF current_database() NOT IN ('socdepoble_node0','node0_gauntlet_r4') OR
     to_regclass('node0.schema_migrations') IS NULL OR
     (SELECT count(*) FROM node0.schema_migrations) < 75 OR
     to_regclass('public.consentiments') IS NULL THEN
    RAISE EXCEPTION 'node0_auth_dedicated_database_required';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'node0_auth_privileged_installer_required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='node0_authenticator') THEN
    CREATE ROLE node0_authenticator LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='node0_authenticator' AND
     (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb OR rolreplication OR rolinherit)) THEN
    RAISE EXCEPTION 'node0_authenticator_privileged';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
      JOIN pg_roles member ON member.oid=m.member WHERE member.rolname='node0_authenticator'
      AND (r.rolname NOT IN ('authenticated','anon') OR m.admin_option)) THEN
    RAISE EXCEPTION 'node0_authenticator_memberships_unsafe';
  END IF;
END $guard$;
GRANT authenticated, anon TO node0_authenticator;
GRANT USAGE ON SCHEMA private TO node0_authenticator;

CREATE TABLE IF NOT EXISTS private.node0_credentials (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE CHECK (email=lower(btrim(email)) AND length(email) BETWEEN 3 AND 254),
  salt text NOT NULL CHECK (salt ~ '^[0-9a-f]{32}$'),
  digest text NOT NULL CHECK (digest ~ '^[0-9a-f]{128}$'),
  algorithm text NOT NULL DEFAULT 'scrypt-N131072-r8-p1-k64' CHECK (algorithm='scrypt-N131072-r8-p1-k64'),
  version bigint NOT NULL DEFAULT 1 CHECK (version>0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  changed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS private.node0_sessions (
  id uuid PRIMARY KEY REFERENCES auth.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES private.node0_credentials(user_id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  credential_version bigint NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS node0_sessions_user ON private.node0_sessions(user_id);
CREATE TABLE IF NOT EXISTS private.node0_email_challenges (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid NOT NULL UNIQUE REFERENCES private.node0_credentials(user_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS private.node0_auth_rates (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts>0)
);
ALTER TABLE private.node0_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_credentials FORCE ROW LEVEL SECURITY;
ALTER TABLE private.node0_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE private.node0_email_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_email_challenges FORCE ROW LEVEL SECURITY;
ALTER TABLE private.node0_auth_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_auth_rates FORCE ROW LEVEL SECURITY;
REVOKE ALL ON private.node0_credentials,private.node0_sessions,private.node0_email_challenges,private.node0_auth_rates
  FROM PUBLIC,anon,authenticated,node0_runtime,node0_authenticator;
-- Definer owner is the dedicated privileged installer, not a request role.
-- No table policy is granted to request roles; definer routines are the gates.

CREATE OR REPLACE FUNCTION private.node0_auth_policy() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT jsonb_build_object('privacy',jsonb_build_object('version',p.versio,'url',p.url,'sha256',p.text_sha256),
    'normsVersion',private.versio_normes_vigent()) FROM public.politiques_privacitat p
  WHERE p.versio=private.versio_vigent();
$$;

CREATE OR REPLACE FUNCTION private.node0_auth_rate(p_key text,p_scope text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_count integer; v_limit integer;
BEGIN
  IF p_key !~ '^[0-9a-f]{64}$' OR p_key IS NULL OR p_scope NOT IN ('ip','email') THEN
    RAISE EXCEPTION 'node0_auth_invalid_rate_key';
  END IF;
  v_limit := CASE p_scope WHEN 'ip' THEN 60 ELSE 8 END;
  DELETE FROM private.node0_auth_rates WHERE key_hash IN
    (SELECT key_hash FROM private.node0_auth_rates WHERE window_start<clock_timestamp()-interval '30 minutes' LIMIT 1000);
  IF NOT EXISTS(SELECT 1 FROM private.node0_auth_rates WHERE key_hash=p_key) AND
     (SELECT count(*) FROM private.node0_auth_rates)>=100000 THEN RETURN false; END IF;
  INSERT INTO private.node0_auth_rates(key_hash,window_start,attempts) VALUES(p_key,clock_timestamp(),1)
    ON CONFLICT(key_hash) DO UPDATE SET
      attempts=CASE WHEN node0_auth_rates.window_start<clock_timestamp()-interval '15 minutes' THEN 1 ELSE least(node0_auth_rates.attempts+1,1000) END,
      window_start=CASE WHEN node0_auth_rates.window_start<clock_timestamp()-interval '15 minutes' THEN clock_timestamp() ELSE node0_auth_rates.window_start END
    RETURNING attempts INTO v_count;
  RETURN v_count<=v_limit;
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_credential(p_email text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT jsonb_build_object('user_id',c.user_id,'salt',c.salt,'digest',c.digest,'version',c.version,
    'algorithm',c.algorithm) FROM private.node0_credentials c WHERE c.email=p_email;
$$;

CREATE OR REPLACE FUNCTION private.node0_auth_register(p_email text,p_meta jsonb,p_salt text,p_digest text,p_challenge text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_version text; v_meta jsonb;
BEGIN
  IF p_email IS NULL OR length(p_email)>254 OR p_email<>lower(btrim(p_email)) OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR
     p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{128}$' OR
     p_challenge IS NULL OR p_challenge !~ '^[0-9a-f]{64}$' OR jsonb_typeof(p_meta) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'node0_auth_invalid_registration';
  END IF;
  v_version := private.versio_vigent();
  IF p_meta->'accepta_rgpd' IS DISTINCT FROM 'true'::jsonb OR
     p_meta->>'versio_politica' IS DISTINCT FROM v_version OR v_version IS NULL THEN
    RAISE EXCEPTION 'node0_auth_consent_required';
  END IF;
  IF p_meta->>'tenant_id' IS DISTINCT FROM 'ac3bec76-255b-5ca2-8886-28fcceab4267' OR NOT EXISTS
     (SELECT 1 FROM public.towns WHERE id='ac3bec76-255b-5ca2-8886-28fcceab4267') THEN
    RAISE EXCEPTION 'node0_auth_tenant_invalid';
  END IF;
  -- Neither roles, owner IDs nor verification claims are accepted as metadata.
  v_meta := jsonb_build_object('accepta_rgpd',true,'versio_politica',v_version,
      'tenant_id','ac3bec76-255b-5ca2-8886-28fcceab4267');
  IF length(p_meta->>'full_name') BETWEEN 1 AND 120 THEN v_meta:=v_meta||jsonb_build_object('full_name',p_meta->>'full_name'); END IF;
  IF p_meta->>'username' ~ '^[a-z0-9][a-z0-9_-]{2,39}$' THEN v_meta:=v_meta||jsonb_build_object('username',p_meta->>'username'); END IF;
  IF length(p_meta->>'town_name') BETWEEN 1 AND 120 THEN v_meta:=v_meta||jsonb_build_object('town_name',p_meta->>'town_name'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('node0-auth-email:'||p_email,0));
  IF EXISTS(SELECT 1 FROM auth.users WHERE lower(btrim(email))=p_email) THEN RETURN jsonb_build_object('created',false); END IF;
  v_id:=gen_random_uuid();
  INSERT INTO auth.users(id,email,raw_user_meta_data,email_confirmed_at) VALUES(v_id,p_email,v_meta,NULL);
  INSERT INTO private.node0_credentials(user_id,email,salt,digest) VALUES(v_id,p_email,p_salt,p_digest);
  INSERT INTO private.node0_email_challenges(token_hash,user_id,expires_at) VALUES(p_challenge,v_id,clock_timestamp()+interval '30 minutes');
  -- The canonical trigger must actually persist the explicit acceptance. Its
  -- historical exception handler must not silently turn failure into success.
  IF NOT EXISTS(SELECT 1 FROM public.consentiments WHERE user_id=v_id AND tipus='rgpd_acepta'
      AND versio_politica=v_version AND accio='atorga' AND origen='alta') THEN
    RAISE EXCEPTION 'node0_auth_consent_not_recorded';
  END IF;
  RETURN jsonb_build_object('created',true);
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_challenge(p_email text,p_hash text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'node0_auth_invalid_token'; END IF;
  SELECT c.user_id INTO v_id FROM private.node0_credentials c JOIN auth.users u ON u.id=c.user_id
    WHERE c.email=p_email AND u.email_confirmed_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp()) FOR UPDATE OF c;
  IF v_id IS NULL THEN RETURN false; END IF;
  INSERT INTO private.node0_email_challenges(token_hash,user_id,expires_at) VALUES(p_hash,v_id,clock_timestamp()+interval '30 minutes')
    ON CONFLICT(user_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at,created_at=clock_timestamp();
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_verify(p_hash text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid;
BEGIN
  DELETE FROM private.node0_email_challenges WHERE token_hash=p_hash AND expires_at>clock_timestamp() RETURNING user_id INTO v_id;
  IF v_id IS NULL THEN RETURN false; END IF;
  UPDATE auth.users SET email_confirmed_at=clock_timestamp() WHERE id=v_id AND email_confirmed_at IS NULL
    AND (banned_until IS NULL OR banned_until<=clock_timestamp());
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_create_session(p_user uuid,p_version bigint,p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user auth.users; v_id uuid; v_version bigint;
BEGIN
  IF p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'node0_auth_invalid_token'; END IF;
  SELECT version INTO v_version FROM private.node0_credentials WHERE user_id=p_user FOR UPDATE;
  IF v_version IS DISTINCT FROM p_version THEN RETURN NULL; END IF;
  SELECT * INTO v_user FROM auth.users WHERE id=p_user FOR SHARE;
  IF v_user.id IS NULL OR v_user.email_confirmed_at IS NULL OR v_user.banned_until>clock_timestamp() THEN RETURN NULL; END IF;
  -- Bound live sessions and retain canonical auth.sessions compatibility.
  DELETE FROM auth.sessions WHERE id IN(SELECT id FROM private.node0_sessions WHERE user_id=p_user
    AND (expires_at<=clock_timestamp() OR revoked_at IS NOT NULL));
  IF (SELECT count(*) FROM private.node0_sessions WHERE user_id=p_user)>=10 THEN RETURN NULL; END IF;
  v_id:=gen_random_uuid();
  INSERT INTO auth.sessions(id,user_id) VALUES(v_id,p_user);
  INSERT INTO private.node0_sessions(id,user_id,token_hash,credential_version,expires_at)
    VALUES(v_id,p_user,p_hash,p_version,clock_timestamp()+interval '8 hours');
  RETURN jsonb_build_object('user',jsonb_build_object('id',v_user.id,'email',v_user.email,
    'user_metadata',v_user.raw_user_meta_data,'email_confirmed_at',v_user.email_confirmed_at));
END $$;

-- Called INSIDE the same transaction as a private RPC, before SET LOCAL ROLE.
-- Shared row locks keep logout/password rotation from overtaking an authorized
-- transaction. Revocation wins for every transaction that starts afterwards.
CREATE OR REPLACE FUNCTION private.node0_auth_context(p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user auth.users; v_id uuid; v_session uuid;
BEGIN
  -- Match password rotation's C -> S lock order. A JOIN with row marks on
  -- S,C,U,A can otherwise retain S while waiting for C and deadlock a password
  -- rotation that owns C and needs to delete S. Lock ONLY C in this first query;
  -- the second query rechecks every session condition and locks its token row.
  SELECT c.user_id INTO v_id FROM private.node0_sessions s
    JOIN private.node0_credentials c ON c.user_id=s.user_id
    WHERE s.token_hash=p_hash FOR SHARE OF c;
  IF v_id IS NULL THEN RETURN NULL; END IF;
  SELECT u.id,s.id INTO v_id,v_session FROM private.node0_sessions s
    JOIN private.node0_credentials c ON c.user_id=s.user_id
    JOIN auth.users u ON u.id=c.user_id JOIN auth.sessions a ON a.id=s.id AND a.user_id=u.id
    WHERE s.token_hash=p_hash AND s.expires_at>clock_timestamp() AND s.revoked_at IS NULL
      AND s.credential_version=c.version AND u.email_confirmed_at IS NOT NULL
      AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp()) FOR SHARE OF s,c,u,a;
  IF v_id IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO v_user FROM auth.users WHERE id=v_id;
  RETURN jsonb_build_object('user',jsonb_build_object('id',v_id,'email',v_user.email,
      'user_metadata',v_user.raw_user_meta_data,'email_confirmed_at',v_user.email_confirmed_at),
    'claims',jsonb_build_object('sub',v_id,'role','authenticated','aal','aal1','session_id',v_session));
END $$;

-- R5 removes unbound entry points: old callers must fail, never silently use
-- a cookie belonging to another actor after a cross-tab identity change.
DROP FUNCTION IF EXISTS private.node0_auth_logout(text);
DROP FUNCTION IF EXISTS private.node0_auth_password(text,bigint,text,text);
DROP FUNCTION IF EXISTS private.node0_auth_norms(text,text);

CREATE OR REPLACE FUNCTION private.node0_auth_logout(p_hash text,p_actor uuid) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF p_actor IS NULL THEN RAISE EXCEPTION 'node0_actor_binding_required' USING ERRCODE='N0A02'; END IF;
  -- UPDATE obtains an exclusive row lock against context's FOR SHARE.
  -- Its actor predicate is checked atomically with the mutation. An already
  -- revoked token of the same actor can be cleared idempotently; another
  -- actor's current cookie is never cleared by a stale browser tab.
  UPDATE private.node0_sessions SET revoked_at=coalesce(revoked_at,clock_timestamp()) WHERE token_hash=p_hash AND user_id=p_actor;
  IF NOT FOUND THEN RAISE EXCEPTION 'node0_session_actor_changed' USING ERRCODE='N0A01'; END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_password(p_hash text,p_version bigint,p_salt text,p_digest text,p_actor uuid) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user uuid; v_version bigint;
BEGIN
  IF p_actor IS NULL THEN RAISE EXCEPTION 'node0_actor_binding_required' USING ERRCODE='N0A02'; END IF;
  IF p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{128}$' THEN
    RAISE EXCEPTION 'node0_auth_invalid_credential';
  END IF;
  -- Lock credential first, then revalidate the session in this transaction.
  SELECT c.user_id,c.version INTO v_user,v_version FROM private.node0_credentials c
    JOIN private.node0_sessions s ON s.user_id=c.user_id WHERE s.token_hash=p_hash FOR UPDATE OF c;
  IF v_user IS NOT NULL AND v_user IS DISTINCT FROM p_actor THEN
    RAISE EXCEPTION 'node0_session_actor_changed' USING ERRCODE='N0A01';
  END IF;
  IF v_user IS NULL OR v_version IS DISTINCT FROM p_version OR private.node0_auth_context(p_hash) IS NULL THEN RETURN false; END IF;
  UPDATE private.node0_credentials SET salt=p_salt,digest=p_digest,version=version+1,changed_at=clock_timestamp() WHERE user_id=v_user;
  DELETE FROM auth.sessions WHERE user_id=v_user;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_norms(p_hash text,p_version text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_context jsonb;
BEGIN
  IF p_actor IS NULL THEN RAISE EXCEPTION 'node0_actor_binding_required' USING ERRCODE='N0A02'; END IF;
  v_context:=private.node0_auth_context(p_hash);
  IF v_context IS NULL THEN RETURN NULL; END IF;
  IF (v_context->'user'->>'id')::uuid IS DISTINCT FROM p_actor THEN
    RAISE EXCEPTION 'node0_session_actor_changed' USING ERRCODE='N0A01';
  END IF;
  IF p_version IS DISTINCT FROM private.versio_normes_vigent() THEN RAISE EXCEPTION 'node0_auth_norms_version_invalid'; END IF;
  PERFORM set_config('request.jwt.claim.sub',v_context->'user'->>'id',true);
  RETURN public.accepta_normes_convivencia(p_version);
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_norms_state(p_hash text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_context jsonb;
BEGIN
  IF p_actor IS NULL THEN RAISE EXCEPTION 'node0_actor_binding_required' USING ERRCODE='N0A02'; END IF;
  v_context:=private.node0_auth_context(p_hash);
  IF v_context IS NULL THEN RETURN NULL; END IF;
  IF (v_context->'user'->>'id')::uuid IS DISTINCT FROM p_actor THEN
    RAISE EXCEPTION 'node0_session_actor_changed' USING ERRCODE='N0A01';
  END IF;
  PERFORM set_config('request.jwt.claim.sub',v_context->'user'->>'id',true);
  -- Only the definer reads the actual server version; authenticated receives
  -- no EXECUTE grant on the private version function and supplies no version.
  RETURN public.estat_normes_convivencia(private.versio_normes_vigent());
END $$;

REVOKE ALL ON FUNCTION private.node0_auth_policy(),private.node0_auth_rate(text,text),private.node0_auth_credential(text),
  private.node0_auth_register(text,jsonb,text,text,text),private.node0_auth_challenge(text,text),private.node0_auth_verify(text),
  private.node0_auth_create_session(uuid,bigint,text),private.node0_auth_context(text),private.node0_auth_logout(text,uuid),
  private.node0_auth_password(text,bigint,text,text,uuid),private.node0_auth_norms(text,text,uuid),private.node0_auth_norms_state(text,uuid)
  FROM PUBLIC,anon,authenticated,node0_runtime;
GRANT EXECUTE ON FUNCTION private.node0_auth_policy(),private.node0_auth_rate(text,text),private.node0_auth_credential(text),
  private.node0_auth_register(text,jsonb,text,text,text),private.node0_auth_challenge(text,text),private.node0_auth_verify(text),
  private.node0_auth_create_session(uuid,bigint,text),private.node0_auth_context(text),private.node0_auth_logout(text,uuid),
  private.node0_auth_password(text,bigint,text,text,uuid),private.node0_auth_norms(text,text,uuid),private.node0_auth_norms_state(text,uuid) TO node0_authenticator;
COMMIT;
