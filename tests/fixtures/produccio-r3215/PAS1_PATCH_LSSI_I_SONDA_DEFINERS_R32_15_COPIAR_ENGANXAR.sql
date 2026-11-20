-- R32.15 · Pegat incremental P2 de registra_denuncia_diligent (Gauntlet v1.2.11).
--
-- Defecte: la RPC diligent descartava el rebut de denuncia_publicacio_mur. Quan
-- el disparador denuncies_abans_insercio ja trobava una denúncia pendent de la
-- mateixa persona sobre el mateix objecte (row_count 0), tornava
-- repetida:false i el detall nou es perdia sense rastre.
--
-- Correcció: el rebut de denuncia_publicacio_mur decidix «repetida». Si la
-- denúncia ja existia, el detall nou (i el motiu triat) es conserva com a
-- ampliació append-only a private.r3213_lssi_audit, sense reescriure el text
-- original de la denúncia ni duplicar-lo al rebut. Com a màxim 5 ampliacions
-- distintes per denúncia i persona; les repeticions literals no s'apunten.
-- Gauntlet R32.15 (escèptic SQL): el camí deduplicat no passava per cap quota
-- (el disparador torna null abans dels límits), així que s'admeten com a màxim
-- 20 rebuts per persona i denúncia, el primer inclòs (SDP-LSSI-429 després); la denúncia
-- es busca pel tipus exacte de la publicació, amb FOR SHARE (una decisió
-- humana simultània la treu de «pendent» i la RPC no torna un rebut d'un cas
-- tancat), i una denúncia nova només pot ser la d'esta transacció (now()).
-- El DTO del rebut no canvia (id, estat, versio, repetida): el client v1.2.11
-- en producció el continua acceptant.
--
-- Supabase Cloud (PostgreSQL 17.6): el rol propietari té ALTER DEFAULT
-- PRIVILEGES que donen EXECUTE a service_role en public.*. CREATE OR REPLACE
-- conserva l'ACL; igualment es revoca service_role i les guardes l'exclouen
-- de la comparació (com les guardes ajustades del Super-Bundle R32.14), de
-- manera que cap post-guarda falla per eixe privilegi per defecte.
--
-- Idempotent: preimatge (cos R32.13, SHA-256 8e833390…) o postimatge (cos
-- R32.15) acceptades; qualsevol altre cos avorta tota la transacció amb
-- SDP-R3215-DRIFT. Reexecutar sobre la postimatge no canvia res.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $guarda$
declare
 f pg_catalog.regprocedure := pg_catalog.to_regprocedure('public.registra_denuncia_diligent(uuid,text,text,uuid)');
 m pg_catalog.regprocedure := pg_catalog.to_regprocedure('public.denuncia_publicacio_mur(uuid,text,text)');
 cos pg_catalog.text;
begin
 if f is null or m is null
  or pg_catalog.to_regclass('private.r3213_lssi_flux') is null
  or pg_catalog.to_regclass('private.r3213_lssi_audit') is null
  or pg_catalog.to_regclass('private.r3213_lssi_rebuts') is null then
  raise exception using errcode = 'P0001', message = 'SDP-R3215-DRIFT: falten les peces R32.13 (RPC, denuncia_publicacio_mur o taules LSSI).';
 end if;
 select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc, 'UTF8')), 'hex') into cos
  from pg_catalog.pg_proc p where p.oid = f;
 if cos not in ('8e83339040e3f1cd547246486f1c87a88faa01660e64a8aa2aff7c4418545f21',
                '6f9974a0f6a46d8ca8e87e7ed617dd3eb5dbf4dfe0d8a73d61f6a6f8dc178fe9') then
  raise exception using errcode = 'P0001', message = 'SDP-R3215-DRIFT: cos desconegut de registra_denuncia_diligent (' || cos || ').';
 end if;
 if pg_catalog.pg_get_function_result(f) <> 'jsonb' or pg_catalog.pg_get_function_result(m) <> 'jsonb' then
  raise exception using errcode = 'P0001', message = 'SDP-R3215-DRIFT: tipus de retorn inesperat.';
 end if;
end;
$guarda$;

create or replace function public.registra_denuncia_diligent(p_publicacio pg_catalog.uuid,p_motiu pg_catalog.text,p_detall pg_catalog.text,p_operacio pg_catalog.uuid)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); ip pg_catalog.text:=private.empremta_ip_moderacio(); subject pg_catalog.text; req pg_catalog.jsonb; prev private.r3213_lssi_rebuts; did pg_catalog.uuid; result pg_catalog.jsonb; tip pg_catalog.text;
 detall pg_catalog.text:=btrim(p_detall); rebut_mur pg_catalog.jsonb; repetida pg_catalog.bool; original pg_catalog.text; flux private.r3213_lssi_flux; ampliacio pg_catalog.text;
begin
 if who is not null and not coalesce(private.copub_compte_actiu(who),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_publicacio is null or p_operacio is null or p_motiu is null or p_motiu not in('ofensiu','spam_frau','desinformacio','altre')
  or p_detall is null or pg_catalog.char_length(detall) not between 1 and 1000 then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 subject:=coalesce(who::pg_catalog.text,'anon:'||coalesce(ip,'shared'));
 req:=pg_catalog.jsonb_build_object('publicacio',p_publicacio,'motiu',p_motiu,'detall',detall);
 perform pg_advisory_xact_lock(pg_catalog.hashtextextended('sdp:lssi:subject:'||subject,0));
 select * into prev from private.r3213_lssi_rebuts where subjecte=subject and operacio_id=p_operacio;
 if found then
  if prev.peticio_sha256<>pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex') then raise exception using errcode='40001',message='SDP-LSSI-REPLAY-CONFLICT'; end if;
  return prev.rebut||pg_catalog.jsonb_build_object('repetida',true);
 end if;
 -- R32.15 · El rebut de la RPC del Mur diu si el disparador ha deduplicat.
 rebut_mur:=public.denuncia_publicacio_mur(p_publicacio,p_motiu,detall);
 if pg_catalog.jsonb_typeof(rebut_mur->'repetida') is distinct from 'boolean' then raise exception using errcode='55000',message='SDP-LSSI-NO-RECEIPT'; end if;
 repetida:=(rebut_mur->>'repetida')::pg_catalog.bool;
 select case s.section_id when 'mercat' then 'producte' when 'events' then 'esdeveniment' else 'publicacio' end into tip from public.section_submissions s where s.id=p_publicacio;
 select d.id,d.detall into did,original from public.denuncies d where d.objecte_id=p_publicacio::pg_catalog.text
  and d.objecte_tipus=tip and d.denunciant is not distinct from who
  and (who is not null or d.ip_hash is not distinct from ip) and (repetida or d.creat_al=pg_catalog.now()) and d.estat='pendent' order by d.creat_al desc,d.id limit 1 for share of d;
 if did is null then raise exception using errcode='55000',message='SDP-LSSI-NO-RECEIPT'; end if;
 if repetida and (select pg_catalog.count(*) from private.r3213_lssi_rebuts r where r.subjecte=subject and r.rebut->>'id'=did::pg_catalog.text)>=20 then
  raise exception using errcode='42900',message='SDP-LSSI-429';
 end if;
 insert into private.r3213_lssi_flux values(did,'rebuda',1,pg_catalog.clock_timestamp()) on conflict do nothing;
 if not exists(select 1 from private.r3213_lssi_audit where denuncia_id=did) then
  insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values(did,who,'rebuda','Denúncia rebuda; pendent de revisió humana.');
 end if;
 if repetida and detall is distinct from original then
  -- Ampliació append-only: conserva el detall nou sense tocar l'original.
  select * into flux from private.r3213_lssi_flux where denuncia_id=did;
  ampliacio:='Ampliació del denunciant (motiu: '||p_motiu||'): '||detall;
  if not exists(select 1 from private.r3213_lssi_audit a where a.denuncia_id=did and a.justificacio=ampliacio)
   and (select pg_catalog.count(*) from private.r3213_lssi_audit a where a.denuncia_id=did and a.actor_id is not distinct from who
         and a.anterior is not distinct from a.estat and pg_catalog.starts_with(a.justificacio,'Ampliació del denunciant (motiu: '))<5 then
   insert into private.r3213_lssi_audit(denuncia_id,actor_id,anterior,estat,justificacio) values(did,who,flux.estat,flux.estat,ampliacio);
  end if;
 end if;
 select pg_catalog.jsonb_build_object('id',did,'estat',f.estat,'versio',f.versio,'repetida',repetida) into result from private.r3213_lssi_flux f where f.denuncia_id=did;
 insert into private.r3213_lssi_rebuts values(subject,p_operacio,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex'),result,who);
 return result;
end; $$;
revoke all on function public.registra_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) from public,anon,authenticated,service_role;
grant execute on function public.registra_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) to anon,authenticated;

do $postguarda$
declare
 f pg_catalog.regprocedure := pg_catalog.to_regprocedure('public.registra_denuncia_diligent(uuid,text,text,uuid)');
 p pg_catalog.pg_proc;
 acl pg_catalog.jsonb;
begin
 select * into p from pg_catalog.pg_proc where oid = f;
 if pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc, 'UTF8')), 'hex') <> '6f9974a0f6a46d8ca8e87e7ed617dd3eb5dbf4dfe0d8a73d61f6a6f8dc178fe9'
  or not p.prosecdef or p.provolatile <> 'v' or (p.proconfig is distinct from array['search_path=""']::pg_catalog.text[] and p.proconfig is distinct from array['search_path=']::pg_catalog.text[]) then
  raise exception using errcode = 'P0001', message = 'SDP-R3215-DRIFT: la postimatge de registra_denuncia_diligent no és l''esperada.';
 end if;
 -- service_role queda fora de la comparació: Supabase Cloud li dona EXECUTE per defecte.
 select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(coalesce(r.rolname, 'PUBLIC'), a.privilege_type) order by coalesce(r.rolname, 'PUBLIC'), a.privilege_type), '[]'::pg_catalog.jsonb)
  into acl
  from pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
  left join pg_catalog.pg_roles r on r.oid = a.grantee
  where a.grantee <> p.proowner and coalesce(r.rolname, 'PUBLIC') <> 'service_role';
 if acl <> '[["anon","EXECUTE"],["authenticated","EXECUTE"]]'::pg_catalog.jsonb
  or not pg_catalog.has_function_privilege('anon', f, 'EXECUTE')
  or not pg_catalog.has_function_privilege('authenticated', f, 'EXECUTE') then
  raise exception using errcode = 'P0001', message = 'SDP-R3215-DRIFT: ACL inesperada de registra_denuncia_diligent (' || acl::pg_catalog.text || ').';
 end if;
end;
$postguarda$;

notify pgrst, 'reload schema';
commit;


-- Sonda de confirmació LSSI + radiografia dels SECURITY DEFINER de public/private per al Pas 2:
select pg_catalog.jsonb_build_object(
  'patch_lssi_r32_15_ok', (
    select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc, 'UTF8')), 'hex') = '6f9974a0f6a46d8ca8e87e7ed617dd3eb5dbf4dfe0d8a73d61f6a6f8dc178fe9'
    from pg_catalog.pg_proc p
    where p.oid = pg_catalog.to_regprocedure('public.registra_denuncia_diligent(uuid,text,text,uuid)')
  ),
  'definers_public_private', coalesce((
    select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'sig', pg_catalog.format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)),
        'owner', pg_catalog.pg_get_userbyid(p.proowner),
        'config', p.proconfig,
        'path_buit', coalesce(p.proconfig @> array['search_path=""']::pg_catalog.text[], false) or coalesce(p.proconfig @> array['search_path=']::pg_catalog.text[], false),
        'public_exec', coalesce((select pg_catalog.bool_or(a.grantee = 0 and a.privilege_type = 'EXECUTE') from pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) a), false),
        'anon_exec', pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE'),
        'auth_exec', pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE'),
        'acl', p.proacl::pg_catalog.text,
        'prosrc_sha256', pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc, 'UTF8')), 'hex')
      ) order by n.nspname, p.proname
    )
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef
      and n.nspname in ('public', 'private')
      and not exists (
        select 1 from pg_catalog.pg_depend d
        where d.classid = 'pg_catalog.pg_proc'::pg_catalog.regclass
          and d.objid = p.oid
          and d.refclassid = 'pg_catalog.pg_extension'::pg_catalog.regclass
          and d.deptype = 'e'
      )
  ), '[]'::pg_catalog.jsonb)
) as resultat_pas1;
