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

-- R6: legacy unbound challenges are invalidated, never retroactively trusted.
ALTER TABLE private.node0_credentials ADD COLUMN IF NOT EXISTS pending_until timestamptz;
UPDATE private.node0_credentials SET pending_until=created_at+interval '24 hours' WHERE pending_until IS NULL;
ALTER TABLE private.node0_credentials ALTER COLUMN pending_until SET NOT NULL;
ALTER TABLE private.node0_credentials ALTER COLUMN pending_until SET DEFAULT (clock_timestamp()+interval '24 hours');
CREATE INDEX IF NOT EXISTS node0_credentials_pending_until ON private.node0_credentials(pending_until,user_id);
ALTER TABLE private.node0_email_challenges ADD COLUMN IF NOT EXISTS credential_version bigint;
ALTER TABLE private.node0_email_challenges ADD COLUMN IF NOT EXISTS purpose text;
ALTER TABLE private.node0_email_challenges ADD COLUMN IF NOT EXISTS consent_version text;
DELETE FROM private.node0_email_challenges WHERE credential_version IS NULL OR purpose IS NULL;
ALTER TABLE private.node0_email_challenges ALTER COLUMN credential_version SET NOT NULL;
ALTER TABLE private.node0_email_challenges ALTER COLUMN purpose SET NOT NULL;
DO $r6$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='private.node0_email_challenges'::regclass AND conname='node0_challenge_version_positive') THEN
  ALTER TABLE private.node0_email_challenges ADD CONSTRAINT node0_challenge_version_positive CHECK(credential_version>0);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='private.node0_email_challenges'::regclass AND conname='node0_challenge_purpose_valid') THEN
  ALTER TABLE private.node0_email_challenges ADD CONSTRAINT node0_challenge_purpose_valid CHECK(purpose IN ('verify','reset'));
 END IF;
END $r6$;

CREATE TABLE IF NOT EXISTS private.node0_auth_rates (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts>0)
);
-- Only an active ban survives deletion of an expired unverified account.
-- No plain email, profile, metadata or indefinite identity retention.
CREATE TABLE IF NOT EXISTS private.node0_pending_bans (
  email_hash text PRIMARY KEY CHECK (email_hash ~ '^[0-9a-f]{64}$'),
  banned_until timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS node0_pending_bans_expiry ON private.node0_pending_bans(banned_until,email_hash);
ALTER TABLE private.node0_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_credentials FORCE ROW LEVEL SECURITY;
ALTER TABLE private.node0_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE private.node0_email_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_email_challenges FORCE ROW LEVEL SECURITY;
ALTER TABLE private.node0_auth_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_auth_rates FORCE ROW LEVEL SECURITY;
ALTER TABLE private.node0_pending_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.node0_pending_bans FORCE ROW LEVEL SECURITY;
REVOKE ALL ON private.node0_credentials,private.node0_sessions,private.node0_email_challenges,private.node0_auth_rates,private.node0_pending_bans
  FROM PUBLIC,anon,authenticated,node0_runtime,node0_authenticator;
-- Definer owner is the dedicated privileged installer, not a request role.
-- No table policy is granted to request roles; definer routines are the gates.

CREATE OR REPLACE FUNCTION private.node0_auth_policy() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT jsonb_build_object('privacy',jsonb_build_object('version',p.versio,'url',p.url,'sha256',p.text_sha256),
    'normsVersion',private.versio_normes_vigent()) FROM public.politiques_privacitat p
  WHERE p.versio=private.versio_vigent();
$$;

-- R6 LAB ONLY. Replaces exactly one existing function; no table, grant, role,
-- registration, credential or session mutation is changed by this patch.
CREATE OR REPLACE FUNCTION private.node0_auth_rate(p_key text,p_scope text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_count integer; v_limit integer; v_bucket text; v_context jsonb;
  v_now timestamptz:=clock_timestamp();
BEGIN
  IF p_key IS NULL OR p_key !~ '^[0-9a-f]{64}$' OR p_scope IS NULL THEN
    RAISE EXCEPTION 'node0_auth_invalid_rate_key';
  END IF;
  IF p_scope='ip' THEN
    v_limit:=60;v_bucket:='00'||substr(p_key,1,3)||repeat('0',59);
  ELSIF p_scope='email' THEN
    v_limit:=8;v_bucket:='01'||substr(p_key,1,3)||repeat('0',59);
  ELSIF p_scope ~ '^session-password:[0-9a-f]{64}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_context:=private.node0_auth_context(split_part(p_scope,':',2));
    IF v_context IS NULL OR v_context->'user'->>'id' IS DISTINCT FROM split_part(p_scope,':',3) THEN
      RAISE EXCEPTION USING ERRCODE='N0A01',MESSAGE='session_actor_changed';
    END IF;
    -- A full stable actor identity: rotating session/IP/key cannot create more
    -- actor quota rows. Anonymous flood never shares this namespace.
    v_limit:=8;v_bucket:='10'||substr(encode(sha256(convert_to('node0-auth-password:'||(v_context->'user'->>'id'),'UTF8')),'hex'),1,62);
  ELSE
    RAISE EXCEPTION 'node0_auth_invalid_rate_scope';
  END IF;
  -- 4096 fixed IP buckets +4096 fixed email buckets, plus <=1 row/actor ever
  -- using password. No global admission count, eviction or reset of active
  -- buckets. Collisions are conservative, so they cannot grant extra attempts.
  -- Existing R5 rows are retained: changing algorithms must not erase evidence
  -- or pretend this function retroactively enforces a different network quota.
  INSERT INTO private.node0_auth_rates(key_hash,window_start,attempts) VALUES(v_bucket,v_now,1)
    ON CONFLICT(key_hash) DO UPDATE SET
      attempts=CASE WHEN node0_auth_rates.window_start<v_now-interval '15 minutes' THEN 1 ELSE least(node0_auth_rates.attempts+1,1000) END,
      window_start=CASE WHEN node0_auth_rates.window_start<v_now-interval '15 minutes' THEN v_now ELSE node0_auth_rates.window_start END
    RETURNING attempts INTO v_count;
  RETURN v_count<=v_limit;
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_credential(p_email text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT jsonb_build_object('user_id',c.user_id,'salt',c.salt,'digest',c.digest,'version',c.version,
    'algorithm',c.algorithm) FROM private.node0_credentials c WHERE c.email=p_email;
$$;

CREATE OR REPLACE FUNCTION private.node0_auth_purge_pending(p_email text DEFAULT NULL) RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_pending record; v_banned timestamptz; v_confirmed timestamptz; v_count integer:=0;
  v_now timestamptz:=clock_timestamp();
BEGIN
  -- Bounded retention of local accounts that never proved their email. Canonical
  -- auth.users cascades retain immutable consent evidence via its own trigger.
  FOR v_pending IN SELECT c.user_id,c.email,c.created_at FROM private.node0_credentials c JOIN auth.users u ON u.id=c.user_id
    WHERE u.email_confirmed_at IS NULL AND c.pending_until<=v_now
      AND (u.banned_until IS NULL OR u.banned_until<=v_now OR c.created_at<=v_now-interval '48 hours')
      AND (p_email IS NULL OR c.email=p_email)
    ORDER BY c.pending_until,c.user_id LIMIT 100 FOR UPDATE OF c SKIP LOCKED
  LOOP
    -- Registration takes this email lock before its C lock. Never wait for it
    -- while sweeping C rows: skip a live registrar and avoid lock-order cycles.
    IF NOT pg_try_advisory_xact_lock(hashtextextended('node0-auth-email:'||v_pending.email,0)) THEN CONTINUE; END IF;
    -- Recheck under the same C -> U lock order as first proof. A concurrent
    -- confirmation wins by preventing deletion; a ban survives as a digest.
    SELECT email_confirmed_at,banned_until INTO v_confirmed,v_banned FROM auth.users WHERE id=v_pending.user_id FOR UPDATE;
    IF NOT FOUND OR v_confirmed IS NOT NULL THEN CONTINUE; END IF;
    IF v_banned>v_now THEN
      IF v_pending.created_at>v_now-interval '48 hours' THEN CONTINUE; END IF;
      INSERT INTO private.node0_pending_bans(email_hash,banned_until)
        VALUES(encode(sha256(convert_to(v_pending.email,'UTF8')),'hex'),v_banned)
        ON CONFLICT(email_hash) DO UPDATE SET banned_until=greatest(node0_pending_bans.banned_until,EXCLUDED.banned_until);
    END IF;
    DELETE FROM auth.users WHERE id=v_pending.user_id AND email_confirmed_at IS NULL;
    IF FOUND THEN v_count:=v_count+1; END IF;
  END LOOP;
  RETURN v_count;
END $$;

-- Scheduler entry point: a bounded batch, no caller-selected identity/cutoff.
-- Direct purge stays installer-only. Overlapping timer ticks skip, never wait.
CREATE OR REPLACE FUNCTION private.node0_auth_sweep_pending() RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtextextended('node0-auth-pending-sweep',0)) THEN RETURN 0; END IF;
  DELETE FROM private.node0_pending_bans WHERE email_hash IN (
    SELECT email_hash FROM private.node0_pending_bans WHERE banned_until<=clock_timestamp() ORDER BY banned_until,email_hash LIMIT 100 FOR UPDATE SKIP LOCKED);
  RETURN private.node0_auth_purge_pending(NULL);
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_register(p_email text,p_meta jsonb,p_salt text,p_digest text,p_challenge text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_version text; v_meta jsonb; v_credential bigint; v_confirmed timestamptz; v_banned timestamptz;
BEGIN
  IF p_email IS NULL OR length(p_email)>254 OR p_email<>lower(btrim(p_email)) OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR
     p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{128}$' OR
     p_challenge IS NULL OR p_challenge !~ '^[0-9a-f]{64}$' OR jsonb_typeof(p_meta) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'node0_auth_invalid_registration';
  END IF;
  v_version:=private.versio_vigent();
  IF p_meta->'accepta_rgpd' IS DISTINCT FROM 'true'::jsonb OR p_meta->>'versio_politica' IS DISTINCT FROM v_version OR v_version IS NULL THEN
    RAISE EXCEPTION 'node0_auth_consent_required';
  END IF;
  IF p_meta->>'tenant_id' IS DISTINCT FROM 'ac3bec76-255b-5ca2-8886-28fcceab4267' OR NOT EXISTS
    (SELECT 1 FROM public.towns WHERE id='ac3bec76-255b-5ca2-8886-28fcceab4267') THEN RAISE EXCEPTION 'node0_auth_tenant_invalid'; END IF;
  -- Before proof this is a pending request, not the email owner's consent.
  v_meta:=jsonb_build_object('accepta_rgpd',false,'versio_politica',v_version,'tenant_id','ac3bec76-255b-5ca2-8886-28fcceab4267');
  -- Pending requests never choose the email owner's profile attributes.
  PERFORM pg_advisory_xact_lock(hashtextextended('node0-auth-email:'||p_email,0));
  -- Within registration only this serialized email is collected. A separate
  -- operator maintenance transaction can collect100 unrelated expired rows;
  -- retaining their locks while registering another email would invite cycles.
  PERFORM private.node0_auth_purge_pending(p_email);
  IF EXISTS(SELECT 1 FROM private.node0_pending_bans WHERE email_hash=encode(sha256(convert_to(p_email,'UTF8')),'hex') AND banned_until>clock_timestamp()) THEN
    RETURN jsonb_build_object('created',false);
  END IF;
  SELECT c.user_id,c.version INTO v_id,v_credential FROM private.node0_credentials c WHERE c.email=p_email FOR UPDATE;
  IF v_id IS NOT NULL THEN
    SELECT email_confirmed_at,banned_until INTO v_confirmed,v_banned FROM auth.users WHERE id=v_id FOR UPDATE;
    IF v_confirmed IS NOT NULL OR v_banned>clock_timestamp() THEN RETURN jsonb_build_object('created',false); END IF;
    UPDATE private.node0_credentials SET salt=p_salt,digest=p_digest,version=version+1,changed_at=clock_timestamp()
      WHERE user_id=v_id RETURNING version INTO v_credential;
    UPDATE auth.users SET raw_user_meta_data=v_meta WHERE id=v_id;
    DELETE FROM auth.sessions WHERE user_id=v_id;
  ELSE
    IF EXISTS(SELECT 1 FROM auth.users WHERE lower(btrim(email))=p_email) THEN RETURN jsonb_build_object('created',false); END IF;
    v_id:=gen_random_uuid();v_credential:=1;
    INSERT INTO auth.users(id,email,raw_user_meta_data,email_confirmed_at) VALUES(v_id,p_email,v_meta,NULL);
    INSERT INTO private.node0_credentials(user_id,email,salt,digest,pending_until)
      VALUES(v_id,p_email,p_salt,p_digest,clock_timestamp()+interval '24 hours');
  END IF;
  INSERT INTO private.node0_email_challenges(token_hash,user_id,credential_version,purpose,consent_version,expires_at)
    VALUES(p_challenge,v_id,v_credential,'verify',v_version,clock_timestamp()+interval '30 minutes')
    ON CONFLICT(user_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,credential_version=EXCLUDED.credential_version,
      purpose=EXCLUDED.purpose,consent_version=EXCLUDED.consent_version,expires_at=EXCLUDED.expires_at,created_at=clock_timestamp();
  RETURN jsonb_build_object('created',true);
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_challenge(p_email text,p_hash text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_version bigint; v_until timestamptz; v_confirmed timestamptz; v_banned timestamptz; v_consent text;
BEGIN
  IF p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'node0_auth_invalid_token'; END IF;
  SELECT user_id,version,pending_until INTO v_id,v_version,v_until FROM private.node0_credentials WHERE email=p_email FOR UPDATE;
  IF v_id IS NULL OR v_until<=clock_timestamp() THEN RETURN false; END IF;
  SELECT email_confirmed_at,banned_until,raw_user_meta_data->>'versio_politica' INTO v_confirmed,v_banned,v_consent FROM auth.users WHERE id=v_id FOR SHARE;
  IF v_confirmed IS NOT NULL OR v_banned>clock_timestamp() THEN RETURN false; END IF;
  INSERT INTO private.node0_email_challenges(token_hash,user_id,credential_version,purpose,consent_version,expires_at)
    VALUES(p_hash,v_id,v_version,'verify',v_consent,clock_timestamp()+interval '30 minutes')
    ON CONFLICT(user_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,credential_version=EXCLUDED.credential_version,
      purpose=EXCLUDED.purpose,consent_version=EXCLUDED.consent_version,expires_at=EXCLUDED.expires_at,created_at=clock_timestamp();
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION private.node0_auth_reset_challenge(p_email text,p_hash text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_version bigint; v_until timestamptz; v_confirmed timestamptz; v_banned timestamptz; v_consent text;
BEGIN
  IF p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'node0_auth_invalid_token'; END IF;
  SELECT user_id,version,pending_until INTO v_id,v_version,v_until FROM private.node0_credentials WHERE email=p_email FOR UPDATE;
  IF v_id IS NULL THEN RETURN false; END IF;
  SELECT email_confirmed_at,banned_until,raw_user_meta_data->>'versio_politica' INTO v_confirmed,v_banned,v_consent FROM auth.users WHERE id=v_id FOR SHARE;
  IF v_banned>clock_timestamp() OR v_confirmed IS NULL AND v_until<=clock_timestamp() THEN RETURN false; END IF;
  INSERT INTO private.node0_email_challenges(token_hash,user_id,credential_version,purpose,consent_version,expires_at)
    VALUES(p_hash,v_id,v_version,'reset',CASE WHEN v_confirmed IS NULL THEN v_consent ELSE NULL END,clock_timestamp()+interval '30 minutes')
    ON CONFLICT(user_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,credential_version=EXCLUDED.credential_version,
      purpose=EXCLUDED.purpose,consent_version=EXCLUDED.consent_version,expires_at=EXCLUDED.expires_at,created_at=clock_timestamp();
  RETURN true;
END $$;

-- The primary-key token_hash lookup is deliberately before any password KDF.
-- No credential/profile value is returned. This is a hint only: finish_email
-- performs the same checks again while holding C -> U -> challenge locks.
CREATE OR REPLACE FUNCTION private.node0_auth_challenge_ready(p_hash text,p_purpose text) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path='' AS $$
  SELECT p_hash ~ '^[0-9a-f]{64}$' AND p_purpose IN ('verify','reset') AND EXISTS (
    SELECT 1 FROM private.node0_email_challenges e
      JOIN private.node0_credentials c ON c.user_id=e.user_id
      JOIN auth.users u ON u.id=c.user_id
    WHERE e.token_hash=p_hash AND e.purpose=p_purpose AND e.credential_version=c.version
      AND e.expires_at>clock_timestamp() AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp())
      AND NOT EXISTS(SELECT 1 FROM private.node0_pending_bans b WHERE b.email_hash=encode(sha256(convert_to(c.email,'UTF8')),'hex') AND b.banned_until>clock_timestamp())
      AND (u.email_confirmed_at IS NOT NULL OR c.pending_until>clock_timestamp())
      AND (p_purpose<>'verify' OR u.email_confirmed_at IS NULL));
$$;

CREATE OR REPLACE FUNCTION private.node0_auth_finish_email(p_hash text,p_purpose text,p_salt text,p_digest text,p_consent text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_email text; v_credential bigint; v_until timestamptz; v_confirmed timestamptz; v_banned timestamptz; v_challenge private.node0_email_challenges;
BEGIN
  IF p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' OR p_purpose IS NULL OR p_purpose NOT IN ('verify','reset') OR
    p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{128}$' THEN RETURN false; END IF;
  SELECT user_id INTO v_id FROM private.node0_email_challenges WHERE token_hash=p_hash;
  IF v_id IS NULL THEN RETURN false; END IF;
  -- C -> U -> challenge matches register/password; initial lookup holds no lock.
  SELECT email,version,pending_until INTO v_email,v_credential,v_until FROM private.node0_credentials WHERE user_id=v_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT email_confirmed_at,banned_until INTO v_confirmed,v_banned FROM auth.users WHERE id=v_id FOR UPDATE;
  IF NOT FOUND OR v_banned>clock_timestamp() THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM private.node0_pending_bans WHERE email_hash=encode(sha256(convert_to(v_email,'UTF8')),'hex') AND banned_until>clock_timestamp()) THEN RETURN false; END IF;
  SELECT * INTO v_challenge FROM private.node0_email_challenges WHERE token_hash=p_hash AND user_id=v_id FOR UPDATE;
  IF NOT FOUND OR v_challenge.purpose<>p_purpose OR v_challenge.credential_version<>v_credential OR
    v_challenge.expires_at<=clock_timestamp() OR v_confirmed IS NULL AND v_until<=clock_timestamp() OR
    p_purpose='verify' AND v_confirmed IS NOT NULL THEN RETURN false; END IF;
  IF v_confirmed IS NULL THEN
    IF p_consent IS NULL OR p_consent IS DISTINCT FROM v_challenge.consent_version OR p_consent IS DISTINCT FROM private.versio_vigent() THEN RETURN false; END IF;
    PERFORM private.anota_consentiment(v_id,v_email,'rgpd_acepta',p_consent,'atorga','alta');
    IF NOT EXISTS(SELECT 1 FROM public.consentiments WHERE user_id=v_id AND tipus='rgpd_acepta' AND versio_politica=p_consent AND accio='atorga' AND origen='alta') THEN
      RAISE EXCEPTION 'node0_auth_consent_not_recorded';
    END IF;
    -- An earlier pending request may predate R8 and already have copied claims
    -- into both metadata and the canonical profile. Discard them atomically at
    -- first proof. A reset of an already confirmed account never enters here.
    UPDATE auth.users SET email_confirmed_at=clock_timestamp(),raw_user_meta_data=jsonb_build_object(
      'accepta_rgpd',true,'versio_politica',p_consent,'tenant_id','ac3bec76-255b-5ca2-8886-28fcceab4267') WHERE id=v_id;
    UPDATE public.profiles SET full_name='Veí/na',avatar_url=NULL,town_name=DEFAULT,visibility='private',is_public=false,
      username=private.usuari_lliure('veina-'||left(replace(v_id::text,'-',''),12),v_id) WHERE id=v_id;
    -- The canonical username trigger stamps every SQL username change. This
    -- generated neutral name is still a proposal, not an owner confirmation.
    UPDATE public.profiles SET username_confirmat_at=NULL WHERE id=v_id;
  END IF;
  -- The receiver chooses the password NOW; no pre-registration password can
  -- gain access, even when somebody else initiated the latest emailed token.
  UPDATE private.node0_credentials SET salt=p_salt,digest=p_digest,version=version+1,changed_at=clock_timestamp() WHERE user_id=v_id;
  DELETE FROM private.node0_email_challenges WHERE token_hash=p_hash;
  DELETE FROM auth.sessions WHERE user_id=v_id;
  RETURN true;
END $$;

DROP FUNCTION IF EXISTS private.node0_auth_verify(text);
CREATE OR REPLACE FUNCTION private.node0_auth_verify(p_hash text,p_salt text,p_digest text,p_consent text) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path='' AS $$
  SELECT private.node0_auth_finish_email(p_hash,'verify',p_salt,p_digest,p_consent);
$$;
CREATE OR REPLACE FUNCTION private.node0_auth_reset(p_hash text,p_salt text,p_digest text,p_consent text) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path='' AS $$
  SELECT private.node0_auth_finish_email(p_hash,'reset',p_salt,p_digest,p_consent);
$$;

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
  private.node0_auth_challenge_ready(text,text),private.node0_auth_sweep_pending(),
  private.node0_auth_register(text,jsonb,text,text,text),private.node0_auth_challenge(text,text),private.node0_auth_verify(text,text,text,text),private.node0_auth_reset(text,text,text,text),private.node0_auth_reset_challenge(text,text),
  private.node0_auth_create_session(uuid,bigint,text),private.node0_auth_context(text),private.node0_auth_logout(text,uuid),
  private.node0_auth_password(text,bigint,text,text,uuid),private.node0_auth_norms(text,text,uuid),private.node0_auth_norms_state(text,uuid)
  FROM PUBLIC,anon,authenticated,node0_runtime;
GRANT EXECUTE ON FUNCTION private.node0_auth_policy(),private.node0_auth_rate(text,text),private.node0_auth_credential(text),
  private.node0_auth_challenge_ready(text,text),private.node0_auth_sweep_pending(),
  private.node0_auth_register(text,jsonb,text,text,text),private.node0_auth_challenge(text,text),private.node0_auth_verify(text,text,text,text),private.node0_auth_reset(text,text,text,text),private.node0_auth_reset_challenge(text,text),
  private.node0_auth_create_session(uuid,bigint,text),private.node0_auth_context(text),private.node0_auth_logout(text,uuid),
  private.node0_auth_password(text,bigint,text,text,uuid),private.node0_auth_norms(text,text,uuid),private.node0_auth_norms_state(text,uuid) TO node0_authenticator;
REVOKE ALL ON FUNCTION private.node0_auth_purge_pending(text),private.node0_auth_finish_email(text,text,text,text,text) FROM PUBLIC,anon,authenticated,node0_runtime,node0_authenticator;
COMMIT;
