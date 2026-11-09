-- R54: opt-in disclosed IAIA in one explicitly bound, non-E2EE group per tenant.
-- No bot user, group, model, membership or binding is invented by this migration.
BEGIN;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='node0_iaia_worker') THEN CREATE ROLE node0_iaia_worker NOLOGIN; END IF; END $$;
GRANT USAGE ON SCHEMA public TO node0_iaia_worker;
-- Registration requires an existing noninteractive account with login permanently
-- banned. It neither creates credentials nor turns a human into a bot implicitly.
CREATE TABLE private.xat_iaia_principals(bot_id uuid PRIMARY KEY REFERENCES auth.users(id),registered_by uuid NOT NULL REFERENCES auth.users(id));
ALTER TABLE private.xat_iaia_principals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.xat_iaia_principals FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.xat_iaia_bot(p_bot uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS(SELECT 1 FROM private.xat_iaia_principals p JOIN auth.users u ON u.id=p.bot_id WHERE p.bot_id=p_bot AND u.banned_until='infinity'::timestamptz)
$$;
CREATE FUNCTION public.xat_iaia_register_principal(p_bot uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT coalesce(private.es_superadmin(),false) OR p_bot=auth.uid() OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_bot AND banned_until='infinity'::timestamptz)
 OR EXISTS(SELECT 1 FROM public.user_platform_roles WHERE user_id=p_bot AND role='superadmin') THEN RAISE EXCEPTION 'iaia_noninteractive_principal_required' USING ERRCODE='42501'; END IF;
 INSERT INTO private.xat_iaia_principals VALUES(p_bot,auth.uid()) ON CONFLICT DO NOTHING;RETURN true;
END $$;
CREATE TABLE private.xat_iaia_binding(
 tenant_id uuid PRIMARY KEY REFERENCES public.towns(id), fil_id uuid NOT NULL REFERENCES public.xat_fils(id),
 bot_id uuid NOT NULL REFERENCES auth.users(id), enabled boolean NOT NULL DEFAULT false,
 disclosure text NOT NULL CHECK(length(disclosure) BETWEEN 20 AND 500), revision bigint NOT NULL DEFAULT 1,
 updated_by uuid NOT NULL REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE private.xat_iaia_jobs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, fil_id uuid NOT NULL REFERENCES public.xat_fils(id),
 source_id uuid NOT NULL REFERENCES public.xat_missatges(id), requester_id uuid NOT NULL REFERENCES auth.users(id),
 bot_id uuid NOT NULL REFERENCES auth.users(id), binding_revision bigint NOT NULL, source_hash text NOT NULL,
 state text NOT NULL CHECK(state IN('running','cancelled','answered')), lease_id uuid NOT NULL,
 lease_until timestamptz NOT NULL, attempts integer NOT NULL CHECK(attempts BETWEEN 1 AND 3),
 reply_id uuid NOT NULL UNIQUE, updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,fil_id,source_id,bot_id));
ALTER TABLE private.xat_iaia_binding ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.xat_iaia_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.xat_iaia_binding,private.xat_iaia_jobs FROM PUBLIC,anon,authenticated;
-- The SQL classification, not a browser hint, decides encryption scope.
CREATE FUNCTION private.xat_iaia_plain(p_fil uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT coalesce((SELECT f.tipus='grup' AND f.epoca_actual=0 AND f.cap_epoca_hash IS NULL AND f.e2ee_des_de_seq IS NULL
 AND f.subjecte_tipus IS NOT NULL AND NOT private.xat_e2ee_abast(f.id) FROM public.xat_fils f WHERE f.id=p_fil),false)
$$;
CREATE FUNCTION public.xat_iaia_bind(p_tenant uuid,p_fil uuid,p_bot uuid,p_enabled boolean,p_disclosure text,p_expected_revision bigint DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE b private.xat_iaia_binding;
BEGIN
 IF NOT coalesce(private.es_superadmin(),false) THEN RAISE EXCEPTION 'iaia_admin_aal2_required' USING ERRCODE='42501'; END IF;
 IF p_enabled IS NULL OR p_disclosure IS NULL OR length(p_disclosure) NOT BETWEEN 20 AND 500 THEN RAISE EXCEPTION 'iaia_binding_invalid' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.xat_fils WHERE id=p_fil AND tenant_id=p_tenant FOR UPDATE;
 IF NOT FOUND OR (p_enabled AND (NOT private.xat_iaia_bot(p_bot) OR NOT private.xat_iaia_plain(p_fil) OR NOT EXISTS(SELECT 1 FROM public.xat_participants WHERE fil_id=p_fil AND usuari_id=p_bot AND visible_fins_seq IS NULL AND eixit_al IS NULL AND private.xat_participant_vigent(fil_id,usuari_id)))) THEN RAISE EXCEPTION 'iaia_group_unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO b FROM private.xat_iaia_binding WHERE tenant_id=p_tenant FOR UPDATE;
 IF p_expected_revision IS NULL OR coalesce(b.revision,0)<>p_expected_revision THEN RAISE EXCEPTION 'iaia_binding_changed' USING ERRCODE='40001'; END IF;
 INSERT INTO private.xat_iaia_binding(tenant_id,fil_id,bot_id,enabled,disclosure,updated_by)
 VALUES(p_tenant,p_fil,p_bot,p_enabled,p_disclosure,auth.uid())
 ON CONFLICT(tenant_id) DO UPDATE SET fil_id=excluded.fil_id,bot_id=excluded.bot_id,enabled=excluded.enabled,disclosure=excluded.disclosure,revision=xat_iaia_binding.revision+1,updated_by=auth.uid(),updated_at=now();
 RETURN jsonb_build_object('revision',coalesce(b.revision,0)+1,'enabled',p_enabled,'inference',false);
END $$;
-- Every membership check also uses the canonical current tenant/organization
-- predicate and eixit_al. Retained historical participant rows grant no access.
-- Worker RPCs are never callable by authenticated/anon users. Their user argument
-- is the verified cookie/JWT identity; it grants no browser authority.
CREATE FUNCTION public.xat_iaia_worker_discover(p_tenant uuid,p_user uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT (SELECT jsonb_build_object('threadId',b.fil_id,'botId',b.bot_id) FROM private.xat_iaia_binding b
 WHERE b.tenant_id=p_tenant AND b.enabled AND private.xat_iaia_bot(b.bot_id) AND private.xat_iaia_plain(b.fil_id)
 AND EXISTS(SELECT 1 FROM public.xat_participants WHERE fil_id=b.fil_id AND usuari_id=p_user AND visible_fins_seq IS NULL AND eixit_al IS NULL AND private.xat_participant_vigent(fil_id,usuari_id))
 AND EXISTS(SELECT 1 FROM public.xat_participants WHERE fil_id=b.fil_id AND usuari_id=b.bot_id AND visible_fins_seq IS NULL AND eixit_al IS NULL AND private.xat_participant_vigent(fil_id,usuari_id)))
$$;
CREATE FUNCTION public.xat_iaia_worker_claim(p_tenant uuid,p_user uuid,p_fil uuid,p_source uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE b private.xat_iaia_binding; m public.xat_missatges; j private.xat_iaia_jobs; ctx jsonb;
BEGIN
 -- Lock order matches the existing message sequence trigger (thread first).
 PERFORM 1 FROM public.xat_fils WHERE id=p_fil AND tenant_id=p_tenant FOR UPDATE;
 SELECT * INTO b FROM private.xat_iaia_binding WHERE tenant_id=p_tenant FOR SHARE;
 PERFORM 1 FROM public.xat_participants WHERE fil_id=p_fil AND usuari_id IN(p_user,b.bot_id) ORDER BY usuari_id FOR SHARE;
 IF b.tenant_id IS NULL OR NOT b.enabled OR b.fil_id<>p_fil OR b.bot_id=p_user OR NOT private.xat_iaia_bot(b.bot_id) OR NOT private.xat_iaia_plain(p_fil)
 OR NOT EXISTS(SELECT 1 FROM public.xat_participants WHERE fil_id=p_fil AND usuari_id=p_user AND visible_fins_seq IS NULL AND eixit_al IS NULL AND private.xat_participant_vigent(fil_id,usuari_id))
 OR NOT EXISTS(SELECT 1 FROM public.xat_participants WHERE fil_id=p_fil AND usuari_id=b.bot_id AND visible_fins_seq IS NULL AND eixit_al IS NULL AND private.xat_participant_vigent(fil_id,usuari_id))
 THEN RAISE EXCEPTION 'iaia_group_denied' USING ERRCODE='42501'; END IF;
 SELECT * INTO m FROM public.xat_missatges WHERE id=p_source AND fil_id=p_fil FOR SHARE;
 IF NOT FOUND OR m.usuari_id<>p_user OR m.es_ia IS DISTINCT FROM false OR m.esborrat_al IS NOT NULL OR m.tipus<>'text' OR m.versio_xifrat IS DISTINCT FROM 0 OR m.metadades IS DISTINCT FROM '{}'::jsonb OR m.seq<=(SELECT greatest(visible_des_de_seq,buidat_fins_seq) FROM public.xat_participants WHERE fil_id=p_fil AND usuari_id=p_user) OR m.seq<=(SELECT greatest(visible_des_de_seq,buidat_fins_seq) FROM public.xat_participants WHERE fil_id=p_fil AND usuari_id=b.bot_id) OR m.caduca_al<=now() OR m.text IS NULL OR length(m.text) NOT BETWEEN 1 AND 2000
 OR (m.text !~* '(^|[[:space:]])@iaia([[:space:][:punct:]]|$)' AND NOT EXISTS(SELECT 1 FROM public.xat_missatges WHERE id=m.resposta_a AND fil_id=p_fil AND usuari_id=b.bot_id AND es_ia AND esborrat_al IS NULL))
 THEN RAISE EXCEPTION 'iaia_explicit_question_required' USING ERRCODE='42501'; END IF;
 SELECT * INTO j FROM private.xat_iaia_jobs WHERE tenant_id=p_tenant AND fil_id=p_fil AND source_id=p_source AND bot_id=b.bot_id FOR UPDATE;
 IF FOUND THEN
   IF j.source_hash<>encode(sha256(convert_to(m.text,'UTF8')),'hex') THEN RAISE EXCEPTION 'iaia_source_changed' USING ERRCODE='42501'; END IF;
   IF j.state='answered' THEN RETURN (SELECT jsonb_build_object('state','answered','replyId',r.id,'botId',j.bot_id,'text',r.text) FROM public.xat_missatges r WHERE r.id=j.reply_id AND r.esborrat_al IS NULL); END IF;
   IF j.state='cancelled' OR j.lease_until>now() OR j.attempts>=3 THEN RETURN jsonb_build_object('state','pending'); END IF;
   UPDATE private.xat_iaia_jobs SET lease_id=gen_random_uuid(),lease_until=now()+interval '30 seconds',attempts=attempts+1,binding_revision=b.revision,updated_at=now() WHERE id=j.id RETURNING * INTO j;
 ELSE
   IF EXISTS(SELECT 1 FROM private.xat_iaia_jobs WHERE requester_id=p_user AND state='running' AND lease_until>now()) OR (SELECT count(*) FROM private.xat_iaia_jobs WHERE requester_id=p_user AND updated_at>now()-interval '1 minute')>=6 THEN RAISE EXCEPTION 'iaia_busy' USING ERRCODE='P0001'; END IF;
   INSERT INTO private.xat_iaia_jobs(tenant_id,fil_id,source_id,requester_id,bot_id,binding_revision,source_hash,state,lease_id,lease_until,attempts,reply_id)
   VALUES(p_tenant,p_fil,p_source,p_user,b.bot_id,b.revision,encode(sha256(convert_to(m.text,'UTF8')),'hex'),'running',gen_random_uuid(),now()+interval '30 seconds',1,(md5('iaia|'||p_tenant||'|'||p_fil||'|'||p_source||'|'||b.bot_id))::uuid) RETURNING * INTO j;
 END IF;
 -- A mention authorizes this explicit question, not other members' history.
 -- No automatic group transcript is supplied to the model by default.
 ctx:='[]'::jsonb;
 RETURN jsonb_build_object('state','claimed','jobId',j.id,'leaseId',j.lease_id,'question',m.text,'context',ctx);
END $$;
CREATE FUNCTION public.xat_iaia_worker_finish(p_tenant uuid,p_user uuid,p_job uuid,p_lease uuid,p_text text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE j private.xat_iaia_jobs; b private.xat_iaia_binding;
BEGIN
 SELECT * INTO j FROM private.xat_iaia_jobs WHERE id=p_job AND tenant_id=p_tenant AND requester_id=p_user;
 IF NOT FOUND THEN RAISE EXCEPTION 'iaia_lease_denied' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.xat_fils WHERE id=j.fil_id FOR UPDATE;
 SELECT * INTO j FROM private.xat_iaia_jobs WHERE id=p_job FOR UPDATE;
 SELECT * INTO b FROM private.xat_iaia_binding WHERE tenant_id=p_tenant FOR SHARE;
 PERFORM 1 FROM public.xat_participants WHERE fil_id=j.fil_id AND usuari_id IN(p_user,j.bot_id) ORDER BY usuari_id FOR SHARE;
 PERFORM 1 FROM public.xat_missatges WHERE id=j.source_id FOR SHARE;
 IF j.state<>'running' OR j.lease_id<>p_lease OR j.lease_until<=now() OR b.enabled IS DISTINCT FROM true OR b.revision<>j.binding_revision OR b.fil_id<>j.fil_id OR b.bot_id<>j.bot_id OR NOT private.xat_iaia_bot(j.bot_id) OR NOT private.xat_iaia_plain(j.fil_id)
 OR NOT EXISTS(SELECT 1 FROM public.xat_participants WHERE fil_id=j.fil_id AND usuari_id=p_user AND visible_fins_seq IS NULL AND eixit_al IS NULL AND private.xat_participant_vigent(fil_id,usuari_id))
 OR NOT EXISTS(SELECT 1 FROM public.xat_participants WHERE fil_id=j.fil_id AND usuari_id=j.bot_id AND visible_fins_seq IS NULL AND eixit_al IS NULL AND private.xat_participant_vigent(fil_id,usuari_id))
 OR NOT EXISTS(SELECT 1 FROM public.xat_missatges WHERE id=j.source_id AND usuari_id=p_user AND esborrat_al IS NULL AND versio_xifrat=0 AND (caduca_al IS NULL OR caduca_al>now()) AND encode(sha256(convert_to(text,'UTF8')),'hex')=j.source_hash)
 THEN RAISE EXCEPTION 'iaia_lease_denied' USING ERRCODE='42501'; END IF;
 IF p_text IS NULL OR length(trim(p_text)) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'iaia_answer_invalid' USING ERRCODE='22023'; END IF;
 INSERT INTO public.xat_missatges(id,fil_id,usuari_id,text,tipus,resposta_a,metadades,es_ia,versio_xifrat)
 VALUES(j.reply_id,j.fil_id,j.bot_id,trim(p_text),'text',j.source_id,'{}',true,0);
 UPDATE private.xat_iaia_jobs SET state='answered',updated_at=now() WHERE id=j.id;
 RETURN jsonb_build_object('replyId',j.reply_id,'botId',j.bot_id,'text',trim(p_text));
END $$;
CREATE FUNCTION public.xat_iaia_worker_cancel(p_tenant uuid,p_user uuid,p_job uuid,p_lease uuid)
RETURNS boolean LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
 WITH changed AS (UPDATE private.xat_iaia_jobs SET state='cancelled',updated_at=now() WHERE id=p_job AND tenant_id=p_tenant AND requester_id=p_user AND lease_id=p_lease AND state='running' RETURNING id) SELECT EXISTS(SELECT 1 FROM changed)
$$;
REVOKE ALL ON FUNCTION private.xat_iaia_bot(uuid) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.xat_iaia_register_principal(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xat_iaia_register_principal(uuid) TO authenticated;
REVOKE ALL ON FUNCTION private.xat_iaia_plain(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.xat_iaia_bind(uuid,uuid,uuid,boolean,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_iaia_bind(uuid,uuid,uuid,boolean,text,bigint) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_iaia_worker_discover(uuid,uuid),public.xat_iaia_worker_claim(uuid,uuid,uuid,uuid),public.xat_iaia_worker_finish(uuid,uuid,uuid,uuid,text),public.xat_iaia_worker_cancel(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_iaia_worker_discover(uuid,uuid),public.xat_iaia_worker_claim(uuid,uuid,uuid,uuid),public.xat_iaia_worker_finish(uuid,uuid,uuid,uuid,text),public.xat_iaia_worker_cancel(uuid,uuid,uuid,uuid) TO service_role,node0_iaia_worker;
-- Provision a SEPARATE node0_iaia_authenticator LOGIN NOINHERIT with ONLY
-- node0_iaia_worker membership; never grant it to the two-role web authenticator.
-- Apply every POLITICA_LOG_PRIVAT_NODE0 role GUC from consulta-privada-node0.mjs
-- to that dedicated login before activation; the private adapter verifies all
-- settings before binding any values. This migration does not activate inference.
COMMIT;
