/* R22.2 · La migració 20261114000100 sobre PostgreSQL 18.6 real, amb tot el
   catàleg anterior en l'ordre del verificador i els residus LITERALS de
   producció dels bolcats del 13-11-2026 (q16a, q17, q13 i q12; l'empremta
   md5(prosrc) de cada cos es comprova contra la de q15). Reproduïx primer els
   errors de producció que recull supabase_viu/ref_local/reproduccio_deriva.json
   (titular, traspàs, revocació del consentiment, llista d'entitats, purga
   d'una propietària, metadades d'1 MB) i després aplica la migració dues
   vegades seguides amb un rol SENSE superusuari (com l'editor SQL de
   Supabase, que no és superusuari) i afirma el comportament de Git. Cap
   servei remot. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION = '20261114000100_r22_2_reconciliacio_deriva_produccio.sql';
const MD5_XAT_ENVIA_GIT = '2ab3cc315219aaac4a0aa83b0f9768be';
const MD5_CREA_FIL_DIRECTE = '354f4120d203494efe099e7d89852c3f';
const MD5_MEMBRES_DEL_POBLE_GIT = '2bab4bf5bd8c3fd278c61f2dd6882bb3';
const id = n => `22200000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), A = id(11), B = id(12), C = id(13), D = id(14), E = id(15), F = id(16);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const codi = c => e => e.code === c;

/* Residus literals de producció (supabase_viu, 13-11-2026). md5 = md5(prosrc) de q15. */
const RESIDUS = {
 "funcions": {
  "sdp_protegeix_propietari()": {
   "def": "CREATE OR REPLACE FUNCTION public.sdp_protegeix_propietari()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nbegin\n  if old.role = 'owner' and not exists (\n    select 1 from public.organization_memberships m\n    where m.organization_id = old.organization_id and m.role = 'owner' and m.user_id <> old.user_id\n  ) then\n    raise exception 'SDP-LOCK: última propietària. Transfereix la propietat abans d''eixir o eliminar.' using errcode = '23503';\n  end if;\n  if tg_op = 'UPDATE' then return new; end if;\n  return old;\nend;\n$function$\n",
   "md5": "031f44c6de20529ed29458c8c81af9fa",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "delete_user()": {
   "def": "CREATE OR REPLACE FUNCTION public.delete_user()\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nBEGIN\n    -- Seguretat total: Només pot esborrar el compte que fa la petició (auth.uid())\n    DELETE FROM auth.users WHERE id = auth.uid();\nEND;\n$function$\n",
   "md5": "9496cd88e6f2028e57d16547b7a200f4",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "xat_envia(uuid,uuid,text,text,uuid,jsonb)": {
   "def": "CREATE OR REPLACE FUNCTION public.xat_envia(p_id uuid, p_fil_id uuid, p_tipus text DEFAULT 'text'::text, p_text text DEFAULT NULL::text, p_resposta_a uuid DEFAULT NULL::uuid, p_metadades jsonb DEFAULT '{}'::jsonb)\n RETURNS TABLE(id uuid, seq bigint, creat_al timestamp with time zone, usuari_id uuid, com_org_id uuid, autor_nom text)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\n#variable_conflict use_column\ndeclare\n  v_jo uuid := (select auth.uid());\n  v_org uuid;\n  v_m public.xat_missatges%rowtype;\n  v_text text := btrim(p_text);\nbegin\n  if v_jo is null then\n    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';\n  end if;\n  if p_id is null or p_fil_id is null or jsonb_typeof(coalesce(p_metadades, '{}'::jsonb)) <> 'object' then\n    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';\n  end if;\n  if coalesce(nullif(btrim(p_tipus), ''), 'text') <> 'text' then\n    raise exception 'SDP-XAT-010: tipus de missatge no admés des del client.' using errcode = '22023';\n  end if;\n  if v_text is null or v_text = '' or char_length(v_text) > 4096 then\n    raise exception 'SDP-XAT-007: missatge buit o massa llarg.' using errcode = '22023';\n  end if;\n  if not private.es_participant(p_fil_id) then\n    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';\n  end if;\n  select p.com_org_id into v_org from public.xat_participants p\n  where p.fil_id = p_fil_id and p.usuari_id = v_jo;\n  if v_org is not null then\n    -- La revocació no pot intercalar-se entre l'autorització i l'enviament.\n    perform 1 from public.organization_memberships om where om.organization_id = v_org\n      and om.user_id = v_jo and om.role in ('owner', 'admin') for share;\n    if not found then\n      raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';\n    end if;\n  end if;\n  -- Serialitza també reintents concurrents: no consumixen seq ni el límit de freqüència.\n  perform pg_advisory_xact_lock(hashtextextended('xat:missatge:' || p_id::text, 0));\n  select m.* into v_m from public.xat_missatges m where m.id = p_id;\n  if found then\n    if v_m.usuari_id is distinct from v_jo or v_m.fil_id is distinct from p_fil_id then\n      raise exception 'SDP-XAT-008: identificador d''un altre enviament.' using errcode = '42501';\n    end if;\n  else\n    -- Una cita s'autoritza en crear el missatge. Un reintent ja acceptat\n    -- continua sent idempotent si després la cita caduca o es buida.\n    if p_resposta_a is not null and not exists (select 1 from public.xat_missatges m\n      where m.id = p_resposta_a and m.fil_id = p_fil_id and private.seq_visible(m.fil_id, m.seq)\n        and (m.caduca_al is null or m.caduca_al > now())) then\n      raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';\n    end if;\n    insert into public.xat_missatges (id, fil_id, usuari_id, com_org_id, text, tipus, resposta_a, metadades, es_ia)\n    values (p_id, p_fil_id, v_jo, v_org, v_text, 'text', p_resposta_a,\n      coalesce(p_metadades, '{}'::jsonb) - array['com_org_id', 'comOrgId', 'autor_nom', 'autorNom', 'usuari_id', 'usuariId'], false)\n    returning * into v_m;\n  end if;\n  update public.xat_participants p set llegit_fins_seq = greatest(p.llegit_fins_seq, v_m.seq),\n    rebut_fins_seq = greatest(p.rebut_fins_seq, v_m.seq)\n  where p.fil_id = p_fil_id and p.usuari_id = v_jo;\n  return query select v_m.id, v_m.seq, v_m.creat_al, v_m.usuari_id, v_m.com_org_id,\n    coalesce(o.name, pr.full_name, 'Veí')::text\n  from public.profiles pr left join public.organizations o on o.id = v_m.com_org_id\n  where pr.id = v_jo;\nend;\n$function$\n",
   "md5": "8085c6e08dfc69dfebd22aac2ea47843",
   "executen": [
    "authenticated",
    "service_role"
   ],
   "heretada": false
  },
  "admin_list_organizations()": {
   "def": "CREATE OR REPLACE FUNCTION public.admin_list_organizations()\n RETURNS jsonb\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nDECLARE\n  v_result jsonb;\nBEGIN\n  IF NOT private.es_superadmin() THEN\n    RAISE EXCEPTION 'Forbidden: Superadmin access required' USING ERRCODE = '42501';\n  END IF;\n\n  SELECT COALESCE(\n    jsonb_agg(\n      jsonb_build_object(\n        'id', e.id,\n        'nom', e.nom,\n        'tipus', e.tipus,\n        'poble_id', e.poble_id,\n        'creat_el', e.creat_el\n      )\n      ORDER BY e.creat_el DESC\n    ),\n    '[]'::jsonb\n  )\n  INTO v_result\n  FROM public.entitats e;\n\n  RETURN v_result;\nEND;\n$function$\n",
   "md5": "ad4d1e4453af8b616afc4755bbf87a5f",
   "executen": [
    "authenticated",
    "service_role"
   ],
   "heretada": false
  },
  "admin_list_users(integer,integer)": {
   "def": "CREATE OR REPLACE FUNCTION public.admin_list_users(p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nBEGIN\n  IF NOT coalesce((SELECT private.es_superadmin()), false) THEN\n    RAISE EXCEPTION 'SDP-ADMIN-001: cal rol de superadmin.' USING errcode = '42501';\n  END IF;\n  RETURN (\n    SELECT coalesce(json_agg(t), '[]'::json) FROM (\n      SELECT\n        u.id,\n        u.email,\n        u.created_at,\n        u.last_sign_in_at,\n        coalesce(p.full_name, p.username, 'Veí/na') AS nom,\n        coalesce(s.ultima_activitat_real, u.last_sign_in_at, u.created_at) AS ultima_activitat_real,\n        coalesce(s.te_app_android, false) AS te_app_android,\n        CASE\n          WHEN coalesce(s.te_app_android, false) THEN '📱 App Android (WebView)'\n          WHEN s.user_agent ILIKE '%iPhone%' OR s.user_agent ILIKE '%iPad%' THEN '🍎 iPhone/iPad (Safari/Web)'\n          WHEN s.user_agent ILIKE '%Android%' THEN '🌐 Android (Navegador Web)'\n          WHEN s.user_agent IS NOT NULL THEN '💻 Ordinador (Web Escriptori)'\n          ELSE '🔒 Registrat (sense sessió activa)'\n        END AS origen_entrada\n      FROM auth.users u\n      LEFT JOIN public.profiles p ON p.id = u.id\n      LEFT JOIN LATERAL (\n        SELECT\n          (ARRAY_AGG(s2.user_agent ORDER BY s2.updated_at DESC))[1] AS user_agent,\n          MAX(s2.updated_at) AS ultima_activitat_real,\n          BOOL_OR(s2.user_agent LIKE '%; wv)%' OR s2.user_agent ILIKE '%Capacitor%') AS te_app_android\n        FROM auth.sessions s2\n        WHERE s2.user_id = u.id\n      ) s ON true\n      ORDER BY coalesce(s.ultima_activitat_real, u.last_sign_in_at, u.created_at) DESC NULLS LAST\n      LIMIT greatest(1, least(coalesce(p_limit, 100), 500))\n      OFFSET greatest(0, coalesce(p_offset, 0))\n    ) t\n  );\nEND;\n$function$\n",
   "md5": "4821841c550bbd2cbe7e7ab665b5b8ff",
   "executen": [
    "authenticated",
    "service_role"
   ],
   "heretada": false
  },
  "private.can_create_group(uuid,uuid)": {
   "def": "CREATE OR REPLACE FUNCTION private.can_create_group(p_parent_organization_id uuid, p_tenant_id uuid)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO ''\nAS $function$\n  select (select auth.uid()) is not null\n    and p_parent_organization_id is not null\n    and exists (\n      select 1\n      from public.organizations parent\n      join public.organization_memberships membership\n        on membership.organization_id = parent.id\n       and membership.tenant_id = parent.tenant_id\n      where parent.id = p_parent_organization_id\n        and parent.tenant_id = p_tenant_id\n        and parent.kind in ('company', 'entity', 'city_hall')\n        and membership.user_id = (select auth.uid())\n        and membership.role in ('owner', 'admin')\n    );\n$function$\n",
   "md5": "131111cdb7c2b1f48cf023d26e4dfdb8",
   "executen": [
    "authenticated"
   ],
   "heretada": false
  },
  "private.capcalera_client(text)": {
   "def": "CREATE OR REPLACE FUNCTION private.capcalera_client(p_que text)\n RETURNS text\n LANGUAGE plpgsql\n STABLE\n SET search_path TO ''\nAS $function$\ndeclare\n  v_h jsonb;\nbegin\n  begin\n    v_h := nullif(current_setting('request.headers', true), '')::jsonb;\n  exception when others then\n    return null;\n  end;\n  if v_h is null then\n    return null;\n  end if;\n  if p_que = 'ip' then\n    return nullif(btrim(split_part(coalesce(v_h ->> 'cf-connecting-ip', v_h ->> 'x-real-ip', v_h ->> 'x-forwarded-for', ''), ',', 1)), '');\n  elsif p_que = 'ua' then\n    return nullif(left(btrim(coalesce(v_h ->> 'user-agent', '')), 300), '');\n  end if;\n  return null;\nend;\n$function$\n",
   "md5": "ad09d58b4c7b2a408ce6a5ee259cfeae",
   "executen": [],
   "heretada": false
  },
  "sanitize_posts_content_trigger()": {
   "def": "CREATE OR REPLACE FUNCTION public.sanitize_posts_content_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\n SET search_path TO 'public'\nAS $function$\nBEGIN\n    IF NEW.content IS NOT NULL THEN\n        NEW.content := public.sanitize_html(NEW.content);\n    END IF;\n    RETURN NEW;\nEND;\n$function$\n",
   "md5": "f817e3b3bd0e975a3272dd84d139a0c5",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "sanitize_html(text)": {
   "def": "CREATE OR REPLACE FUNCTION public.sanitize_html(input text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\n SET search_path TO 'public'\nAS $function$\nBEGIN\n    -- Eliminar tags perillosos a nivell de BD\n    RETURN regexp_replace(input, '<(script|iframe|object|embed|form|input)[^>]*>.*?</\\1>', '', 'gi');\nEND;\n$function$\n",
   "md5": "1d995f8b51aa6638e02cf7210d06410f",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "clean_expired_push_subscriptions()": {
   "def": "CREATE OR REPLACE FUNCTION public.clean_expired_push_subscriptions()\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nBEGIN\n    -- Delete subscriptions not used in 90 days\n    DELETE FROM push_subscriptions\n    WHERE last_used_at < NOW() - INTERVAL '90 days';\nEND;\n$function$\n",
   "md5": "e83ef044dfa19e24449a651bc35d62f5",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "log_push_notification(uuid,text,jsonb,boolean,text)": {
   "def": "CREATE OR REPLACE FUNCTION public.log_push_notification(p_user_id uuid, p_type text, p_payload jsonb, p_success boolean, p_error text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n    v_log_id UUID;\nBEGIN\n    INSERT INTO push_notifications_log (user_id, notification_type, payload, success, error_message)\n    VALUES (p_user_id, p_type, p_payload, p_success, p_error)\n    RETURNING id INTO v_log_id;\n    \n    RETURN v_log_id;\nEND;\n$function$\n",
   "md5": "3ea91e7f9e8819c395f3b13eff52e1e3",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "mark_messages_as_read(uuid,uuid)": {
   "def": "CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conv_id uuid, user_id uuid)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nBEGIN\n    UPDATE messages\n    SET read_at = now()\n    WHERE conversation_id = conv_id\n    AND sender_id != user_id\n    AND read_at IS NULL;\nEND;\n$function$\n",
   "md5": "4dc64d85796b267cb589167e1b00cfbf",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "check_market_rate_limit()": {
   "def": "CREATE OR REPLACE FUNCTION public.check_market_rate_limit()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n    item_count INT;\n    limit_count INT := 3; -- Max 3 items\n    window_min INT := 15; -- per 15 minutes\nBEGIN\n    SELECT count(*) INTO item_count\n    FROM market_items\n    WHERE author_user_id = auth.uid()\n    AND created_at > (now() - (window_min || ' minutes')::interval);\n\n    IF item_count >= limit_count THEN\n        RAISE EXCEPTION 'Rate limit reached for market. Please wait a few minutes before adding more items.'\n        USING ERRCODE = 'P0001';\n    END IF;\n\n    RETURN NEW;\nEND;\n$function$\n",
   "md5": "0fc216522872637f227b54efb8e47a8d",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "check_post_rate_limit()": {
   "def": "CREATE OR REPLACE FUNCTION public.check_post_rate_limit()\n RETURNS trigger\n LANGUAGE plpgsql\n SET search_path TO 'public'\nAS $function$\nBEGIN\n    IF EXISTS (\n        SELECT 1 FROM posts \n        WHERE author_id = NEW.author_id \n        AND created_at > NOW() - INTERVAL '1 second'\n    ) THEN\n        RAISE EXCEPTION 'Rate limit exceeded. Acció massa ràpida bloquejada per seguretat.';\n    END IF;\n    RETURN NEW;\nEND;\n$function$\n",
   "md5": "2db41ccc8810368d882cecdcd899d4b6",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "fn_market_items_null_safety()": {
   "def": "CREATE OR REPLACE FUNCTION public.fn_market_items_null_safety()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    -- Si el client envia explícitament un NULL (malgrat la constraint), el captem abans de l'error\n    NEW.seo_title := COALESCE(NEW.seo_title, 'EMPTY');\n    NEW.seo_description := COALESCE(NEW.seo_description, 'EMPTY');\n    NEW.seo_keywords := COALESCE(NEW.seo_keywords, '{}'::jsonb);\n    \n    -- Altres camps importants\n    NEW.subtitle := COALESCE(NEW.subtitle, '');\n    NEW.short_description := COALESCE(NEW.short_description, 'Sense descripció curta');\n    \n    RETURN NEW;\nEND;\n$function$\n",
   "md5": "fe119565d4a62fe8b9e253f605bc2926",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "generate_post_slug()": {
   "def": "CREATE OR REPLACE FUNCTION public.generate_post_slug()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    base_slug TEXT;\n    candidate_slug TEXT;\n    counter INT := 1;\nBEGIN\n    -- Només generar si el slug està buit, és NULL o estem forçant la regeneració\n    IF NEW.slug IS NULL OR NEW.slug = 'EMPTY' OR NEW.slug = '' THEN\n        -- Extraiem un text base del seo_title, amb fallback a 'post'\n        base_slug := COALESCE(NULLIF(TRIM(NEW.seo_title), 'EMPTY'), 'post');\n        \n        -- Passem a minúscules, llevem accents i eliminem caràcters no alfanumèrics substituint-los per guions\n        base_slug := lower(regexp_replace(unaccent(base_slug), '[^a-zA-Z0-9]+', '-', 'g'));\n        \n        -- Llevem els guions inicials i finals per evitar '-titol-'\n        base_slug := trim(both '-' from base_slug);\n        \n        -- Comencem provant el slug completament net\n        candidate_slug := base_slug;\n        \n        -- Bucle de comprovació: si el slug ja està ocupat per un altre post (id diferent), incrementem el comptador\n        WHILE EXISTS (SELECT 1 FROM public.posts WHERE slug = candidate_slug AND id != NEW.id) LOOP\n            counter := counter + 1;\n            candidate_slug := base_slug || '-' || counter::text;\n        END LOOP;\n        \n        -- Assignem el slug lliure trobat\n        NEW.slug := candidate_slug;\n    END IF;\n    RETURN NEW;\nEND;\n$function$\n",
   "md5": "f0506bb2a9bc4ec3174ceca0da2046e1",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "handle_updated_at()": {
   "def": "CREATE OR REPLACE FUNCTION public.handle_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n$function$\n",
   "md5": "301a884953d37769916294bb60562e05",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "omega_invalidate_stale_translations()": {
   "def": "CREATE OR REPLACE FUNCTION public.omega_invalidate_stale_translations()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\n    BEGIN\n        -- Si el contenido ha mutado, purgamos las traducciones cacheadas\n        IF OLD.content IS DISTINCT FROM NEW.content THEN\n            DELETE FROM public.post_translations WHERE post_id = NEW.uuid;\n            RAISE USING MESSAGE = 'Traducciones eliminadas para el post mutado: ' || NEW.uuid;\n        END IF;\n        RETURN NEW;\n    END;\n    $function$\n",
   "md5": "1af713305b52a8a2bfa2bdf3e8994c77",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "omega_set_default_parent_id()": {
   "def": "CREATE OR REPLACE FUNCTION public.omega_set_default_parent_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\n    BEGIN\n        IF NEW.parent_id IS NULL THEN\n            NEW.parent_id := NEW.id;\n        END IF;\n        RETURN NEW;\n    END;\n    $function$\n",
   "md5": "2844573e3e1c21c0c8050eac8d85f988",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "refresh_entity_member_map()": {
   "def": "CREATE OR REPLACE FUNCTION public.refresh_entity_member_map()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nBEGIN\n    REFRESH MATERIALIZED VIEW CONCURRENTLY entity_member_map;\n    RETURN NULL;\nEND;\n$function$\n",
   "md5": "42c8ac6ebd74f7aebf731b4fcab881f1",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "update_cms_pages_modtime()": {
   "def": "CREATE OR REPLACE FUNCTION public.update_cms_pages_modtime()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = NOW();\n    RETURN NEW;\nEND;\n$function$\n",
   "md5": "06bcf30ac3d0a7f279a54cbf228a7bec",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "update_connections_count()": {
   "def": "CREATE OR REPLACE FUNCTION public.update_connections_count()\n RETURNS trigger\n LANGUAGE plpgsql\n SET search_path TO 'public'\nAS $function$\nBEGIN\n    IF (TG_OP = 'INSERT') THEN\n        UPDATE posts SET connections_count = connections_count + 1 WHERE id = NEW.post_id;\n    ELSIF (TG_OP = 'DELETE') THEN\n        UPDATE posts SET connections_count = GREATEST(0, connections_count - 1) WHERE id = OLD.post_id;\n    END IF;\n    RETURN NULL;\nEND;\n$function$\n",
   "md5": "3aa06068c4c69d1429f6c7c09e30e4f7",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "update_lexicon_updated_at_column()": {
   "def": "CREATE OR REPLACE FUNCTION public.update_lexicon_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\n        BEGIN\n           NEW.updated_at = timezone('utc'::text, now());\n           RETURN NEW;\n        END;\n        $function$\n",
   "md5": "c2d66d6746e54312469c3242cdce97ef",
   "executen": [
    "PUBLIC",
    "anon",
    "authenticated",
    "service_role"
   ],
   "heretada": true
  },
  "membres_del_poble(uuid,text,integer)": {
   "def": "CREATE OR REPLACE FUNCTION public.membres_del_poble(p_tenant_id uuid, p_cerca text DEFAULT NULL::text, p_limit integer DEFAULT 100)\n RETURNS TABLE(usuari_id uuid, nom text, fil_id uuid, tipus text, avatar_url text)\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO ''\nAS $function$\n#variable_conflict use_column\ndeclare v_jo uuid := (select auth.uid());\nbegin\n  if v_jo is null then\n    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';\n  end if;\n  if not private.is_town_member(p_tenant_id) then\n    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';\n  end if;\n  return query\n  select d.id, d.nom, d.fil_id, d.tipus, d.avatar_url from (\n    select pr.id, coalesce(pr.full_name, 'Veí') as nom, 'persona'::text as tipus, pr.avatar_url,\n      (select f.id from public.xat_fils f\n       where f.tenant_id = p_tenant_id and f.tipus = 'directe'\n         and f.org_id is null and f.interlocutor_id is null\n         and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2\n         and private.es_participant(f.id)\n         and exists (select 1 from public.xat_participants p where p.fil_id = f.id\n           and p.usuari_id = pr.id and p.visible_fins_seq is null)\n       order by f.creat_al, f.id limit 1) as fil_id\n    from public.town_memberships tm join public.profiles pr on pr.id = tm.user_id\n    where tm.town_id = p_tenant_id and pr.id <> v_jo and pr.baixa_demanada_at is null\n    union all\n    select o.id, o.name, 'entitat'::text, o.logo_url,\n      (select f.id from public.xat_fils f where f.tenant_id = p_tenant_id\n        and f.org_id = o.id and f.interlocutor_id = v_jo and private.es_participant(f.id)\n       order by f.creat_al, f.id limit 1)\n    from public.organizations o\n    where o.tenant_id = p_tenant_id\n      and (o.visibility = 'public' or private.is_organization_member(o.id))\n      and not private.can_manage_organization(o.id)\n  ) d\n  where nullif(btrim(p_cerca), '') is null or not exists (select 1 from regexp_split_to_table(private.xat_plega_cerca(btrim(p_cerca)), '\\s+') mot\n    where strpos(private.xat_plega_cerca(d.nom), mot) = 0)\n  order by d.nom, d.id limit greatest(1, least(coalesce(p_limit, 100), 500));\nend;\n$function$\n",
   "md5": "8c54398d0038648bd4b9150bf2364562",
   "executen": [
    "authenticated",
    "service_role"
   ],
   "heretada": false
  }
 },
 "disparador": "CREATE TRIGGER sdp_protegeix_propietari BEFORE DELETE OR UPDATE ON public.organization_memberships FOR EACH ROW EXECUTE FUNCTION sdp_protegeix_propietari()",
 "index": "CREATE UNIQUE INDEX idx_organization_memberships_one_owner ON public.organization_memberships USING btree (organization_id) WHERE (role = 'owner'::text)",
 "fk": "FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT",
 "autoria": "CHECK (pot_signar_com_organitzacio(author_org_id, tenant_id)) NOT VALID"
};

async function actor(db, who, sql, params = [], { role = who ? 'authenticated' : 'anon', aal = 'aal1', setRole = true } = {}) {
  await db.query('begin');
  try {
    if (setRole) await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}
/* Una transacció que es desfà sempre; els disparadors diferits es forcen abans, com faria el COMMIT. */
async function desfet(db, passos) {
  await db.query('begin');
  try {
    let darrer = null;
    for (const [sql, params] of passos) darrer = await db.query(sql, params ?? []);
    await db.query('set constraints all immediate');
    return darrer;
  } finally { await db.query('rollback'); }
}
const prosrcMd5 = async (db, sig) => (await db.query('select md5(prosrc) as m from pg_proc where oid = to_regprocedure($1)', [sig])).rows[0]?.m ?? null;
const purga = async (db, who) => {
  await db.query("update private.baixes set purga_prevista_al = now() - interval '1 day' where user_id = $1", [who]);
  const fet = (await db.query('select private.purga_una_baixa($1) as fet', [who])).rows[0].fet;
  return { fet, ...(await db.query('select (select count(*)::int from auth.users where id=$1) as compte, (select count(*)::int from public.town_memberships where user_id=$1) as pertinences', [who])).rows[0] };
};

/* El que la migració toca. Els propietaris queden fora (el rol de l'editor els canvia en recrear). */
async function empremta(db) {
  const q = async sql => (await db.query(sql)).rows;
  const acl = "array(select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end || ':' || a.privilege_type from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee <> p.proowner order by 1)::text";
  return {
    funcions: await q(`select p.oid::regprocedure::text as sig, p.prosecdef, p.proconfig::text as cfg, md5(p.prosrc) as md5, pg_get_function_result(p.oid) as ret, ${acl} as acl
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where (n.nspname, p.proname) in (('public','xat_envia'),('public','crea_fil_directe'),('public','admin_list_organizations'),('public','admin_list_users'),('public','delete_user'),
        ('public','sdp_protegeix_propietari'),('public','membres_del_poble'),('private','peticio_de_servidor'),('private','section_submissions_autoria_org_valida'),('public','sanitize_html'),('public','handle_updated_at')) order by 1`),
    disparadors: await q("select tgrelid::regclass::text as taula, tgname, tgenabled, tgfoid::regprocedure::text as funcio from pg_trigger where tgrelid in ('public.organization_memberships'::regclass,'public.section_submissions'::regclass) and not tgisinternal order by 1,2"),
    restriccions: await q("select conrelid::regclass::text as taula, conname, convalidated, pg_get_constraintdef(oid) as def from pg_constraint where conrelid in ('public.organizations'::regclass,'public.xat_missatges'::regclass,'public.section_submissions'::regclass,'public.organization_memberships'::regclass) order by 1,2"),
    index: await q("select indexname from pg_indexes where schemaname='public' and tablename='organization_memberships' order by 1"),
    columnes: await q("select attrelid::regclass::text as taula, attname, attnotnull, format_type(atttypid, atttypmod) as tipus, pg_get_expr(d.adbin, d.adrelid) as defecte from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum where (attrelid, attname) in (('public.organizations'::regclass,'created_by'),('public.profiles'::regclass,'consentiment_rgpd_at'),('public.notes'::regclass,'icon'),('public.notes'::regclass,'publish_date')) order by 1,2"),
    defectes: await q("select defaclrole::regrole::text as rol, coalesce(defaclnamespace::regnamespace::text,'-') as esquema, defaclobjtype as tipus, defaclacl::text as acl from pg_default_acl order by 1,2,3"),
    privilegisTaules: await q(`select r.rol, p.priv, count(*)::int as taules from (values ('anon'),('authenticated')) r(rol) cross join (values ('TRUNCATE'),('REFERENCES'),('TRIGGER'),('MAINTAIN'),('SELECT')) p(priv)
      join pg_class c on c.relkind in ('r','p') join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
      where has_table_privilege(r.rol, c.oid, p.priv) group by 1,2 order by 1,2`)
  };
}

test('R22.2 · reconciliació de la deriva de producció sobre PostgreSQL 18.6 real', { timeout: 300000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  const avisos = [];
  db.on('notice', n => avisos.push(n.message));
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    const posicio = plan.migrations.findIndex(m => m.file === MIGRATION);
    assert.ok(posicio > plan.migrations.findIndex(m => m.file.startsWith('20261113112500_')), 'el pla del verificador la posa darrere de R22.0');
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations.slice(0, posicio)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`baseline ${migration.file}: ${e.message}`, { cause: e }); }
    }
    const git = {};
    for (const sig of ['public.xat_envia(uuid,uuid,text,text,uuid,jsonb)', 'public.crea_fil_directe(uuid,uuid,text)', 'public.admin_list_organizations()', 'public.admin_list_users(integer,integer)'])
      git[sig] = await prosrcMd5(db, sig);
    assert.equal(git['public.xat_envia(uuid,uuid,text,text,uuid,jsonb)'], MD5_XAT_ENVIA_GIT, 'Git ja té el xat_envia de 2610081543');
    assert.equal(git['public.crea_fil_directe(uuid,uuid,text)'], MD5_CREA_FIL_DIRECTE, 'Git té el crea_fil_directe de 2611121630');
    assert.equal(await prosrcMd5(db, 'public.membres_del_poble(uuid,text,integer)'), MD5_MEMBRES_DEL_POBLE_GIT, 'Git té el membres_del_poble de 2610081543');

    /* ── La forma de producció (residus literals) ─────────────────────────── */
    await db.query('set check_function_bodies = off');
    for (const [sig, f] of Object.entries(RESIDUS.funcions)) {
      const def = sig === 'admin_list_organizations()'
        ? f.def.replace('CREATE OR REPLACE FUNCTION public.admin_list_organizations()', 'DROP FUNCTION public.admin_list_organizations(); CREATE FUNCTION public.admin_list_organizations()')
        : f.def;
      await db.query(def);
      const nom = sig.startsWith('private.') ? sig : `public.${sig}`;
      assert.equal(await prosrcMd5(db, nom), f.md5, `cos literal de producció: ${sig}`);
      /* L'ACL exacta de q15. */
      await db.query(`revoke all on function ${nom} from public, anon, authenticated, service_role`);
      if (f.executen.length) await db.query(`grant execute on function ${nom} to ${f.executen.join(', ')}`);
    }
    await db.query('reset check_function_bodies');
    await db.query(RESIDUS.disparador);
    await db.query(RESIDUS.index);
    /* q12 i q11: created_by NOT NULL amb RESTRICT; consentiment NOT NULL DEFAULT now(). */
    await db.query(`alter table public.organizations drop constraint organizations_created_by_fkey;
      alter table public.organizations add constraint organizations_created_by_fkey ${RESIDUS.fk.replace('REFERENCES profiles', 'REFERENCES public.profiles')};
      alter table public.organizations alter column created_by set not null;
      alter table public.profiles alter column consentiment_rgpd_at set default now();
      update public.profiles set consentiment_rgpd_at = now() where consentiment_rgpd_at is null;
      alter table public.profiles alter column consentiment_rgpd_at set not null;`);
    /* q10, q26 i q28: privilegis de plataforma de Supabase que el bootstrap local no té. */
    await db.query(`alter table auth.users add column if not exists created_at timestamptz not null default now(), add column if not exists last_sign_in_at timestamptz;
      grant select on public.towns to authenticated;
      grant truncate, references, trigger, maintain on all tables in schema public to anon, authenticated;
      alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;`);
    assert.equal((await db.query("select pg_get_constraintdef(oid) as d from pg_constraint where conname='section_submissions_autoria_org_valida'")).rows[0].d, RESIDUS.autoria);

    /* Dades sintètiques pel camí real (handle_new_user, create_organization com a authenticated). */
    await db.query("insert into public.towns(id,slug,name) values($1,'r22-2-deriva','Poble sintètic')", [TOWN]);
    for (const [who, nom, consent] of [[A, 'Persona sintètica A', true], [B, 'Persona sintètica B', true], [C, 'Persona OAuth sense casella', false],
      [D, 'Persona sintètica D', true], [E, 'Persona sintètica E', true], [F, 'Persona sintètica F', true]]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, consent ? { full_name: nom, tenant_id: TOWN, accepta_rgpd: true, rgpd: true } : { name: nom, tenant_id: TOWN }]);
      if (consent) await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin') on conflict do nothing", [E]);
    const empresa = (await actor(db, A, "select (public.create_organization($1,'company','Empresa sintètica','r22-2-empresa')->>'id') as id", [TOWN])).rows[0].id;
    const empresaD = (await actor(db, D, "select (public.create_organization($1,'company','Empresa de D','r22-2-empresa-d')->>'id') as id", [TOWN])).rows[0].id;
    await actor(db, A, "select * from public.desa_membre_organitzacio($1,$2,'persona','member')", [empresa, B]);
    /* Una publicació signada per l'entitat, amb la sessió de la propietària. */
    const SIGNADA = id(700);
    await actor(db, A, `insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload,author_org_id)
      values($1,$2,$3,'mur','Publicació signada','', '{"content":"<p>Text sintètic</p>","visibility":"public"}'::jsonb,$4)`, [SIGNADA, TOWN, A, empresa], { setRole: false });
    const filE = (await actor(db, E, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, E])).rows[0].id;
    await actor(db, D, "select public.demana_baixa('Baixa sintètica R22.2')");

    await t.test('Abans: la forma de producció reproduïx els errors de reproduccio_deriva.json', async () => {
      await assert.rejects(actor(db, A, 'select public.marca_titular_public($1,true)', [empresa]), e => e.code === '23503' && /SDP-LOCK/.test(e.message), 'T1');
      await assert.rejects(actor(db, A, 'select * from public.transfereix_propietat_organitzacio($1,$2)', [empresa, B]), e => e.code === '23503' && /SDP-LOCK/.test(e.message), 'T2');
      await assert.rejects(actor(db, B, "select public.revoca_consentiment('rgpd_acepta')"), codi('23502'), 'T3');
      assert.notEqual(await prosrcMd5(db, 'public.membres_del_poble(uuid,text,integer)'), MD5_MEMBRES_DEL_POBLE_GIT, 'producció té un directori sense el filtre de consentiment');
      await assert.rejects(actor(db, A, "select public.create_organization($1,'group','Colla sense mare','r22-2-colla-abans')", [TOWN]), codi('42501'), 'T7 (R04)');
      assert.equal((await db.query('select consentiment_rgpd_at is not null as marcat from public.profiles where id=$1', [C])).rows[0].marcat, true, 'T4: l’alta OAuth sense casella naix «consentida»');
      await assert.rejects(actor(db, E, 'select public.admin_list_organizations()', [], { aal: 'aal2' }), codi('42P01'), 'T9');
      await assert.rejects(purga(db, D), e => e.code === '23503' && /SDP-LOCK/.test(e.message), 'T5: purga de la propietària i creadora d’una empresa');
      await assert.rejects(desfet(db, [['delete from public.organizations where id=$1', [empresa]]]), codi('23503'), 'l’operador tampoc pot esborrar una organització');
      await assert.rejects(desfet(db, [['update public.section_submissions set title=$2 where id=$1', [SIGNADA, 'Manteniment']]]), e => e.code === '23514' && e.constraint === 'section_submissions_autoria_org_valida', 'la CHECK impedix el manteniment sense JWT');
      await actor(db, E, "select * from public.xat_envia($1,$2,'text','hola',null,$3::jsonb)", [id(900), filE, JSON.stringify({ farciment: 'x'.repeat(1024 * 1024) })]);
      assert.equal((await db.query('select octet_length(metadades::text) as n from public.xat_missatges where id=$1', [id(900)])).rows[0].n, 1048593, 'T8');
      assert.equal(await prosrcMd5(db, 'public.delete_user()'), RESIDUS.funcions['delete_user()'].md5);
      assert.equal((await db.query("select has_table_privilege('anon','public.app_content','TRUNCATE') as t")).rows[0].t, true);
    });
    await db.query('delete from public.xat_missatges where id=$1', [id(900)]);

    /* ── La migració, dues vegades, amb un rol sense superusuari ──────────── */
    await db.query('create role sdp_editor_sql nosuperuser inherit; grant postgres to sdp_editor_sql');
    const sql = read(`supabase/migrations/${MIGRATION}`);
    t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
    const aplica = async () => {
      await db.query('set role sdp_editor_sql');
      try {
        assert.equal((await db.query("select rolsuper from pg_roles where rolname = current_user")).rows[0].rolsuper, false);
        await db.query(sql);
      } finally { await db.query('reset role'); }
    };
    await aplica();
    const primera = await empremta(db);
    await aplica();

    await t.test('Idempotent: la segona aplicació, sense superusuari, no canvia res', async () => {
      assert.deepEqual(await empremta(db), primera);
    });
    await db.query('reassign owned by sdp_editor_sql to postgres');

    /* Runbook 2.0: després de R22.2, les pendents existents 2610081400 (sencera) i 2610061450. */
    await t.test('Runbook: 2610081400 i 2610061450 senceres després de R22.2 tornen els cossos de Git', async () => {
      for (const fitxer of ['2610081400_grups_sense_mare.sql', '2610061450_capcalera_client_ip.sql']) {
        await db.query('set role sdp_editor_sql');
        try { await db.query(read(`supabase/migrations/${fitxer}`)); } finally { await db.query('reset role'); }
      }
      assert.notEqual(await prosrcMd5(db, 'private.can_create_group(uuid,uuid)'), RESIDUS.funcions['private.can_create_group(uuid,uuid)'].md5);
      assert.notEqual(await prosrcMd5(db, 'private.capcalera_client(text)'), RESIDUS.funcions['private.capcalera_client(text)'].md5);
      assert.equal(await prosrcMd5(db, 'public.xat_envia(uuid,uuid,text,text,uuid,jsonb)'), MD5_XAT_ENVIA_GIT, 'cap de les dues toca xat_envia');
    });
    const colla = (await actor(db, A, "select (public.create_organization($1,'group','Colla sintètica','r22-2-colla')->>'id') as id", [TOWN])).rows[0].id;
    await actor(db, A, "select * from public.desa_membre_organitzacio($1,$2,'persona','member')", [colla, B]);

    await t.test('R02: el fòssil, l’índex i el RESTRICT ja no hi són', async () => {
      assert.deepEqual(primera.index.map(i => i.indexname).filter(n => n.includes('one_owner')), []);
      assert.ok(!primera.disparadors.some(d => d.tgname === 'sdp_protegeix_propietari'));
      assert.ok(primera.disparadors.some(d => d.taula === 'organization_memberships' && d.tgname === 'sdp_una_propietaria'), 'l’invariant de Git es queda');
      assert.equal(primera.funcions.find(f => f.sig === 'sdp_protegeix_propietari()'), undefined);
      const fk = primera.restriccions.find(r => r.conname === 'organizations_created_by_fkey');
      assert.equal(fk.def, 'FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL');
      assert.equal(primera.columnes.find(c => c.attname === 'created_by').attnotnull, false);
    });

    await t.test('R02: titular, traspàs, invariant 23514 i esborrat d’una organització', async () => {
      assert.equal((await actor(db, A, 'select public.marca_titular_public($1,true) as v', [empresa])).rows[0].v, true);
      assert.equal((await actor(db, A, 'select public.estat_titular_public($1) as v', [empresa])).rows[0].v, true);
      await assert.rejects(desfet(db, [["update public.organization_memberships set role='owner' where organization_id=$1 and user_id=$2", [empresa, B]]]), codi('23514'), 'dos propietàries');
      assert.ok((await actor(db, A, 'select * from public.transfereix_propietat_organitzacio($1,$2)', [empresa, B])).rows.length >= 1);
      const rols = Object.fromEntries((await db.query('select user_id, role from public.organization_memberships where organization_id=$1', [empresa])).rows.map(r => [r.user_id, r.role]));
      assert.equal(rols[B], 'owner');
      assert.notEqual(rols[A], 'owner');
      assert.equal((await desfet(db, [['delete from public.organizations where id=$1 returning id', [empresaD]]])).rows.length, 1, 'l’operador ja pot esborrar-la');
    });

    await t.test('R02 + R11: la purga d’una propietària passa i delete_user() ja no existix', async () => {
      assert.deepEqual(await purga(db, D), { fet: true, compte: 0, pertinences: 0 });
      assert.equal((await db.query('select created_by from public.organizations where id=$1', [empresaD])).rows[0].created_by, null, 'ON DELETE SET NULL');
      await actor(db, A, "select public.demana_baixa('Baixa sintètica R22.2 de la propietària d’un grup')");
      assert.deepEqual(await purga(db, A), { fet: true, compte: 0, pertinences: 0 });
      assert.deepEqual((await db.query("select role from public.organization_memberships where organization_id=$1", [colla])).rows, [{ role: 'owner' }], 'el relleu del grup');
      assert.equal(await prosrcMd5(db, 'public.delete_user()'), null);
      await assert.rejects(actor(db, F, 'select public.delete_user()'), codi('42883'));
    });

    await t.test('R03: xat_envia de 2610081543 (md5), crea_fil_directe intacte i metadades buides', async () => {
      assert.equal(primera.funcions.find(f => f.sig === 'xat_envia(uuid,uuid,text,text,uuid,jsonb)').md5, MD5_XAT_ENVIA_GIT);
      assert.equal(primera.funcions.find(f => f.sig === 'crea_fil_directe(uuid,uuid,text)').md5, MD5_CREA_FIL_DIRECTE);
      assert.equal(RESIDUS.funcions['xat_envia(uuid,uuid,text,text,uuid,jsonb)'].md5 !== MD5_XAT_ENVIA_GIT, true, 'producció tenia un altre cos');
      await actor(db, E, "select * from public.xat_envia($1,$2,'text','hola',null,$3::jsonb)", [id(901), filE, JSON.stringify({ farciment: 'x'.repeat(1024 * 1024) })]);
      assert.equal((await db.query('select octet_length(metadades::text) as n from public.xat_missatges where id=$1', [id(901)])).rows[0].n, 2);
      const acl = primera.funcions.find(f => f.sig === 'xat_envia(uuid,uuid,text,text,uuid,jsonb)').acl;
      assert.ok(acl.includes('authenticated:EXECUTE') && !acl.includes('anon:') && !acl.includes('PUBLIC:'), acl);
    });

    await t.test('R03: el CHECK de 16384 bytes, validat quan cap fila el viola', async () => {
      const check = primera.restriccions.find(r => r.conname === 'xat_missatges_metadades_mida');
      assert.deepEqual([check.convalidated, check.def], [true, 'CHECK ((octet_length((metadades)::text) <= 16384))']);
      await assert.rejects(db.query("insert into public.xat_missatges(id,fil_id,usuari_id,text,metadades) values($1,$2,$3,'x',$4::jsonb)",
        [id(902), filE, E, JSON.stringify({ x: 'y'.repeat(17000) })]), e => e.code === '23514' && e.constraint === 'xat_missatges_metadades_mida');
    });

    await t.test('R03: amb files grans ja escrites, el CHECK es queda NOT VALID i avisa', async () => {
      await db.query('alter table public.xat_missatges drop constraint xat_missatges_metadades_mida');
      await db.query("insert into public.xat_missatges(id,fil_id,usuari_id,text,metadades) values($1,$2,$3,'x',$4::jsonb)", [id(903), filE, E, JSON.stringify({ x: 'y'.repeat(20000) })]);
      avisos.length = 0;
      await db.query(sql);
      assert.equal((await db.query("select convalidated from pg_constraint where conname='xat_missatges_metadades_mida'")).rows[0].convalidated, false);
      assert.ok(avisos.some(m => /xat_missatges_metadades_mida queda NOT VALID: 1 files/.test(m)), avisos.join(' | '));
      await db.query('delete from public.xat_missatges where id=$1', [id(903)]);
      await db.query(sql);
      assert.equal((await db.query("select convalidated from pg_constraint where conname='xat_missatges_metadades_mida'")).rows[0].convalidated, true);
    });

    await t.test('R05: revoca_consentiment torna a funcionar; el DEFAULT es queda (etapa A)', async () => {
      const col = primera.columnes.find(c => c.attname === 'consentiment_rgpd_at');
      assert.deepEqual([col.attnotnull, col.defecte], [false, 'now()']);
      const directori = async () => (await actor(db, F, 'select usuari_id from public.membres_del_poble($1,null,100)', [TOWN])).rows.map(r => r.usuari_id);
      assert.ok((await directori()).includes(B), 'abans de revocar, B és al directori del xat');
      await actor(db, B, "select public.revoca_consentiment('rgpd_acepta')");
      assert.deepEqual((await db.query("select consentiment_rgpd_at is null as retirat, (select count(*)::int from public.consentiments c where c.user_id=$1 and c.accio='revoca') as actes from public.profiles where id=$1", [B])).rows[0], { retirat: true, actes: 1 });
      assert.ok(!(await directori()).includes(B), 'qui revoca ix del directori (membres_del_poble de 2610081543)');
      assert.equal(primera.funcions.find(f => f.sig === 'membres_del_poble(uuid,text,integer)').md5, MD5_MEMBRES_DEL_POBLE_GIT);
    });

    await t.test('R12: admin_list_organizations respon i les dues tornen al cos de Git', async () => {
      const files = (await actor(db, E, 'select public.admin_list_organizations() as o', [], { aal: 'aal2' })).rows[0].o;
      assert.ok(Array.isArray(files) && files.length >= 2 && files.every(o => o.id && o.slug && o.kind));
      assert.equal(primera.funcions.find(f => f.sig === 'admin_list_organizations()').ret, 'json');
      assert.equal(primera.funcions.find(f => f.sig === 'admin_list_organizations()').md5, git['public.admin_list_organizations()']);
      assert.equal(primera.funcions.find(f => f.sig === 'admin_list_users(integer,integer)').md5, git['public.admin_list_users(integer,integer)']);
      const usuaris = (await actor(db, E, 'select public.admin_list_users(100,0) as u', [], { aal: 'aal2' })).rows[0].u;
      assert.deepEqual(Object.keys(usuaris[0]).sort(), ['created_at', 'email', 'id', 'last_sign_in_at']);
      await assert.rejects(actor(db, F, 'select public.admin_list_organizations()'), codi('42501'));
      await assert.rejects(actor(db, null, 'select public.admin_list_organizations()'), codi('42501'), 'anon no té EXECUTE');
      for (const sig of ['admin_list_organizations()', 'admin_list_users(integer,integer)']) {
        const acl = primera.funcions.find(f => f.sig === sig).acl;
        assert.ok(acl.includes('authenticated:EXECUTE') && !acl.includes('anon:') && !acl.includes('PUBLIC:'), `${sig} ${acl}`);
      }
    });

    await t.test('R13: cap TRUNCATE, REFERENCES, TRIGGER ni MAINTAIN per a anon i authenticated; SELECT intacte', async () => {
      const privs = Object.fromEntries(primera.privilegisTaules.map(r => [`${r.rol}:${r.priv}`, r.taules]));
      for (const rol of ['anon', 'authenticated']) for (const p of ['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) assert.equal(privs[`${rol}:${p}`], undefined, `${rol}:${p}`);
      assert.ok(privs['authenticated:SELECT'] > 0 && privs['anon:SELECT'] > 0);
      await assert.rejects(actor(db, null, 'truncate table public.app_content'), codi('42501'));
    });

    await t.test('R13: les heretades perden PUBLIC i anon; les de Git no canvien', async () => {
      const heretades = Object.keys(RESIDUS.funcions).filter(s => RESIDUS.funcions[s].heretada && s !== 'delete_user()' && s !== 'sdp_protegeix_propietari()');
      assert.equal(heretades.length, 16);
      for (const sig of heretades) {
        const fila = (await db.query("select has_function_privilege('anon', $1::regprocedure, 'EXECUTE') as anon, exists(select 1 from pg_proc p, aclexplode(p.proacl) a where p.oid = $1::regprocedure and a.grantee = 0) as public", [`public.${sig}`])).rows[0];
        assert.deepEqual(fila, { anon: false, public: false }, sig);
      }
      assert.equal((await db.query("select has_function_privilege('anon','public.llig_mur_public(uuid,text,integer,timestamptz,uuid,boolean)','EXECUTE') as x")).rows[0].x, true, 'una RPC anònima de Git continua oberta');
      assert.equal((await db.query("select has_function_privilege('authenticated','public.sanitize_html(text)','EXECUTE') as x")).rows[0].x, true, 'authenticated es queda (fora de l’abast de R13)');
    });

    await t.test('R13: una funció nova ja no naix executable per anon ni per PUBLIC', async () => {
      await db.query('create role sdp_sense_res nologin');
      await db.query('begin');
      try {
        await db.query('create function public.r22_2_prova_defecte() returns int language sql as $$ select 1 $$');
        const r = (await db.query("select has_function_privilege('anon','public.r22_2_prova_defecte()','EXECUTE') as anon, has_function_privilege('sdp_sense_res','public.r22_2_prova_defecte()','EXECUTE') as public, has_function_privilege('authenticated','public.r22_2_prova_defecte()','EXECUTE') as auth")).rows[0];
        assert.deepEqual(r, { anon: false, public: false, auth: true });
        await db.query('create table public.r22_2_prova_taula(x int)');
        assert.equal((await db.query("select has_table_privilege('anon','public.r22_2_prova_taula','TRUNCATE') or has_table_privilege('authenticated','public.r22_2_prova_taula','TRIGGER') as x")).rows[0].x, false);
      } finally { await db.query('rollback'); }
      /* Per què la forma global: un REVOKE per esquema no lleva el PUBLIC global de PostgreSQL. */
      await db.query('begin');
      try {
        await db.query('alter default privileges for role postgres grant execute on functions to public');
        await db.query('alter default privileges for role postgres in schema public revoke execute on functions from public');
        await db.query('create function public.r22_2_prova_esquema() returns int language sql as $$ select 1 $$');
        assert.equal((await db.query("select has_function_privilege('sdp_sense_res','public.r22_2_prova_esquema()','EXECUTE') as x")).rows[0].x, true);
      } finally { await db.query('rollback'); }
      await db.query('drop role sdp_sense_res');
    });

    await t.test('R14: manteniment sense JWT i service_role, però la frontera R19 es queda', async () => {
      assert.equal(primera.restriccions.find(r => r.conname === 'section_submissions_autoria_org_valida'), undefined);
      assert.ok(primera.disparadors.some(d => d.tgname === 'zz_sdp_autoria_org_valida' && d.funcio === 'private.section_submissions_autoria_org_valida()'));
      /* B és ara la propietària de l'empresa i la publicació la va signar A, que ja no hi és. */
      assert.equal((await desfet(db, [['update public.section_submissions set title=$2 where id=$1 returning id', [SIGNADA, 'Manteniment de l’editor SQL']]])).rows.length, 1, 'editor SQL');
      assert.equal((await desfet(db, [["select set_config('request.jwt.claims','{\"role\":\"service_role\"}',true)"], ['update public.section_submissions set title=$2 where id=$1 returning id', [SIGNADA, 'Servidor']]])).rows.length, 1, 'service_role');
      await assert.rejects(actor(db, F, 'update public.section_submissions set title=$2 where id=$1', [SIGNADA, 'Definer amb un JWT aliè'], { setRole: false }),
        e => e.code === '23514' && e.constraint === 'section_submissions_autoria_org_valida', 'R19: un UPDATE privilegiat amb el JWT d’algú que no administra l’entitat');
      await assert.rejects(actor(db, null, 'update public.section_submissions set title=$2 where id=$1', [SIGNADA, 'Anònim'], { setRole: false }),
        e => e.code === '23514', 'una petició anònima no és de servidor');
      assert.equal((await actor(db, B, 'update public.section_submissions set title=$2 where id=$1 returning id', [SIGNADA, 'La propietària vigent'], { setRole: false })).rows.length, 1);
      const nova = id(701);
      await assert.rejects(actor(db, F, `insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload,author_org_id)
        values($1,$2,$3,'mur','Signatura aliena','','{"content":"<p>x</p>","visibility":"public"}'::jsonb,$4)`, [nova, TOWN, F, empresa]), e => e.code === '23514' || e.code === '42501');
    });

    await t.test('R14: notes.icon i notes.publish_date, i una nota del client les desa', async () => {
      assert.deepEqual(primera.columnes.filter(c => c.taula === 'notes').map(c => [c.attname, c.tipus]), [['icon', 'text'], ['publish_date', 'timestamp with time zone']]);
      const fila = (await actor(db, F, `insert into public.notes(id,tenant_id,owner_user_id,title,content,icon,publish_date)
        values($1,$2,$3,'Nota sintètica','<p>Text</p>','🌳','2026-11-20T00:00:00.000Z') returning icon, publish_date`, [id(800), TOWN, F])).rows[0];
      assert.equal(fila.icon, '🌳');
      assert.equal(new Date(fila.publish_date).toISOString(), '2026-11-20T00:00:00.000Z');
    });

    await t.test('Reaplicació: 2611011500 i 2609291210 desfan R22.2; ordre_desplegament.json i el Runbook ho diuen', async () => {
      const ordre = JSON.parse(read('supabase/ordre_desplegament.json'));
      const estatR22 = async () => ({
        check: (await db.query("select count(*)::int as n from pg_constraint where conname='section_submissions_autoria_org_valida'")).rows[0].n,
        membres: await prosrcMd5(db, 'public.membres_del_poble(uuid,text,integer)')
      });
      const net = await estatR22();
      assert.deepEqual(net, { check: 0, membres: MD5_MEMBRES_DEL_POBLE_GIT });
      for (const si of ['2611011500', '2609291210']) {
        assert.ok(ordre.reaplicacio.some(r => r.si === si && r.llavors.includes('20261114000100')), `reaplicacio ${si} → 20261114000100`);
        await db.query(plan.migrations.find(m => m.file.startsWith(`${si}_`)).body);
      }
      assert.notDeepEqual(await estatR22(), net, 'les dues desfan R22.2');
      await db.query(sql);
      assert.deepEqual(await estatR22(), net, 'tornar a aplicar R22.2 ho arregla');
      /* Runbook §17: les absents a producció que cap pas no nomenava (ref_local/diff_prod_vs_git.json). */
      const runbook = read('supabase/README.md').split('\n').find(l => l.includes('17. Onada R22'));
      for (const v of ['2610101900', '2611110110', '2611110455', '2611110010', 'organizations_town_name_llargaria', 'towns_comarca_llargaria']) {
        assert.ok(runbook.includes(v), `Runbook §17: ${v}`);
      }
    });
  } finally {
    await cluster.close();
  }
});
