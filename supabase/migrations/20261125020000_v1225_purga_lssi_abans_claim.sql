-- v1.2.25 · Successor atòmic C1-05. No reescriu cap migració anterior.
-- Depén de 20261125010000 (protecció LSSI) i de 2611110100 (dues cues).
-- La reclamació descarta els adjunts protegits abans de sumar intents.
-- La guarda de DELETE de C1 continua vigent. Una protecció apareguda després
-- del claim encara pot refusar el lot; no hi ha lock entre PostgreSQL i HTTP.
-- El SHA és una precondició local del cos conegut, no una firma ni una prova
-- de Storage físic. Coordineu els escriptors DDL fora d'aquesta transacció.
-- Sense search_path de sessió: els blocs DO qualifiquen cada nom i la funció
-- fixa el seu propi search_path buit. El DDL de la rutina és de nivell
-- superior (porta RLS R6); la postcondició compara la fila de pg_proc
-- anterior, desada en un paràmetre local de la transacció.
begin;

do $purga_lssi$
declare
  v_before pg_catalog.pg_proc%rowtype;
  v_dependency pg_catalog.pg_proc%rowtype;
  v_owner_acl pg_catalog.aclitem;
  v_service_acl pg_catalog.aclitem;
  v_body_sha pg_catalog.text;
begin
  select p.* into v_before from pg_catalog.pg_proc p
    where p.oid = pg_catalog.to_regprocedure('public.purga_fitxers_reclama(integer)');
  if not found then
    raise exception 'SDP-PURGA-LSSI-ABSENT: public.purga_fitxers_reclama(integer)' using errcode = '55000';
  end if;
  v_owner_acl := pg_catalog.format('%I=X/%I', current_user, current_user)::pg_catalog.aclitem;
  v_service_acl := pg_catalog.format('service_role=X/%I', current_user)::pg_catalog.aclitem;
  if pg_catalog.pg_get_userbyid(v_before.proowner) <> current_user
    or v_before.prokind <> 'f' or not v_before.prosecdef or not v_before.proretset
    or v_before.provolatile <> 'v' or v_before.proisstrict or v_before.proleakproof
    or v_before.proparallel <> 'u'
    or (select l.lanname from pg_catalog.pg_language l where l.oid = v_before.prolang) <> 'plpgsql'
    or v_before.proconfig is distinct from array['search_path=""']::pg_catalog.text[]
    or pg_catalog.pg_get_function_arguments(v_before.oid) <> 'p_limit integer DEFAULT 50'
    or pg_catalog.pg_get_function_result(v_before.oid) <> 'TABLE(id bigint, bucket_id text, nom text, intents integer)'
    or v_before.proacl is null or pg_catalog.cardinality(v_before.proacl) <> 2
    or not (v_before.proacl @> array[v_owner_acl, v_service_acl]) then
    raise exception 'SDP-PURGA-LSSI-CONTRACT: public.purga_fitxers_reclama(integer)' using errcode = '55000';
  end if;
  v_body_sha := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_before.prosrc, 'UTF8')), 'hex');
  if v_body_sha not in (
    '909093eec4d0cc86bc4cf378412a4401d4f2cc1c0434aa9faed31ff9ed250abb',
    '2d16822a48ecd8b1aa68f312e11059b7a47f560364647d3c4bb52a9506ad2553'
  ) then
    raise exception 'SDP-PURGA-LSSI-DRIFT: public.purga_fitxers_reclama(integer)' using errcode = '55000';
  end if;

  select p.* into v_dependency from pg_catalog.pg_proc p
    where p.oid = pg_catalog.to_regprocedure('private.xat_adjunt_protegit_lssi(uuid)');
  if not found or pg_catalog.pg_get_userbyid(v_dependency.proowner) <> current_user
    or v_dependency.prokind <> 'f' or v_dependency.proretset or v_dependency.proisstrict
    or v_dependency.proleakproof or v_dependency.proparallel <> 'u'
    or (select l.lanname from pg_catalog.pg_language l where l.oid = v_dependency.prolang) <> 'sql'
    or not v_dependency.prosecdef or v_dependency.provolatile <> 's'
    or v_dependency.proconfig is distinct from array['search_path=""']::pg_catalog.text[]
    or v_dependency.proacl is distinct from array[v_owner_acl]
    or pg_catalog.pg_get_function_arguments(v_dependency.oid) <> 'p_id uuid'
    or pg_catalog.pg_get_function_result(v_dependency.oid) <> 'boolean'
    or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_dependency.prosrc, 'UTF8')), 'hex')
      <> '650f42f72f4c39a68836b41ed498b42dc3b7eb8754bc77814f385d6e4e064c85' then
    raise exception 'SDP-PURGA-LSSI-DEPENDENCY: private.xat_adjunt_protegit_lssi(uuid)' using errcode = '55000';
  end if;
  select p.* into v_dependency from pg_catalog.pg_proc p
    where p.oid = pg_catalog.to_regprocedure('private.xat_id_de_ruta(text)');
  if not found or pg_catalog.pg_get_userbyid(v_dependency.proowner) <> current_user
    or v_dependency.prokind <> 'f' or v_dependency.proretset or v_dependency.proisstrict
    or v_dependency.proleakproof or v_dependency.proparallel <> 'u'
    or (select l.lanname from pg_catalog.pg_language l where l.oid = v_dependency.prolang) <> 'sql'
    or v_dependency.prosecdef or v_dependency.provolatile <> 'i'
    or v_dependency.proconfig is distinct from array['search_path=""']::pg_catalog.text[]
    or v_dependency.proacl is distinct from array[v_owner_acl]
    or pg_catalog.pg_get_function_arguments(v_dependency.oid) <> 'p_ruta text'
    or pg_catalog.pg_get_function_result(v_dependency.oid) <> 'uuid'
    or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_dependency.prosrc, 'UTF8')), 'hex')
      <> '1d2c08ee8510e0fa6826813a5daef7bb6ec9321123a149a51bb867f4a27d1da3' then
    raise exception 'SDP-PURGA-LSSI-DEPENDENCY: private.xat_id_de_ruta(text)' using errcode = '55000';
  end if;

  -- Fila anterior sense el cos: la postcondició la compara sencera després del
  -- DDL. El paràmetre és local de la transacció i no ix d'esta migració.
  perform pg_catalog.set_config('sdp_v1225.purga_lssi_abans',
    (pg_catalog.to_jsonb(v_before) - 'prosrc')::pg_catalog.text, true);
end $purga_lssi$;

-- DDL constant, procedent del cos canònic revisat; cap pg_get_functiondef
-- del destí es concatena o executa com a autoritat. CREATE OR REPLACE conserva
-- OID, propietari i ACL; la postcondició refusa qualsevol altra deriva.
CREATE OR REPLACE FUNCTION public.purga_fitxers_reclama(p_limit integer DEFAULT 50)
 RETURNS TABLE(id bigint, bucket_id text, nom text, intents integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  v_maxim integer;
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 200));
  v_n integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PURGA-000: només el servidor.' using errcode = '42501';
  end if;
  begin
    select greatest(1, least(a.valor::integer, 100)) into v_maxim
    from private.ajustos a where a.clau = 'purga_fitxers_max_intents';
  exception when invalid_text_representation or numeric_value_out_of_range then
    v_maxim := null;
  end;
  v_maxim := coalesce(v_maxim, 10);

  -- Una referència d'entitat pot haver aparegut des de la baixa. Un objecte
  -- diferent al mateix nom no es reclama, encara que arribara de fora.
  return query
  with triades as (
    select c.id from public.cua_purga_storage_ugc c
    where not c.referenciat and c.intents < v_maxim
      and (c.bucket_id <> 'xat_adjunts'
        or not private.xat_adjunt_protegit_lssi(private.xat_id_de_ruta(c.nom)))
      and (c.ultim_intent_al is null
        or c.ultim_intent_al <= now() - least(make_interval(mins => (5 * 2 ^ least(c.intents, 9))::integer), interval '1 day'))
      and private.storage_ugc_bucket_no_versionat(c.bucket_id)
      and not private.referencia_storage_ugc(c.bucket_id, c.nom, c.user_id)
      and not exists (select 1 from storage.objects o
        where o.bucket_id = c.bucket_id and o.name = c.nom
          and (o.id <> c.object_id or o.version is distinct from c.object_version
            or coalesce(o.owner_id, o.owner::text) is distinct from c.user_id::text))
    order by c.creat_al, c.id limit v_limit for update of c skip locked
  )
  update public.cua_purga_storage_ugc p
     set intents = p.intents + 1, ultim_intent_al = now()
    from triades t where p.id = t.id
  returning p.id, p.bucket_id, p.nom, p.intents;
  get diagnostics v_n = row_count;

  return query
  with triades as (
    select c.id from private.purga_storage_pendent c
    where c.bucket_id = 'xat_adjunts' and not c.referenciat and c.feta_al is null and c.intents < v_maxim
      and not private.xat_adjunt_protegit_lssi(private.xat_id_de_ruta(c.nom))
      and (c.ultim_intent_al is null
        or c.ultim_intent_al <= now() - least(make_interval(mins => (5 * 2 ^ least(c.intents, 9))::integer), interval '1 day'))
      and private.storage_ugc_bucket_no_versionat(c.bucket_id)
      and not exists (select 1 from public.cua_purga_storage_ugc nou
        where nou.bucket_id = c.bucket_id and nou.nom = c.nom)
    order by c.creat_al, c.id limit (v_limit - v_n) for update of c skip locked
  )
  update private.purga_storage_pendent p
     set intents = p.intents + 1, ultim_intent_al = now()
    from triades t where p.id = t.id
  returning p.id, p.bucket_id, p.nom, p.intents;
end;
$function$;

do $purga_lssi_post$
declare
  v_after pg_catalog.pg_proc%rowtype;
  v_abans pg_catalog.text := pg_catalog.current_setting('sdp_v1225.purga_lssi_abans', true);
begin
  select p.* into v_after from pg_catalog.pg_proc p
    where p.oid = pg_catalog.to_regprocedure('public.purga_fitxers_reclama(integer)');
  if not found or v_abans is null or v_abans = ''
    or (pg_catalog.to_jsonb(v_after) - 'prosrc') is distinct from v_abans::pg_catalog.jsonb
    or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_after.prosrc, 'UTF8')), 'hex') <> '2d16822a48ecd8b1aa68f312e11059b7a47f560364647d3c4bb52a9506ad2553' then
    raise exception 'SDP-PURGA-LSSI-PRESERVE: contracte, propietari, ACL o configuració alterats' using errcode = '55000';
  end if;
  perform pg_catalog.set_config('sdp_v1225.purga_lssi_abans', '', true);
end $purga_lssi_post$;

commit;
