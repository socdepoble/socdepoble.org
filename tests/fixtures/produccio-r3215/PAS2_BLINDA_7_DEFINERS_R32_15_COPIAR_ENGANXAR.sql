-- ============================================================================
-- SÓC DE POBLE · SUPABASE PRODUCCIÓ (R32.15) · PAS 2 DE 2 (FINAL)
-- Blindatge tipat pg_catalog dels 7 SECURITY DEFINER fòssils heretats
-- + Certificació final de postimatges (idempotent i transaccional)
-- ============================================================================
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
set local search_path = public;
select pg_catalog.pg_advisory_xact_lock(1935960372,1732150000);

do $r3215_caller$
begin
 if (pg_catalog.current_schemas(true))[1] OPERATOR(pg_catalog.<>) 'pg_catalog'::pg_catalog.name
  and not (pg_catalog.left((pg_catalog.current_schemas(true))[1]::pg_catalog.text,8) OPERATOR(pg_catalog.=) 'pg_temp_'::pg_catalog.text
   and (pg_catalog.current_schemas(true))[2] OPERATOR(pg_catalog.=) 'pg_catalog'::pg_catalog.name) then
  raise exception 'SDP-R3215-CALLER: namespace no revisat' using errcode='55000';
 end if;
 if pg_catalog.to_regrole('anon') is null or pg_catalog.to_regrole('authenticated') is null then
  raise exception 'SDP-R3215-ROLES: falta anon/authenticated' using errcode='55000';
 end if;
end $r3215_caller$;

do $r3215_hardening$
declare specs pg_catalog.jsonb:=$r3215_spec$[{"signature":"public.check_market_rate_limit()","qualifiedSignature":"public.check_market_rate_limit()","argnames":null,"result":"trigger","defaults":null,"defaultCount":0,"bodyHashes":["599a9cefe39382799067d74dbcbb6d0c4cf661f790cc832f2b0dc3782881422d","6f5707f66ff85992d262c9058180ad8cb3f0c1b28ebf8d90e55f0f4e55cfe242","0d0bb652a4090ab4098b841a2914402cf954a30af694e26e8a49b055f344ec4a"],"finalBodySHA256":"0d0bb652a4090ab4098b841a2914402cf954a30af694e26e8a49b055f344ec4a","ddl":"CREATE OR REPLACE FUNCTION public.check_market_rate_limit() RETURNS pg_catalog.trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $r3215_body$\nDECLARE\n    item_count pg_catalog.int4;\n    limit_count pg_catalog.int4 := 3; -- Max 3 items\n    window_min pg_catalog.int4 := 15; -- per 15 minutes\nBEGIN\n    SELECT pg_catalog.count(*) INTO item_count\n    FROM public.market_items\n    WHERE author_user_id = auth.uid()\n    AND created_at > (pg_catalog.now() - (window_min || ' minutes')::pg_catalog.interval);\n\n    IF item_count >= limit_count THEN\n        RAISE EXCEPTION 'Rate limit reached for market. Please wait a few minutes before adding more items.'\n        USING ERRCODE = 'P0001';\n    END IF;\n\n    RETURN NEW;\nEND;\n$r3215_body$;","relation":"public.market_items","columns":{"author_user_id":"uuid","created_at":"timestamptz"},"relationKind":"r"},{"signature":"public.clean_expired_push_subscriptions()","qualifiedSignature":"public.clean_expired_push_subscriptions()","argnames":null,"result":"void","defaults":null,"defaultCount":0,"bodyHashes":["f0e399b16193a92ecb0043e343c42fab95eabe09fd83ed86f68b3335258d23b3","738e03edbf6b05979acc1efe377abaf1170e27fc5aed04308045a805c9bb34c1","48c45d8c2823e5910ecd88b56fcd8e7d550b7aa6d3e7d58181861b194e6f6627"],"finalBodySHA256":"48c45d8c2823e5910ecd88b56fcd8e7d550b7aa6d3e7d58181861b194e6f6627","ddl":"CREATE OR REPLACE FUNCTION public.clean_expired_push_subscriptions() RETURNS pg_catalog.void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $r3215_body$\nBEGIN\n    -- Delete subscriptions not used in 90 days\n    DELETE FROM public.push_subscriptions\n    WHERE last_used_at < pg_catalog.now() - pg_catalog.interval '90 days';\nEND;\n$r3215_body$;","relation":"public.push_subscriptions","columns":{"last_used_at":"timestamptz"},"relationKind":"r"},{"signature":"public.log_push_notification(uuid,text,jsonb,boolean,text)","qualifiedSignature":"public.log_push_notification(pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.bool,pg_catalog.text)","argnames":["p_user_id","p_type","p_payload","p_success","p_error"],"result":"uuid","defaults":"NULL::text","defaultCount":1,"bodyHashes":["45c55022e0c99cfab714b5d08015a4a792413296302c7e7239f4c9f5dc33f276","13c3ed3af2bc420ba3f00a19697c0a1e8184b2f470df35b91016d1d8199c847a","531a47e2eb51466f672f4a1c4546e3a69a340596cd8fbead0bfc97e429ab6400"],"finalBodySHA256":"531a47e2eb51466f672f4a1c4546e3a69a340596cd8fbead0bfc97e429ab6400","ddl":"CREATE OR REPLACE FUNCTION public.log_push_notification(p_user_id pg_catalog.uuid, p_type pg_catalog.text, p_payload pg_catalog.jsonb, p_success pg_catalog.bool, p_error pg_catalog.text DEFAULT NULL::pg_catalog.text) RETURNS pg_catalog.uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $r3215_body$\nDECLARE\n    v_log_id pg_catalog.uuid;\nBEGIN\n    INSERT INTO public.push_notifications_log (user_id, notification_type, payload, success, error_message)\n    VALUES (p_user_id, p_type, p_payload, p_success, p_error)\n    RETURNING id INTO v_log_id;\n    \n    RETURN v_log_id;\nEND;\n$r3215_body$;","relation":"public.push_notifications_log","columns":{"id":"uuid","user_id":"uuid","notification_type":"text","payload":"jsonb","success":"bool","error_message":"text"},"relationKind":"r"},{"signature":"public.mark_messages_as_read(uuid,uuid)","qualifiedSignature":"public.mark_messages_as_read(pg_catalog.uuid,pg_catalog.uuid)","argnames":["conv_id","user_id"],"result":"void","defaults":null,"defaultCount":0,"bodyHashes":["4dc78e7017bbd0b445794728e9bda4dd1ec761c4c24c90797d838aa9b219a467","7cf96084fb24165c0d5e8275d1a9491b6460e9a1c9f8e5b64f9e1e85b8d541a2","a6b04887c6700c2f2434c71f87a7d75a6a1dec12e39d415859ba4787314d93f8"],"finalBodySHA256":"a6b04887c6700c2f2434c71f87a7d75a6a1dec12e39d415859ba4787314d93f8","ddl":"CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conv_id pg_catalog.uuid, user_id pg_catalog.uuid) RETURNS pg_catalog.void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $r3215_body$\nBEGIN\n    UPDATE public.messages\n    SET read_at = pg_catalog.now()\n    WHERE conversation_id = conv_id\n    AND sender_id != user_id\n    AND read_at IS NULL;\nEND;\n$r3215_body$;","relation":"public.messages","columns":{"conversation_id":"uuid","sender_id":"uuid","read_at":"timestamptz"},"relationKind":"r"},{"signature":"public.omega_invalidate_stale_translations()","qualifiedSignature":"public.omega_invalidate_stale_translations()","argnames":null,"result":"trigger","defaults":null,"defaultCount":0,"bodyHashes":["e5b0539b43ebc815188c0f6cc31df31992fe3477cfc8238e2496d9a12c7f1988"],"finalBodySHA256":"e5b0539b43ebc815188c0f6cc31df31992fe3477cfc8238e2496d9a12c7f1988","ddl":"CREATE OR REPLACE FUNCTION public.omega_invalidate_stale_translations() RETURNS pg_catalog.trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $r3215_body$\n    BEGIN\n        -- Si el contenido ha mutado, purgamos las traducciones cacheadas\n        IF OLD.content IS DISTINCT FROM NEW.content THEN\n            DELETE FROM public.post_translations WHERE post_id = NEW.uuid;\n            RAISE USING MESSAGE = 'Traducciones eliminadas para el post mutado: ' || NEW.uuid;\n        END IF;\n        RETURN NEW;\n    END;\n    $r3215_body$;","relation":"public.post_translations","columns":{"post_id":"uuid"},"relationKind":"r"},{"signature":"public.omega_set_default_parent_id()","qualifiedSignature":"public.omega_set_default_parent_id()","argnames":null,"result":"trigger","defaults":null,"defaultCount":0,"bodyHashes":["90109206137887a8ef4c89ff7c5951c5750e9a97151fd683bd4cf2fa9874b61b"],"finalBodySHA256":"90109206137887a8ef4c89ff7c5951c5750e9a97151fd683bd4cf2fa9874b61b","ddl":"CREATE OR REPLACE FUNCTION public.omega_set_default_parent_id() RETURNS pg_catalog.trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $r3215_body$\n    BEGIN\n        IF NEW.parent_id IS NULL THEN\n            NEW.parent_id := NEW.id;\n        END IF;\n        RETURN NEW;\n    END;\n    $r3215_body$;","relation":null,"columns":{},"relationKind":"r"},{"signature":"public.refresh_entity_member_map()","qualifiedSignature":"public.refresh_entity_member_map()","argnames":null,"result":"trigger","defaults":null,"defaultCount":0,"bodyHashes":["c89e84967c7f53cfab90b1ea21863d8d85a6d78d877f1ff412d912e9353bb4ba","d98979ae60610521159880428d3f2df27f350513ec65d14352217aab637a3dd4"],"finalBodySHA256":"d98979ae60610521159880428d3f2df27f350513ec65d14352217aab637a3dd4","ddl":"CREATE OR REPLACE FUNCTION public.refresh_entity_member_map() RETURNS pg_catalog.trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $r3215_body$\nBEGIN\n    REFRESH MATERIALIZED VIEW CONCURRENTLY public.entity_member_map;\n    RETURN NULL;\nEND;\n$r3215_body$;","relation":"public.entity_member_map","columns":{},"relationKind":"m"}]$r3215_spec$::pg_catalog.jsonb;
 p record; spec pg_catalog.jsonb; target pg_catalog.jsonb; column_spec record;
 targets pg_catalog.jsonb:='[]'::pg_catalog.jsonb; signature pg_catalog.text; rel pg_catalog.oid;
 body_hash pg_catalog.text; before_auth pg_catalog.bool; before_service pg_catalog.bool;
begin
 for p in select x.* from pg_catalog.pg_proc x join pg_catalog.pg_namespace n on n.oid=x.pronamespace
  where x.prosecdef and n.nspname in ('public','private')
   and (not coalesce(x.proconfig @> array['search_path=""']::pg_catalog.text[],false)
    and not coalesce(x.proconfig @> array['search_path=']::pg_catalog.text[],false)
    or exists(select 1 from pg_catalog.jsonb_array_elements(specs) s where pg_catalog.to_regprocedure(s->>'qualifiedSignature')=x.oid))
  order by x.oid loop
  signature:=pg_catalog.format('%I.%I(%s)',(select nspname from pg_catalog.pg_namespace where oid=p.pronamespace),p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid));
  select value into spec from pg_catalog.jsonb_array_elements(specs) where pg_catalog.to_regprocedure(value->>'qualifiedSignature')=p.oid;
  if spec is null then raise exception 'SDP-R3215-UNKNOWN: %',signature using errcode='55000'; end if;
  body_hash:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex');
  if not exists(select 1 from pg_catalog.jsonb_array_elements_text(spec->'bodyHashes') h where h=body_hash)
   or p.prokind<>'f' or p.prolang<>(select oid from pg_catalog.pg_language where lanname='plpgsql')
   or p.prorettype<>pg_catalog.to_regtype('pg_catalog.'||(spec->>'result')) or p.proretset or p.provariadic<>0
   or p.proisstrict or p.proleakproof or p.proparallel<>'u' or p.provolatile<>'v' or p.prosupport<>0
   or p.proargmodes is not null or pg_catalog.to_jsonb(p.proargnames) is distinct from nullif(spec->'argnames','null'::pg_catalog.jsonb)
   or p.pronargdefaults<>(spec->>'defaultCount')::pg_catalog.int4
   or pg_catalog.pg_get_expr(p.proargdefaults,0) is distinct from (spec->>'defaults')
   or (p.proconfig is not null and p.proconfig<>array['search_path=public']::pg_catalog.text[]
    and p.proconfig<>array['search_path=""']::pg_catalog.text[] and p.proconfig<>array['search_path=']::pg_catalog.text[]) then
   raise exception 'SDP-R3215-UNSAFE: %',signature using errcode='55000';
  end if;
  if p.proowner in (pg_catalog.to_regrole('anon'),pg_catalog.to_regrole('authenticated'),pg_catalog.to_regrole('service_role'))
   or pg_catalog.pg_has_role('anon',p.proowner,'MEMBER') or pg_catalog.pg_has_role('authenticated',p.proowner,'MEMBER')
   or exists(select 1 from pg_catalog.pg_namespace n where n.oid=p.pronamespace
    and (not pg_catalog.has_schema_privilege(p.proowner,n.oid,'USAGE') or pg_catalog.has_schema_privilege('anon',n.oid,'CREATE') or pg_catalog.has_schema_privilege('authenticated',n.oid,'CREATE')))
   or exists(select 1 from pg_catalog.pg_depend d where d.classid='pg_catalog.pg_proc'::pg_catalog.regclass and d.objid=p.oid
     and d.refclassid='pg_catalog.pg_extension'::pg_catalog.regclass and d.deptype='e')
   or exists(select 1 from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
    where a.grantee<>p.proowner and (a.is_grantable or a.grantee not in (0,pg_catalog.to_regrole('anon'),pg_catalog.to_regrole('authenticated'),pg_catalog.to_regrole('service_role')))) then
   raise exception 'SDP-R3215-AUTHORITY: %',signature using errcode='55000';
  end if;
  if spec->>'relation' is not null then
   rel:=pg_catalog.to_regclass(spec->>'relation');
   if rel is not null then
    if not exists(select 1 from pg_catalog.pg_class c where c.oid=rel and c.relowner in (p.proowner, coalesce(pg_catalog.to_regrole('supabase_admin'), p.proowner)) and c.relkind=(spec->>'relationKind')::pg_catalog."char") then
     raise exception 'SDP-R3215-RELATION: %',signature using errcode='55000';
    end if;
    for column_spec in select key,value from pg_catalog.jsonb_each_text(spec->'columns') loop
     if not exists(select 1 from pg_catalog.pg_attribute a where a.attrelid=rel and a.attname=column_spec.key
      and a.attnum>0 and not a.attisdropped and (
       a.atttypid=pg_catalog.to_regtype('pg_catalog.'||column_spec.value)
       or (column_spec.value='text' and a.atttypid=pg_catalog.to_regtype('pg_catalog.varchar'))
      )) then
      raise exception 'SDP-R3215-COLUMN: % (%)',signature,column_spec.key using errcode='55000';
     end if;
    end loop;
   end if;
  end if;
  before_auth:=exists(select 1 from pg_catalog.aclexplode(p.proacl) a where a.grantee=pg_catalog.to_regrole('authenticated') and a.privilege_type='EXECUTE');
  before_service:=exists(select 1 from pg_catalog.aclexplode(p.proacl) a where a.grantee=pg_catalog.to_regrole('service_role') and a.privilege_type='EXECUTE');
  targets:=targets||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('oid',p.oid,'signature',spec->>'qualifiedSignature',
   'before',pg_catalog.to_jsonb(p)-'proconfig','spec',spec,'authenticated',before_auth,'service_role',before_service));
 end loop;
 for target in select value from pg_catalog.jsonb_array_elements(targets) loop
  signature:=target->>'signature';spec:=target->'spec';
  execute pg_catalog.format('alter function %s set search_path=%L',signature,'');
  select x.* into p from pg_catalog.pg_proc x where x.oid=pg_catalog.to_regprocedure(signature);
  if p.oid is null or (pg_catalog.to_jsonb(p)-'proconfig') is distinct from target->'before' then
   raise exception 'SDP-R3215-CONCURRENT: %',signature using errcode='40001';
  end if;
  execute spec->>'ddl';
  execute pg_catalog.format('revoke all on function %s from public,anon',signature);
  select x.* into p from pg_catalog.pg_proc x where x.oid=pg_catalog.to_regprocedure(signature);
  if p.oid<>(target->>'oid')::pg_catalog.oid or p.proowner<>(target->'before'->>'proowner')::pg_catalog.oid
   or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')<>spec->>'finalBodySHA256'
   or (p.proconfig<>array['search_path=""']::pg_catalog.text[] and p.proconfig<>array['search_path=']::pg_catalog.text[])
   or not p.prosecdef
   or pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE')
   or exists(select 1 from pg_catalog.aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE')
   or (target->>'authenticated')::pg_catalog.bool is distinct from exists(select 1 from pg_catalog.aclexplode(p.proacl) a where a.grantee=pg_catalog.to_regrole('authenticated') and a.privilege_type='EXECUTE')
   or (target->>'service_role')::pg_catalog.bool is distinct from exists(select 1 from pg_catalog.aclexplode(p.proacl) a where a.grantee=pg_catalog.to_regrole('service_role') and a.privilege_type='EXECUTE') then
   raise exception 'SDP-R3215-POSTCONDITION: %',signature using errcode='55000';
  end if;
 end loop;
end $r3215_hardening$;
notify pgrst,'reload schema';
commit;

-- Certificat final de postverificació per al rebut auditable R32.15
select pg_catalog.jsonb_build_object(
  'pas2_7_definers_blindats_ok', true,
  'tots_136_search_path_buit', (
    select pg_catalog.bool_and(
      coalesce(p.proconfig @> array['search_path=""']::pg_catalog.text[], false)
      or coalesce(p.proconfig @> array['search_path=']::pg_catalog.text[], false)
    )
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef and n.nspname in ('public', 'private')
  ),
  'registra_denuncia_diligent_sha256', (
    select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc, 'UTF8')), 'hex')
    from pg_catalog.pg_proc p
    where p.oid = pg_catalog.to_regprocedure('public.registra_denuncia_diligent(uuid,text,text,uuid)')
  ),
  'postimatges_7_definers', (
    select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'sig', pg_catalog.format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)),
        'prosrc_sha256', pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc, 'UTF8')), 'hex'),
        'acl', p.proacl::pg_catalog.text,
        'public_exec', exists(select 1 from pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'),
        'anon_exec', pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
      )
      order by p.proname
    )
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'check_market_rate_limit',
        'clean_expired_push_subscriptions',
        'log_push_notification',
        'mark_messages_as_read',
        'omega_invalidate_stale_translations',
        'omega_set_default_parent_id',
        'refresh_entity_member_map'
      )
  )
) as resultat_pas2_final;
