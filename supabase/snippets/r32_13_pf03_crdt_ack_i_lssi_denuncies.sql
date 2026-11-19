-- R32.13 PF-03 · LOCAL VERIFIED PROPOSAL, never applies itself remotely.
-- Apply after the complete v1.2.8 catalog (123 migrations). No historical SQL changed.
-- Durable append-only captures are private to (tenant, auth.uid()). A replay
-- returns its ORIGINAL remote time; it can never manufacture 90 days of age.
-- LSSI reuses public.denuncies, existing public-content validation and IP hashing.
-- A complaint is a request for human review, not a finding of illegality.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
-- Preserve the caller's search_path. Static R6 rejects session path mutation;
-- Routine tables and DDL default calls are explicitly qualified; each routine
-- retains its own empty path. Casts, signatures and variable types are qualified.
-- Refuse migration caller namespace orders that can shadow DDL operators.
-- A temporary namespace is permitted: all used builtin types are qualified.
do $r3213_caller$
begin
 if (select x.schema_name from pg_catalog.unnest(pg_catalog.current_schemas(true)) with ordinality as x(schema_name,ordinal)
     where x.schema_name is distinct from (select n.nspname from pg_catalog.pg_namespace n where n.oid=pg_catalog.pg_my_temp_schema())
     order by x.ordinal limit 1) is distinct from 'pg_catalog'
 then
  raise exception using errcode='55000',message='SDP-R3213-CALLER-SCHEMA';
 end if;
end;
$r3213_caller$;

create table private.r3213_crdt_captures (
 tenant_id pg_catalog.uuid not null references public.towns(id) on delete cascade,
 owner_id pg_catalog.uuid not null references auth.users(id) on delete cascade,
 request_id pg_catalog.text not null check(request_id ~ '^[A-Za-z0-9_-]{1,128}$'),
 canonical_capture pg_catalog.text not null check(pg_catalog.octet_length(canonical_capture)<=4194304),
 capture_sha256 pg_catalog.text not null check(capture_sha256 ~ '^[a-f0-9]{64}$'),
 frontier pg_catalog.jsonb not null check(pg_catalog.jsonb_typeof(frontier)='array'),
 confirmed_at pg_catalog.timestamptz not null,
 primary key(tenant_id,owner_id,request_id)
);
alter table private.r3213_crdt_captures enable row level security;
revoke all on private.r3213_crdt_captures from public,anon,authenticated,service_role;

create table private.r3213_crdt_dots (
 tenant_id pg_catalog.uuid not null references public.towns(id) on delete cascade,
 owner_id pg_catalog.uuid not null references auth.users(id) on delete cascade,
 dot pg_catalog.text not null, operation pg_catalog.jsonb not null,
 primary key(tenant_id,owner_id,dot)
);
alter table private.r3213_crdt_dots enable row level security;
revoke all on private.r3213_crdt_dots from public,anon,authenticated,service_role;

create function public.confirma_captura_crdt_rural(p_tenant pg_catalog.uuid,p_request pg_catalog.text,p_capture pg_catalog.text,p_sha256 pg_catalog.text,p_frontier pg_catalog.jsonb)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); old private.r3213_crdt_captures; moment pg_catalog.timestamptz; capture pg_catalog.jsonb; frontier pg_catalog.jsonb; op pg_catalog.jsonb; opdot pg_catalog.text;
begin
 if who is null or not coalesce(private.copub_compte_actiu(who),false) or not coalesce(private.is_town_member(p_tenant),false) then
  raise exception using errcode='42501',message='SDP-PF03-403';
 end if;
 if p_tenant is null or p_request is null or p_request !~ '^[A-Za-z0-9_-]{1,128}$' or p_capture is null
  or pg_catalog.octet_length(p_capture)>4194304 or p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$'
  or p_frontier is null or pg_catalog.jsonb_typeof(p_frontier)<>'array' or jsonb_array_length(p_frontier)>2048 then
  raise exception using errcode='22023',message='SDP-PF03-400';
 end if;
 capture:=p_capture::pg_catalog.jsonb;
 if pg_catalog.jsonb_typeof(capture)<>'object' or capture->>'schema' is distinct from 'sdp.rural.rga-mv-dag.v1'
  or pg_catalog.jsonb_typeof(capture->'ops') is distinct from 'array' or jsonb_array_length(capture->'ops')>2048
  or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_capture,'UTF8')),'hex')<>p_sha256
  or exists(select 1 from jsonb_array_elements(p_frontier) x where pg_catalog.jsonb_typeof(x)<>'string') then
  raise exception using errcode='22023',message='SDP-PF03-400';
 end if;
 -- Verify the frontier against the actual durable operation set. DAG validity
 -- and JCS canonicalization are additionally checked by the neutral CRDT client.
 select coalesce(jsonb_agg(dot order by dot collate "C"),'[]'::pg_catalog.jsonb) into frontier from (
  select (o->>'replica')||':'||(o->>'comptador') dot from jsonb_array_elements(capture->'ops') o
  except select p from jsonb_array_elements(capture->'ops') o cross join lateral jsonb_array_elements_text(o->'parents') p
 ) heads;
 if frontier<>p_frontier then raise exception using errcode='22023',message='SDP-PF03-FRONTIER'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sdp:pf03:'||p_tenant::pg_catalog.text||':'||who::pg_catalog.text,0));
 -- Never overwrite a DOT even when another device submits a disjoint capture.
 for op in select value from jsonb_array_elements(capture->'ops') loop
  opdot:=(op->>'replica')||':'||(op->>'comptador');
  if opdot is null or pg_catalog.char_length(opdot)>82 or exists(select 1 from private.r3213_crdt_dots x
    where x.tenant_id=p_tenant and x.owner_id=who and x.dot=opdot and x.operation<>op) then
   raise exception using errcode='40001',message='SDP-PF03-DOT-EQUIVOCATION';
  end if;
  insert into private.r3213_crdt_dots values(p_tenant,who,opdot,op) on conflict do nothing;
 end loop;
 select * into old from private.r3213_crdt_captures where tenant_id=p_tenant and owner_id=who and request_id=p_request;
 if found then
  if old.canonical_capture<>p_capture or old.capture_sha256<>p_sha256 or old.frontier<>p_frontier then
   raise exception using errcode='40001',message='SDP-PF03-REPLAY-CONFLICT';
  end if;
  moment:=old.confirmed_at;
 else
  select greatest(pg_catalog.date_trunc('milliseconds',pg_catalog.clock_timestamp()),coalesce(max(confirmed_at)+'1 millisecond'::pg_catalog.interval,'-infinity'::pg_catalog.timestamptz)) into moment
   from private.r3213_crdt_captures where tenant_id=p_tenant and owner_id=who;
  insert into private.r3213_crdt_captures values(p_tenant,who,p_request,p_capture,p_sha256,p_frontier,moment);
 end if;
 -- Authority is bound to the authenticated transport's configured HTTPS origin,
 -- never supplied by the caller. The adapter supplies it after validating RPC.
 return jsonb_build_object('requestId',p_request,'sha256',p_sha256,'frontera',p_frontier,
  'confirmatEl',to_char(moment at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'ack_remot_confirmat',true);
end; $$;
revoke all on function public.confirma_captura_crdt_rural(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.jsonb) from public,anon,authenticated,service_role;
grant execute on function public.confirma_captura_crdt_rural(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.jsonb) to authenticated;

create table private.r3213_lssi_flux (
 denuncia_id pg_catalog.uuid primary key references public.denuncies(id) on delete cascade,
 estat pg_catalog.text not null check(estat in('rebuda','en_revisio','ocultacio_cautelar','arxivada','resolta')),
 versio pg_catalog.int4 not null check(versio>=1),
 modificada_al pg_catalog.timestamptz not null default pg_catalog.clock_timestamp()
);
create table private.r3213_lssi_audit (
 id pg_catalog.uuid primary key default pg_catalog.gen_random_uuid(),
 denuncia_id pg_catalog.uuid not null references public.denuncies(id) on delete cascade,
 actor_id pg_catalog.uuid references auth.users(id) on delete set null,
 anterior pg_catalog.text,
 estat pg_catalog.text not null check(estat in('rebuda','en_revisio','ocultacio_cautelar','arxivada','resolta')),
 justificacio pg_catalog.text not null check(pg_catalog.char_length(justificacio) between 1 and 2000),
 creat_al pg_catalog.timestamptz not null default pg_catalog.clock_timestamp()
);
-- Receipts contain a request digest rather than a duplicate of personal text.
-- Account deletion removes authenticated replay keys; anonymous receipts keep
-- the existing IP-bucket retention policy and carry no actor_id.
create table private.r3213_lssi_rebuts (
 subjecte pg_catalog.text not null, operacio_id pg_catalog.uuid not null,
 peticio_sha256 pg_catalog.text not null check(peticio_sha256 ~ '^[a-f0-9]{64}$'), rebut pg_catalog.jsonb not null,
 actor_id pg_catalog.uuid references auth.users(id) on delete cascade,
 primary key(subjecte,operacio_id)
);
alter table private.r3213_lssi_flux enable row level security;
alter table private.r3213_lssi_audit enable row level security;
alter table private.r3213_lssi_rebuts enable row level security;
revoke all on private.r3213_lssi_flux,private.r3213_lssi_audit,private.r3213_lssi_rebuts from public,anon,authenticated,service_role;
-- No raw table SELECT (including IP / complainant) is added. All DTOs are explicit.

-- Both old and new transports share one workflow. This trigger observes
-- legacy human decisions too; it cannot authorize a decision by itself.
create function private.r3213_lssi_sync() returns pg_catalog.trigger language plpgsql volatile security definer set search_path='' as $$
declare f private.r3213_lssi_flux; target pg_catalog.text; reason pg_catalog.text;
begin
 if new.objecte_tipus not in('publicacio','producte','esdeveniment') or not exists(select 1 from public.section_submissions x where x.id::pg_catalog.text=new.objecte_id and x.visibility='public') then return new; end if;
 target:=case new.estat when 'pendent' then 'rebuda' when 'retirada' then 'ocultacio_cautelar' when 'desestimada' then 'arxivada' else 'resolta' end;
 if tg_op='INSERT' then
  insert into private.r3213_lssi_flux values(new.id,target,1,pg_catalog.clock_timestamp());
  insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values(new.id,auth.uid(),target,'Denúncia rebuda; pendent de revisió humana.');
 else
  select * into f from private.r3213_lssi_flux where denuncia_id=new.id for update;
  if not found then
   insert into private.r3213_lssi_flux values(new.id,target,1,pg_catalog.clock_timestamp());
   insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values(new.id,auth.uid(),target,'Revisió de denúncia històrica.');
  elsif f.estat<>target and not(new.estat='pendent' and f.estat='en_revisio') then
   select justificacio into reason from private.lssi_revisions where denuncia_id=new.id;
   update private.r3213_lssi_flux set estat=target,versio=versio+1,modificada_al=pg_catalog.clock_timestamp() where denuncia_id=new.id;
   insert into private.r3213_lssi_audit(denuncia_id,actor_id,anterior,estat,justificacio) values(new.id,auth.uid(),f.estat,target,coalesce(reason,'Revisió humana mitjançant el transport anterior.'));
  end if;
 end if;
 return new;
end; $$;
revoke all on function private.r3213_lssi_sync() from public,anon,authenticated,service_role;
create trigger r3213_lssi_insercio after insert on public.denuncies for each row execute function private.r3213_lssi_sync();
create trigger r3213_lssi_decisio after update of estat on public.denuncies for each row when(old.estat is distinct from new.estat) execute function private.r3213_lssi_sync();
-- Existing cases are imported with their existing state, not reset to pending.
insert into private.r3213_lssi_flux(denuncia_id,estat,versio)
 select d.id,case d.estat when 'pendent' then 'rebuda' when 'retirada' then 'ocultacio_cautelar' when 'desestimada' then 'arxivada' else 'resolta' end,1
 from public.denuncies d join public.section_submissions x on x.id::pg_catalog.text=d.objecte_id
 where x.visibility='public' and d.objecte_tipus in('publicacio','producte','esdeveniment');
insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio)
 select f.denuncia_id,null,f.estat,'Importació de l’estat de la denúncia anterior; cap decisió nova.' from private.r3213_lssi_flux f;

create index r3213_denuncies_ip_rafega on public.denuncies(ip_hash,creat_al);

-- Existing own-row RLS is preserved. Table grants cannot expose IP hashes,
-- complainant identity or private authorship through SELECT *.
revoke select on public.denuncies from public,anon,authenticated;
grant select(id,tenant_id,objecte_tipus,objecte_id,motiu,detall,estat,creat_al,revisada_al) on public.denuncies to authenticated;

create or replace function private.denuncies_abans_insercio()
returns pg_catalog.trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo    pg_catalog.uuid := (select auth.uid());
  v_ip    pg_catalog.text := private.empremta_ip_moderacio();
  v_n     pg_catalog.int4;
  v_maxim pg_catalog.int4;
  v_total pg_catalog.int4;
begin
  new.id := pg_catalog.gen_random_uuid();
  new.denunciant := v_jo;
  new.estat := 'pendent';
  new.creat_al := now();
  new.revisada_al := null;
  new.ip_hash := v_ip;
  new.detall := nullif(btrim(new.detall), '');

  perform pg_advisory_xact_lock(hashtextextended('denuncies:' || coalesce(v_jo::pg_catalog.text, v_ip, 'anon'), 0));
  if v_jo is not null and exists(select 1 from public.denuncies d where d.denunciant=v_jo and d.estat='pendent' and d.objecte_tipus=new.objecte_tipus and d.objecte_id=new.objecte_id) then return null; end if;
  -- All insertion paths (RPC and raw insert) share the same quota. The IP
  -- is derived from the trusted ingress headers, never a function parameter.
  perform pg_advisory_xact_lock(hashtextextended('sdp:lssi:ip:' || coalesce(v_ip,'shared'),0));
  if (v_jo is not null and (select count(*) from public.denuncies d where d.denunciant=v_jo and d.creat_al>pg_catalog.clock_timestamp()-'1 minute'::pg_catalog.interval)>=5)
    or (select count(*) from public.denuncies d where d.ip_hash is not distinct from v_ip and d.creat_al>pg_catalog.clock_timestamp()-'1 minute'::pg_catalog.interval)>=10 then
    raise exception using errcode='42900',message='SDP-LSSI-429';
  end if;
  if v_jo is not null then
    if exists (select 1 from public.denuncies d
                where d.denunciant = v_jo and d.estat = 'pendent'
                  and d.objecte_tipus = new.objecte_tipus and d.objecte_id = new.objecte_id) then
      return null;   -- Ja l'havia denunciada i està pendent: no es repetix (row_count 0).
    end if;
    select count(*) into v_n from public.denuncies d
     where d.denunciant = v_jo and d.creat_al > now() - '1 hour'::pg_catalog.interval;
    v_maxim := 20;
  else
    -- Fase D (261020, revisió) · El sostre comú de les anònimes, sota un sol
    -- pany: cap IP nova (ni cap capçalera inventada) no el passa.
    perform pg_advisory_xact_lock(hashtextextended('denuncies:anon-global', 0));
    select count(*) into v_total from public.denuncies d
     where d.denunciant is null and d.creat_al > now() - '1 hour'::pg_catalog.interval;
    if v_total >= 300 then
      raise exception 'SDP-MOD-429: ara mateix hi ha massa denúncies anònimes. Entra per a denunciar.' using errcode = '42900';
    end if;
    select count(*) into v_n from public.denuncies d
     where d.denunciant is null and d.ip_hash is not distinct from v_ip
       and d.creat_al > now() - '1 hour'::pg_catalog.interval;
    v_maxim := case when v_ip is null then 50 else 10 end;
  end if;
  if v_n >= v_maxim then
    raise exception 'SDP-MOD-429: has enviat massa denúncies en poc de temps.' using errcode = '42900';
  end if;
  return new;
end;
$$;
revoke execute on function private.denuncies_abans_insercio() from public, anon, authenticated;

drop trigger if exists denuncies_abans_insercio on public.denuncies;
create trigger denuncies_abans_insercio before insert on public.denuncies
  for each row execute function private.denuncies_abans_insercio();

create function public.registra_denuncia_diligent(p_publicacio pg_catalog.uuid,p_motiu pg_catalog.text,p_detall pg_catalog.text,p_operacio pg_catalog.uuid)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); ip pg_catalog.text:=private.empremta_ip_moderacio(); subject pg_catalog.text; req pg_catalog.jsonb; prev private.r3213_lssi_rebuts; did pg_catalog.uuid; result pg_catalog.jsonb; tip pg_catalog.text;
begin
 if who is not null and not coalesce(private.copub_compte_actiu(who),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_publicacio is null or p_operacio is null or p_motiu is null or p_motiu not in('ofensiu','spam_frau','desinformacio','altre')
  or p_detall is null or pg_catalog.char_length(btrim(p_detall)) not between 1 and 1000 then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 subject:=coalesce(who::pg_catalog.text,'anon:'||coalesce(ip,'shared'));
 req:=jsonb_build_object('publicacio',p_publicacio,'motiu',p_motiu,'detall',btrim(p_detall));
 perform pg_advisory_xact_lock(hashtextextended('sdp:lssi:subject:'||subject,0));
 select * into prev from private.r3213_lssi_rebuts where subjecte=subject and operacio_id=p_operacio;
 if found then
  if prev.peticio_sha256<>pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex') then raise exception using errcode='40001',message='SDP-LSSI-REPLAY-CONFLICT'; end if;
  return prev.rebut||jsonb_build_object('repetida',true);
 end if;
 perform public.denuncia_publicacio_mur(p_publicacio,p_motiu,btrim(p_detall));
 select d.id,d.objecte_tipus into did,tip from public.denuncies d where d.objecte_id=p_publicacio::pg_catalog.text
  and d.objecte_tipus in('publicacio','producte','esdeveniment') and d.denunciant is not distinct from who
  and (who is not null or d.ip_hash is not distinct from ip) and d.estat='pendent' order by d.creat_al desc,d.id limit 1;
 if did is null then raise exception using errcode='55000',message='SDP-LSSI-NO-RECEIPT'; end if;
 insert into private.r3213_lssi_flux values(did,'rebuda',1,pg_catalog.clock_timestamp()) on conflict do nothing;
 if not exists(select 1 from private.r3213_lssi_audit where denuncia_id=did) then
  insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values(did,who,'rebuda','Denúncia rebuda; pendent de revisió humana.');
 end if;
 select jsonb_build_object('id',did,'estat',f.estat,'versio',f.versio,'repetida',false) into result from private.r3213_lssi_flux f where f.denuncia_id=did;
 insert into private.r3213_lssi_rebuts values(subject,p_operacio,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex'),result,who);
 return result;
end; $$;
revoke all on function public.registra_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) from public,anon,authenticated,service_role;
grant execute on function public.registra_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) to anon,authenticated;

create function public.revisa_denuncia_diligent(p_id pg_catalog.uuid,p_estat_esperat pg_catalog.text,p_versio pg_catalog.int4,p_estat pg_catalog.text,p_justificacio pg_catalog.text,p_operacio pg_catalog.uuid)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); f private.r3213_lssi_flux; d public.denuncies; s public.section_submissions; req pg_catalog.jsonb; prev private.r3213_lssi_rebuts; subject pg_catalog.text; result pg_catalog.jsonb;
begin
 if who is null or not coalesce(private.es_superadmin(),false) or not coalesce(private.copub_compte_actiu(who),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_id is null or p_operacio is null or p_versio is null or p_versio<1 or p_justificacio is null or pg_catalog.char_length(btrim(p_justificacio)) not between 1 and 2000
  or p_estat_esperat is null or p_estat is null or not ((p_estat_esperat='rebuda' and p_estat in('en_revisio','arxivada'))
   or (p_estat_esperat='en_revisio' and p_estat in('ocultacio_cautelar','arxivada','resolta'))
   or (p_estat_esperat='ocultacio_cautelar' and p_estat in('resolta','arxivada'))) then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 subject:='review:'||who::pg_catalog.text;
 req:=jsonb_build_object('id',p_id,'estatEsperat',p_estat_esperat,'versio',p_versio,'estat',p_estat,'justificacio',btrim(p_justificacio));
 perform pg_advisory_xact_lock(hashtextextended('sdp:lssi:subject:'||subject,0));
 select * into prev from private.r3213_lssi_rebuts where subjecte=subject and operacio_id=p_operacio;
 if found then
  if prev.peticio_sha256<>pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex') then raise exception using errcode='40001',message='SDP-LSSI-REPLAY-CONFLICT'; end if;
  return prev.rebut||jsonb_build_object('repetida',true);
 end if;
 select * into d from public.denuncies where id=p_id for update;
 select * into f from private.r3213_lssi_flux where denuncia_id=p_id for update;
 if not found or d.objecte_tipus not in('publicacio','producte','esdeveniment') then raise exception using errcode='22023',message='SDP-LSSI-404'; end if;
 if f.estat<>p_estat_esperat or f.versio<>p_versio then raise exception using errcode='40001',message='SDP-LSSI-409'; end if;
 if p_estat='ocultacio_cautelar' then
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||d.objecte_id,0));
  select * into s from public.section_submissions where id::pg_catalog.text=d.objecte_id and visibility='public' for update;
  if not found then raise exception using errcode='22023',message='SDP-LSSI-404'; end if;
  if s.moderation_state<>'visible' or s.deleted_at is not null or exists(select 1 from private.mur_publicacions_revocades where submission_id=s.id) then
   raise exception using errcode='40001',message='SDP-LSSI-409';
  end if;
  update public.section_submissions set moderation_state='retirada_cautelar' where id=s.id;
 end if;
 update private.r3213_lssi_flux set estat=p_estat,versio=versio+1,modificada_al=pg_catalog.clock_timestamp() where denuncia_id=p_id;
 insert into private.r3213_lssi_audit(denuncia_id,actor_id,anterior,estat,justificacio) values(p_id,who,f.estat,p_estat,btrim(p_justificacio));
 -- Closing a case never silently restores a withdrawn resource.
 update public.denuncies set estat=case p_estat when 'arxivada' then 'desestimada' when 'resolta' then 'revisada' when 'ocultacio_cautelar' then 'retirada' else 'pendent' end,
  revisada_al=case when p_estat in('arxivada','resolta','ocultacio_cautelar') then pg_catalog.clock_timestamp() else null end where id=p_id;
 result:=jsonb_build_object('id',p_id,'estat',p_estat,'versio',f.versio+1,'repetida',false);
 insert into private.r3213_lssi_rebuts values(subject,p_operacio,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex'),result,who);
 return result;
end; $$;
revoke all on function public.revisa_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) from public,anon,authenticated,service_role;
grant execute on function public.revisa_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) to authenticated;

create function public.llista_denuncies_diligents(p_estat pg_catalog.text,p_limit pg_catalog.int4 default 50)
returns pg_catalog.jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.es_superadmin(),false) or not coalesce(private.copub_compte_actiu(auth.uid()),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_estat is null or p_estat not in('rebuda','en_revisio','ocultacio_cautelar','arxivada','resolta') or p_limit is null or p_limit not between 1 and 100 then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 return (select coalesce(jsonb_agg(x.fila order by x.creat_al,x.id),'[]'::pg_catalog.jsonb) from (
  select d.id,d.creat_al,jsonb_build_object('id',d.id,'publicacioId',d.objecte_id,'motiu',d.motiu,'detall',d.detall,'estat',f.estat,'versio',f.versio) fila
  from private.r3213_lssi_flux f join public.denuncies d on d.id=f.denuncia_id
  where f.estat=p_estat and d.objecte_tipus in('publicacio','producte','esdeveniment') order by d.creat_al,d.id limit p_limit) x);
end; $$;
revoke all on function public.llista_denuncies_diligents(pg_catalog.text,pg_catalog.int4) from public,anon,authenticated,service_role;
grant execute on function public.llista_denuncies_diligents(pg_catalog.text,pg_catalog.int4) to authenticated;
notify pgrst,'reload schema';
commit;
