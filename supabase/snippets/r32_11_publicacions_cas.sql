-- R32.11 · D-R32-PUB-1 · MANUAL, NO APLICAT A PRODUCCIÓ.
-- Prerequisit: catàleg canònic Node0 complet (123) i helpers reals de R21/R28.
-- No afegir al catàleg ni anunciar capacitat fins al rebut manual de desplegament.
-- null expected = només creació. El text del token és opac al client.
begin;
do $$ begin
 if (pg_catalog.current_schemas(true))[1] OPERATOR(pg_catalog.<>) 'pg_catalog'::pg_catalog.name
  and not (pg_catalog.left((pg_catalog.current_schemas(true))[1]::pg_catalog.text,8) OPERATOR(pg_catalog.=) 'pg_temp_'::pg_catalog.text
   and (pg_catalog.current_schemas(true))[2] OPERATOR(pg_catalog.=) 'pg_catalog'::pg_catalog.name) then
  raise exception 'SDP-PUB-CAS-000: resolució de catàleg inesperada; revisa el caller sense canviar la sessió.' using errcode='22023';
 end if;
 -- pg_temp precedix el catàleg per als tipus encara que no figure en search_path.
 -- El nom visible no acredita identitat: cap domini temporal pot canviar DDL/overloads.
 if exists(select 1 from (values ('uuid'),('text'),('jsonb'),('bytea'),('timestamptz'),('bool'),('trigger')) expected(type_name)
  where pg_catalog.to_regtype(type_name)::pg_catalog.oid is distinct from pg_catalog.to_regtype(pg_catalog.concat('pg_catalog.',type_name))::pg_catalog.oid) then
  raise exception 'SDP-PUB-CAS-000: tipus visibles inesperats; elimina l’ombra abans del manual.' using errcode='22023';
 end if;
 if pg_catalog.to_regprocedure('private.is_town_member(pg_catalog.uuid)') is null
 or pg_catalog.to_regprocedure('private.copub_compte_actiu(pg_catalog.uuid)') is null
 or pg_catalog.to_regprocedure('private.mur_public_eligible(pg_catalog.jsonb)') is null
 or pg_catalog.to_regprocedure('public.pot_signar_com_organitzacio(pg_catalog.uuid,pg_catalog.uuid)') is null
 or pg_catalog.to_regclass('private.mur_actes_notes') is null
 or pg_catalog.to_regclass('private.mur_publicacions_revocades') is null
 or pg_catalog.to_regprocedure('public.exporta_les_meues_dades()') is null then
  raise exception 'SDP-PUB-CAS-000: falta el catàleg previ complet.';
 end if;
end $$;




-- BEGIN IDENTITY PREFLIGHT
-- Reaplicació no és una oportunitat de sobreescriure una identitat desconeguda.
-- prosrc SHA: cossos exactes d'este paquet i exportador canònic R28; metadades,
-- ACL (inclosa columna/rol custom), polítiques, claus i ordre també es proven.
do $preflight$
declare installed pg_catalog.bool; c pg_catalog.record; f pg_catalog.record; r pg_catalog.record; cols pg_catalog.jsonb; defs pg_catalog.text[]; valid pg_catalog.bool;
begin
 installed:=pg_catalog.to_regclass('private.publicacions_cas_rebuts') is not null
  or pg_catalog.to_regprocedure('private.publicacions_cas_token()') is not null
  or pg_catalog.to_regprocedure('public.publica_section_submission_cas(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.text,pg_catalog.uuid,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.uuid)') is not null
  or pg_catalog.to_regprocedure('private.exporta_les_meues_dades_abans_r3211_cas()') is not null
  or exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.section_submissions'::pg_catalog.regclass and tgname='zzz_r3211_publicacions_cas_token');
 if exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.section_submissions'::pg_catalog.regclass
  and not tgisinternal and (tgtype & 2)=2 and (tgtype & 16)=16 and tgname>'zzz_r3211_publicacions_cas_token') then
  raise exception 'SDP-PUB-CAS-000: un trigger posterior impediria acreditar el token.' using errcode='22023';
 end if;
 if not installed then
  select * into f from pg_catalog.pg_proc where oid=pg_catalog.to_regprocedure('public.exporta_les_meues_dades()');
  if f.proowner<>current_user::pg_catalog.regrole::pg_catalog.oid or not f.prosecdef or f.provolatile<>'s'
   or f.prorettype<>'pg_catalog.jsonb'::pg_catalog.regtype or f.proconfig is distinct from array['search_path=""']::pg_catalog.text[]
   or not pg_catalog.has_function_privilege('authenticated',f.oid,'EXECUTE')
   or f.pronargdefaults<>0 or f.prokind<>'f' or f.proretset
   or f.prolang<>(select oid from pg_catalog.pg_language where lanname='plpgsql')
   or exists(select 1 from pg_catalog.aclexplode(coalesce(f.proacl,pg_catalog.acldefault('f',f.proowner))) a
    where a.grantee<>f.proowner and not(a.grantee='authenticated'::pg_catalog.regrole::pg_catalog.oid and a.privilege_type='EXECUTE' and not a.is_grantable))
   or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')<>'82cb25456d46aab8496596d3f97009399c0506c292ed439aaae4cf6841e9d029' then
   raise exception 'SDP-PUB-CAS-000: exportador base inesperat; cal revisió manual.' using errcode='22023';
  end if;
 else
  select * into c from pg_catalog.pg_class where oid=pg_catalog.to_regclass('private.publicacions_cas_rebuts');
  if c.oid is null or c.relowner<>current_user::pg_catalog.regrole::pg_catalog.oid or c.relkind<>'r' or c.relpersistence<>'p'
   or not c.relrowsecurity or c.relforcerowsecurity or c.relispartition
   or exists(select 1 from pg_catalog.pg_inherits where inhrelid=c.oid or inhparent=c.oid)
   or exists(select 1 from pg_catalog.pg_policy where polrelid=c.oid)
   or exists(select 1 from pg_catalog.pg_rewrite where ev_class=c.oid)
   or exists(select 1 from pg_catalog.pg_constraint where conrelid=c.oid and contype='f'
    and confrelid not in ('public.section_submissions'::pg_catalog.regclass,'public.towns'::pg_catalog.regclass,'auth.users'::pg_catalog.regclass))
   or exists(select 1 from pg_catalog.pg_trigger where tgrelid=c.oid and not tgisinternal)
   or exists(select 1 from pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a where a.grantee<>c.relowner)
   or exists(select 1 from pg_catalog.pg_attribute a cross join lateral pg_catalog.aclexplode(a.attacl) x where a.attrelid=c.oid and x.grantee<>c.relowner) then
   raise exception 'SDP-PUB-CAS-000: identitat o permisos de rebuts inesperats.' using errcode='22023';
  end if;
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_catalog.pg_get_expr(d.adbin,d.adrelid)) order by a.attnum)
   into cols from pg_catalog.pg_attribute a left join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
   where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped;
  select pg_catalog.array_agg(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.pg_get_constraintdef(oid),'REFERENCES section_submissions(','REFERENCES public.section_submissions('),'REFERENCES towns(','REFERENCES public.towns('),'REFERENCES users(','REFERENCES auth.users(') order by pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.pg_get_constraintdef(oid),'REFERENCES section_submissions(','REFERENCES public.section_submissions('),'REFERENCES towns(','REFERENCES public.towns('),'REFERENCES users(','REFERENCES auth.users(')) into defs
   from pg_catalog.pg_constraint where conrelid=c.oid and contype<>'n' and convalidated and not condeferrable and not condeferred;
  if cols is distinct from '[["operation_id","uuid",true,null],["submission_id","uuid",true,null],["tenant_id","uuid",true,null],["owner_user_id","uuid",true,null],["section_id","text",true,null],["request_sha256","bytea",true,null],["confirmed_updated_at","timestamp with time zone",true,null],["created_at","timestamp with time zone",true,"clock_timestamp()"]]'::pg_catalog.jsonb or defs is distinct from (select pg_catalog.array_agg(x order by x) from pg_catalog.unnest(array['PRIMARY KEY (operation_id)','FOREIGN KEY (submission_id) REFERENCES public.section_submissions(id) ON DELETE CASCADE','FOREIGN KEY (tenant_id) REFERENCES public.towns(id) ON DELETE CASCADE','FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE','CHECK ((octet_length(request_sha256) = 32))']::pg_catalog.text[]) x)
   or (select pg_catalog.count(*) from pg_catalog.pg_constraint where conrelid=c.oid and contype<>'n')<>5
   -- PG18 materialitza NOT NULL en pg_constraint; PG17 només attnotnull.
   -- La representació addicional ha de ser exactament una per cada columna
   -- acreditada, local, validada i enforced; no s’ignora cap altre constraint.
   or (select pg_catalog.array_agg(n.conkey[1] order by n.conkey[1]) from pg_catalog.pg_constraint n where n.conrelid=c.oid and n.contype='n')
    is distinct from (case when pg_catalog.current_setting('server_version_num')::pg_catalog.int4>=180000 then array[1,2,3,4,5,6,7,8]::pg_catalog.int2[] else null::pg_catalog.int2[] end)
   or exists(select 1 from pg_catalog.pg_constraint n where n.conrelid=c.oid and n.contype='n'
    and (not n.convalidated or n.condeferrable or n.condeferred or not n.conislocal or n.coninhcount<>0 or n.connoinherit or n.conparentid<>0
     or (pg_catalog.to_jsonb(n)->>'conenforced') is distinct from 'true'
     or not exists(select 1 from pg_catalog.pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped and a.attnotnull
      and n.conkey=array[a.attnum]::pg_catalog.int2[])))
   or (select pg_catalog.count(*) from pg_catalog.pg_index where indrelid=c.oid)<>1
   or exists(select 1 from pg_catalog.pg_attribute where attrelid=c.oid and (attisdropped or attidentity<>'' or attgenerated<>'')) then
   raise exception 'SDP-PUB-CAS-000: DDL de rebuts inesperat.' using errcode='22023';
  end if;
  for r in select * from (values
   ('private.publicacions_cas_token()','c5d0ff028732a22357413a48177b2cfb896e2b1b94ec0c008bc5001bfbb8fe58','pg_catalog.trigger', 'v',false,false),
   ('public.publica_section_submission_cas(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.text,pg_catalog.uuid,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.uuid)','1c2801a39b7bd5b8abe43a0c20275404be9c9f30019b8f84d982c965b2725619','pg_catalog.jsonb', 'v',true,true),
   ('public.exporta_les_meues_dades()','e11e57671fdb7096ef43c2cef4008cf765499f770173747cea7cd98f14852eea','pg_catalog.jsonb', 's',true,true),
   ('private.exporta_les_meues_dades_abans_r3211_cas()','82cb25456d46aab8496596d3f97009399c0506c292ed439aaae4cf6841e9d029','pg_catalog.jsonb','s',true,false)
  ) expected(signature,source_sha,return_type,volatility,definer,allow_auth) loop
   select * into f from pg_catalog.pg_proc where oid=pg_catalog.to_regprocedure(r.signature);
   valid:=f.oid is not null and f.proowner=current_user::pg_catalog.regrole::pg_catalog.oid and f.prosecdef=r.definer and f.provolatile::pg_catalog.text=r.volatility
    and f.prorettype=pg_catalog.to_regtype(r.return_type) and f.proconfig=array['search_path=""']::pg_catalog.text[] and f.pronargdefaults=0
    and f.prokind='f' and not f.proretset and f.prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql')
    and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')=r.source_sha;
   if valid then
    valid:=not exists(select 1 from pg_catalog.aclexplode(coalesce(f.proacl,pg_catalog.acldefault('f',f.proowner))) a
     where a.grantee<>f.proowner and not (r.allow_auth and a.grantee='authenticated'::pg_catalog.regrole::pg_catalog.oid and a.privilege_type='EXECUTE' and not a.is_grantable))
     and (not r.allow_auth or pg_catalog.has_function_privilege('authenticated',f.oid,'EXECUTE'));
   end if;
   if not coalesce(valid,false) then raise exception 'SDP-PUB-CAS-000: funció o ACL inesperada: %',r.signature using errcode='22023'; end if;
  end loop;
  if not exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.section_submissions'::pg_catalog.regclass
   and tgname='zzz_r3211_publicacions_cas_token' and tgfoid=pg_catalog.to_regprocedure('private.publicacions_cas_token()')
   and tgtype=19 and tgenabled='O' and not tgisinternal and tgqual is null and tgattr=''::pg_catalog.int2vector) then
   raise exception 'SDP-PUB-CAS-000: trigger de token inesperat.' using errcode='22023';
  end if;
 end if;
end $preflight$;
-- END IDENTITY PREFLIGHT

-- now() és constant en una transacció. Este trigger addicional, ordenat després
-- del de conservació existent, avança almenys un microsegon també en eixe cas.
create or replace function private.publicacions_cas_token()
returns pg_catalog.trigger language plpgsql set search_path='' as $$
begin
 if not isfinite(old.updated_at) then raise exception 'SDP-PUB-CAS-001: token anterior invàlid.' using errcode='22023'; end if;
 new.updated_at:=greatest(clock_timestamp(),old.updated_at+interval '1 microsecond');
 return new;
end $$;
revoke all on function private.publicacions_cas_token() from public,anon,authenticated,service_role;
drop trigger if exists zzz_r3211_publicacions_cas_token on public.section_submissions;
create trigger zzz_r3211_publicacions_cas_token before update on public.section_submissions
 for each row execute function private.publicacions_cas_token();

-- Cap cos UGC duplicat: només identitat, hash de la petició i versió confirmada.
create table if not exists private.publicacions_cas_rebuts(
 operation_id pg_catalog.uuid primary key,
 submission_id pg_catalog.uuid not null references public.section_submissions(id) on delete cascade,
 tenant_id pg_catalog.uuid not null references public.towns(id) on delete cascade,
 owner_user_id pg_catalog.uuid not null references auth.users(id) on delete cascade,
 section_id pg_catalog.text not null,
 request_sha256 pg_catalog.bytea not null check(octet_length(request_sha256)=32),
 confirmed_updated_at pg_catalog.timestamptz not null,
 created_at pg_catalog.timestamptz not null default clock_timestamp()
);
alter table private.publicacions_cas_rebuts enable row level security;
revoke all on table private.publicacions_cas_rebuts from public,anon,authenticated,service_role;

create or replace function public.publica_section_submission_cas(
 p_id pg_catalog.uuid,p_tenant_id pg_catalog.uuid,p_section_id pg_catalog.text,p_payload pg_catalog.jsonb,p_title pg_catalog.text,p_description pg_catalog.text,
 p_author_org_id pg_catalog.uuid,p_preserve_author pg_catalog.bool,p_expected_updated_at pg_catalog.timestamptz,p_operation_id pg_catalog.uuid
) returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); s public.section_submissions; r private.publicacions_cas_rebuts;
 v_payload jsonb; v_org uuid; v_hash bytea; v_replay boolean:=false;
begin
 if actor is null or p_id is null or p_tenant_id is null or p_operation_id is null
 or p_section_id is null or p_section_id not in ('mur','mercat','events','multimedia','notes')
 or jsonb_typeof(p_payload) is distinct from 'object' or p_title is null
 or p_preserve_author is null or (p_preserve_author and p_author_org_id is not null)
 or (p_expected_updated_at is not null and not isfinite(p_expected_updated_at))
 or octet_length(p_payload::text)>700000 or char_length(p_title)>4000
 or char_length(coalesce(p_description,''))>20000 then
  raise exception 'SDP-PUB-CAS-001: petició invàlida.' using errcode='22023';
 end if;
 if not private.is_town_member(p_tenant_id) or not private.copub_compte_actiu(actor) then
  raise exception 'SDP-PUB-CAS-002: publicació no disponible.' using errcode='42501';
 end if;
 -- Copyright és llegit com a llicència real pel Mur/Mercat/Arxiu. No
 -- confirmem una versió que el purgue: fins contracte dedicat, error honest.
 if nullif(btrim(p_payload->>'copyright'),'') is not null then
  raise exception 'SDP-PUB-CAS-006: drets presents; cal el contracte dedicat, conserva l’esborrany.' using errcode='22023';
 end if;
 -- Mateix ordre global: operació, acte. No agafem pany de nota: es rebutja
 -- qualsevol acte registrat en el seu ledger abans de tocar section_submissions.
 perform pg_advisory_xact_lock(hashtextextended('sdp:pub-cas:op:'||p_operation_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||p_id::text,0));
 if exists(select 1 from private.mur_actes_notes where act_id=p_id)
 or exists(select 1 from public.notes where published_submission_id=p_id)
 or exists(select 1 from private.mur_publicacions_revocades where submission_id=p_id) then
  raise exception 'SDP-PUB-CAS-004: acte vinculat o retirat; usa el seu contracte específic.' using errcode='42501';
 end if;
 -- El hash lliga també els camps que es purguen: un opID amb cos canviat no
 -- és un reintent. JSONB dona ordre canònic de claus; no conté secrets nous.
 v_hash:=sha256(convert_to(jsonb_build_array(p_id,p_tenant_id,actor,p_section_id,p_payload,p_title,
  p_description,p_author_org_id,p_preserve_author,
  case when p_expected_updated_at is not null then to_char(p_expected_updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') end)::text,'UTF8'));
 select * into r from private.publicacions_cas_rebuts where operation_id=p_operation_id;
 if found and (r.owner_user_id is distinct from actor or r.tenant_id<>p_tenant_id or r.submission_id<>p_id
  or r.section_id<>p_section_id or r.request_sha256<>v_hash) then
  raise exception 'SDP-PUB-CAS-005: identificador d’operació reutilitzat amb una altra petició.' using errcode='22023';
 end if;
 select * into s from public.section_submissions where id=p_id for update;
 if found and (s.owner_user_id is distinct from actor or s.tenant_id<>p_tenant_id or s.section_id<>p_section_id) then
  raise exception 'SDP-PUB-CAS-002: publicació no disponible.' using errcode='42501';
 end if;
 if s.id is not null and nullif(btrim(s.payload->>'copyright'),'') is not null then
  raise exception 'SDP-PUB-CAS-006: la fila conserva drets; no es poden eliminar amb CAS general.' using errcode='22023';
 end if;
 if s.id is not null and (not isfinite(s.created_at) or not isfinite(s.updated_at) or s.created_at>s.updated_at) then
  raise exception 'SDP-PUB-CAS-001: dates heretades incoherents; conserva l’esborrany i revisa la fila.' using errcode='22023';
 end if;
 if r.operation_id is not null then
  -- Un replay històric no confirma que el vell esborrany siga la versió actual.
  if s.id is null or s.updated_at is distinct from r.confirmed_updated_at then
   raise exception 'SDP-PUB-CAS-003: l’operació es va confirmar però hi ha una revisió posterior.' using errcode='40001';
  end if;
  v_replay:=true;
 else
  if (p_expected_updated_at is null and s.id is not null)
   or (p_expected_updated_at is not null and (s.id is null or s.updated_at is distinct from p_expected_updated_at)) then
   raise exception 'SDP-PUB-CAS-003: la publicació ha canviat; conserva l’esborrany i recarrega.' using errcode='40001';
  end if;
  v_org:=case when p_preserve_author and s.id is not null then s.author_org_id else p_author_org_id end;
  if not public.pot_signar_com_organitzacio(v_org,p_tenant_id) then
   raise exception 'SDP-PUB-CAS-002: autoria no disponible.' using errcode='42501';
  end if;
  v_payload:=(p_payload-array['id','tenant_id','tenantId','owner_user_id','ownerUserId','author_org_id','authorOrgId',
   'author_entity_id','author_id','author_user_id','author_agent_id','authorAgentId','isSystem','isAvis','is_pinned',
   'pinned_position','mainHref','slug','article','origen','copyright','seller','autor','source','srcDelPort','author','author_name','sectionId','section_id',
   'created_at','updated_at','updatedAt','_editorialVersio','_editorial','_projeccioLocal','_projeccioPendent']::text[]);
  if v_payload->>'type'='sistema' or (p_section_id<>'notes' and not private.mur_public_eligible(v_payload)) then
   raise exception 'SDP-PUB-CAS-002: contingut no publicable.' using errcode='42501';
  end if;
  if s.id is null then
   insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload,author_org_id)
   values(p_id,p_tenant_id,actor,p_section_id,p_title,p_description,v_payload,v_org) returning * into s;
  else
   update public.section_submissions set title=p_title,description=p_description,payload=v_payload,author_org_id=v_org
   where id=p_id returning * into s;
  end if;
  insert into private.publicacions_cas_rebuts(operation_id,submission_id,tenant_id,owner_user_id,section_id,request_sha256,confirmed_updated_at)
   values(p_operation_id,p_id,p_tenant_id,actor,p_section_id,v_hash,s.updated_at);
 end if;
 -- ACK tancat i mínim: cap cos reflectit del client ni token fabricat.
 return jsonb_build_object('id',s.id,'tenant_id',s.tenant_id,'owner_user_id',s.owner_user_id,'section_id',s.section_id,
  'operation_id',p_operation_id,'created_at',to_char(s.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'updated_at',to_char(s.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
  'author_org_id',s.author_org_id,'replay',v_replay);
end $$;
revoke all on function public.publica_section_submission_cas(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.text,pg_catalog.uuid,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.uuid) from public,anon,authenticated,service_role;
grant execute on function public.publica_section_submission_cas(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.text,pg_catalog.uuid,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.uuid) to authenticated;

-- Embolcall idempotent de l'exportador vigent: conserva R28 i totes les seues
-- extensions sense copiar-ne el cos ni substituir les migracions congelades.
do $$ begin
 if pg_catalog.to_regprocedure('private.exporta_les_meues_dades_abans_r3211_cas()') is null then
  alter function public.exporta_les_meues_dades() set schema private;
  alter function private.exporta_les_meues_dades() rename to exporta_les_meues_dades_abans_r3211_cas;
 end if;
end $$;
revoke all on function private.exporta_les_meues_dades_abans_r3211_cas() from public,anon,authenticated,service_role;
create or replace function public.exporta_les_meues_dades()
returns pg_catalog.jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); base jsonb; receipts jsonb;
begin
 if actor is null then raise exception 'SDP-EXPORT-000: cal la sessió iniciada.' using errcode='42501'; end if;
 base:=private.exporta_les_meues_dades_abans_r3211_cas();
 if jsonb_typeof(base) is distinct from 'object' or base->>'format' is distinct from 'socdepoble.exportacio.v1' then
  raise exception 'SDP-PUB-CAS-000: exportació incompatible.';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('operation_id',operation_id,'submission_id',submission_id,
  'tenant_id',tenant_id,'section_id',section_id,'confirmed_updated_at',confirmed_updated_at,'created_at',created_at)
  order by created_at,operation_id),'[]'::jsonb) into receipts from private.publicacions_cas_rebuts where owner_user_id=actor;
 return base||jsonb_build_object('publicacions_cas_rebuts',receipts);
end $$;
revoke all on function public.exporta_les_meues_dades() from public,anon,authenticated,service_role;
grant execute on function public.exporta_les_meues_dades() to authenticated;


-- BEGIN IDENTITY POSTFLIGHT
-- Reaplicació no és una oportunitat de sobreescriure una identitat desconeguda.
-- prosrc SHA: cossos exactes d'este paquet i exportador canònic R28; metadades,
-- ACL (inclosa columna/rol custom), polítiques, claus i ordre també es proven.
do $preflight$
declare installed pg_catalog.bool; c pg_catalog.record; f pg_catalog.record; r pg_catalog.record; cols pg_catalog.jsonb; defs pg_catalog.text[]; valid pg_catalog.bool;
begin
 installed:=pg_catalog.to_regclass('private.publicacions_cas_rebuts') is not null
  or pg_catalog.to_regprocedure('private.publicacions_cas_token()') is not null
  or pg_catalog.to_regprocedure('public.publica_section_submission_cas(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.text,pg_catalog.uuid,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.uuid)') is not null
  or pg_catalog.to_regprocedure('private.exporta_les_meues_dades_abans_r3211_cas()') is not null
  or exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.section_submissions'::pg_catalog.regclass and tgname='zzz_r3211_publicacions_cas_token');
 if exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.section_submissions'::pg_catalog.regclass
  and not tgisinternal and (tgtype & 2)=2 and (tgtype & 16)=16 and tgname>'zzz_r3211_publicacions_cas_token') then
  raise exception 'SDP-PUB-CAS-000: un trigger posterior impediria acreditar el token.' using errcode='22023';
 end if;
 if not installed then
  select * into f from pg_catalog.pg_proc where oid=pg_catalog.to_regprocedure('public.exporta_les_meues_dades()');
  if f.proowner<>current_user::pg_catalog.regrole::pg_catalog.oid or not f.prosecdef or f.provolatile<>'s'
   or f.prorettype<>'pg_catalog.jsonb'::pg_catalog.regtype or f.proconfig is distinct from array['search_path=""']::pg_catalog.text[]
   or not pg_catalog.has_function_privilege('authenticated',f.oid,'EXECUTE')
   or f.pronargdefaults<>0 or f.prokind<>'f' or f.proretset
   or f.prolang<>(select oid from pg_catalog.pg_language where lanname='plpgsql')
   or exists(select 1 from pg_catalog.aclexplode(coalesce(f.proacl,pg_catalog.acldefault('f',f.proowner))) a
    where a.grantee<>f.proowner and not(a.grantee='authenticated'::pg_catalog.regrole::pg_catalog.oid and a.privilege_type='EXECUTE' and not a.is_grantable))
   or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')<>'82cb25456d46aab8496596d3f97009399c0506c292ed439aaae4cf6841e9d029' then
   raise exception 'SDP-PUB-CAS-000: exportador base inesperat; cal revisió manual.' using errcode='22023';
  end if;
 else
  select * into c from pg_catalog.pg_class where oid=pg_catalog.to_regclass('private.publicacions_cas_rebuts');
  if c.oid is null or c.relowner<>current_user::pg_catalog.regrole::pg_catalog.oid or c.relkind<>'r' or c.relpersistence<>'p'
   or not c.relrowsecurity or c.relforcerowsecurity or c.relispartition
   or exists(select 1 from pg_catalog.pg_inherits where inhrelid=c.oid or inhparent=c.oid)
   or exists(select 1 from pg_catalog.pg_policy where polrelid=c.oid)
   or exists(select 1 from pg_catalog.pg_rewrite where ev_class=c.oid)
   or exists(select 1 from pg_catalog.pg_constraint where conrelid=c.oid and contype='f'
    and confrelid not in ('public.section_submissions'::pg_catalog.regclass,'public.towns'::pg_catalog.regclass,'auth.users'::pg_catalog.regclass))
   or exists(select 1 from pg_catalog.pg_trigger where tgrelid=c.oid and not tgisinternal)
   or exists(select 1 from pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a where a.grantee<>c.relowner)
   or exists(select 1 from pg_catalog.pg_attribute a cross join lateral pg_catalog.aclexplode(a.attacl) x where a.attrelid=c.oid and x.grantee<>c.relowner) then
   raise exception 'SDP-PUB-CAS-000: identitat o permisos de rebuts inesperats.' using errcode='22023';
  end if;
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_catalog.pg_get_expr(d.adbin,d.adrelid)) order by a.attnum)
   into cols from pg_catalog.pg_attribute a left join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
   where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped;
  select pg_catalog.array_agg(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.pg_get_constraintdef(oid),'REFERENCES section_submissions(','REFERENCES public.section_submissions('),'REFERENCES towns(','REFERENCES public.towns('),'REFERENCES users(','REFERENCES auth.users(') order by pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.pg_get_constraintdef(oid),'REFERENCES section_submissions(','REFERENCES public.section_submissions('),'REFERENCES towns(','REFERENCES public.towns('),'REFERENCES users(','REFERENCES auth.users(')) into defs
   from pg_catalog.pg_constraint where conrelid=c.oid and contype<>'n' and convalidated and not condeferrable and not condeferred;
  if cols is distinct from '[["operation_id","uuid",true,null],["submission_id","uuid",true,null],["tenant_id","uuid",true,null],["owner_user_id","uuid",true,null],["section_id","text",true,null],["request_sha256","bytea",true,null],["confirmed_updated_at","timestamp with time zone",true,null],["created_at","timestamp with time zone",true,"clock_timestamp()"]]'::pg_catalog.jsonb or defs is distinct from (select pg_catalog.array_agg(x order by x) from pg_catalog.unnest(array['PRIMARY KEY (operation_id)','FOREIGN KEY (submission_id) REFERENCES public.section_submissions(id) ON DELETE CASCADE','FOREIGN KEY (tenant_id) REFERENCES public.towns(id) ON DELETE CASCADE','FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE','CHECK ((octet_length(request_sha256) = 32))']::pg_catalog.text[]) x)
   or (select pg_catalog.count(*) from pg_catalog.pg_constraint where conrelid=c.oid and contype<>'n')<>5
   -- PG18 materialitza NOT NULL en pg_constraint; PG17 només attnotnull.
   -- La representació addicional ha de ser exactament una per cada columna
   -- acreditada, local, validada i enforced; no s’ignora cap altre constraint.
   or (select pg_catalog.array_agg(n.conkey[1] order by n.conkey[1]) from pg_catalog.pg_constraint n where n.conrelid=c.oid and n.contype='n')
    is distinct from (case when pg_catalog.current_setting('server_version_num')::pg_catalog.int4>=180000 then array[1,2,3,4,5,6,7,8]::pg_catalog.int2[] else null::pg_catalog.int2[] end)
   or exists(select 1 from pg_catalog.pg_constraint n where n.conrelid=c.oid and n.contype='n'
    and (not n.convalidated or n.condeferrable or n.condeferred or not n.conislocal or n.coninhcount<>0 or n.connoinherit or n.conparentid<>0
     or (pg_catalog.to_jsonb(n)->>'conenforced') is distinct from 'true'
     or not exists(select 1 from pg_catalog.pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped and a.attnotnull
      and n.conkey=array[a.attnum]::pg_catalog.int2[])))
   or (select pg_catalog.count(*) from pg_catalog.pg_index where indrelid=c.oid)<>1
   or exists(select 1 from pg_catalog.pg_attribute where attrelid=c.oid and (attisdropped or attidentity<>'' or attgenerated<>'')) then
   raise exception 'SDP-PUB-CAS-000: DDL de rebuts inesperat.' using errcode='22023';
  end if;
  for r in select * from (values
   ('private.publicacions_cas_token()','c5d0ff028732a22357413a48177b2cfb896e2b1b94ec0c008bc5001bfbb8fe58','pg_catalog.trigger', 'v',false,false),
   ('public.publica_section_submission_cas(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.text,pg_catalog.uuid,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.uuid)','1c2801a39b7bd5b8abe43a0c20275404be9c9f30019b8f84d982c965b2725619','pg_catalog.jsonb', 'v',true,true),
   ('public.exporta_les_meues_dades()','e11e57671fdb7096ef43c2cef4008cf765499f770173747cea7cd98f14852eea','pg_catalog.jsonb', 's',true,true),
   ('private.exporta_les_meues_dades_abans_r3211_cas()','82cb25456d46aab8496596d3f97009399c0506c292ed439aaae4cf6841e9d029','pg_catalog.jsonb','s',true,false)
  ) expected(signature,source_sha,return_type,volatility,definer,allow_auth) loop
   select * into f from pg_catalog.pg_proc where oid=pg_catalog.to_regprocedure(r.signature);
   valid:=f.oid is not null and f.proowner=current_user::pg_catalog.regrole::pg_catalog.oid and f.prosecdef=r.definer and f.provolatile::pg_catalog.text=r.volatility
    and f.prorettype=pg_catalog.to_regtype(r.return_type) and f.proconfig=array['search_path=""']::pg_catalog.text[] and f.pronargdefaults=0
    and f.prokind='f' and not f.proretset and f.prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql')
    and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')=r.source_sha;
   if valid then
    valid:=not exists(select 1 from pg_catalog.aclexplode(coalesce(f.proacl,pg_catalog.acldefault('f',f.proowner))) a
     where a.grantee<>f.proowner and not (r.allow_auth and a.grantee='authenticated'::pg_catalog.regrole::pg_catalog.oid and a.privilege_type='EXECUTE' and not a.is_grantable))
     and (not r.allow_auth or pg_catalog.has_function_privilege('authenticated',f.oid,'EXECUTE'));
   end if;
   if not coalesce(valid,false) then raise exception 'SDP-PUB-CAS-000: funció o ACL inesperada: %',r.signature using errcode='22023'; end if;
  end loop;
  if not exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.section_submissions'::pg_catalog.regclass
   and tgname='zzz_r3211_publicacions_cas_token' and tgfoid=pg_catalog.to_regprocedure('private.publicacions_cas_token()')
   and tgtype=19 and tgenabled='O' and not tgisinternal and tgqual is null and tgattr=''::pg_catalog.int2vector) then
   raise exception 'SDP-PUB-CAS-000: trigger de token inesperat.' using errcode='22023';
  end if;
 end if;
end $preflight$;
-- END IDENTITY POSTFLIGHT

notify pgrst,'reload schema';
commit;
