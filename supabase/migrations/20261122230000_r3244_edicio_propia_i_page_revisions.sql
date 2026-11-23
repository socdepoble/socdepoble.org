-- R32.44 · Edició pròpia CAS i revisions de pàgina. NOMÉS paquet local; desplegament manual.
-- Depén de: 2611122200, 2611111735, 2610241400, 20261122160000 i 2611070600 (base privada de l'exportació).
-- Conserva immutable el snippet manual R32.11 i les seues identitats SHA.
-- Cap privilegi cru nou. Les capacitats del client s'activen després del rebut SQL.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- La reaplicació acredita la identitat anterior abans de substituir cap peça.
-- Una col·lisió inicial o drift d'ACL/DDL/cos no es repara silenciosament.
do $preflight$
begin
  if to_regclass('private.r3244_edicio_contract') is null then
    if to_regclass('public.page_revisions') is not null or to_regclass('private.publicacions_beta_cas_rebuts') is not null
      or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where
        (n.nspname='private' and p.proname in ('publicacions_beta_token','beta_payload_valid','page_revisions_immutable','page_revision_camps_valid','page_revision_autoritza','page_revision_append','r3244_edicio_snapshot','exporta_les_meues_dades_base_abans_r3244','exporta_les_meues_dades_embolcall_r3244'))
        or (n.nspname='public' and p.proname in ('publica_section_submission_beta_cas','desa_revisio_pagina','restaura_revisio_pagina','llista_revisions_pagina'))) then
      raise exception 'SDP-R3244-000: col·lisió amb identitat desconeguda.' using errcode='22023';
    end if;
  else
    if to_regprocedure('private.r3244_edicio_snapshot()') is null then raise exception 'SDP-R3244-000: falta la identitat.' using errcode='22023'; end if;
    if (select snapshot from private.r3244_edicio_contract where id=1) is distinct from private.r3244_edicio_snapshot() then
      raise exception 'SDP-R3244-000: drift de DDL, funcions, polítiques o privilegis; revisió manual.' using errcode='22023';
    end if;
  end if;
end $preflight$;

create table if not exists private.publicacions_beta_cas_rebuts (
  operation_id uuid primary key,
  submission_id uuid not null references public.section_submissions(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.towns(id) on delete cascade,
  request_sha256 bytea not null check (octet_length(request_sha256)=32),
  confirmed_updated_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp()
);
alter table private.publicacions_beta_cas_rebuts enable row level security;
revoke all on private.publicacions_beta_cas_rebuts from public,anon,authenticated,service_role;
create index if not exists publicacions_beta_cas_actor_dia on private.publicacions_beta_cas_rebuts(actor_id,created_at);

create or replace function private.publicacions_beta_token()
returns trigger language plpgsql set search_path='' as $$
begin
  if not isfinite(old.updated_at) then raise exception 'SDP-BETA-001: token anterior invàlid.' using errcode='22023'; end if;
  new.updated_at:=greatest(clock_timestamp(),old.updated_at+interval '1 microsecond');
  return new;
end $$;
revoke all on function private.publicacions_beta_token() from public,anon,authenticated,service_role;
-- Després del trigger històric de dates i abans del token opcional R32.11.
drop trigger if exists zzz_r3210_beta_token on public.section_submissions;
create trigger zzz_r3210_beta_token before update on public.section_submissions
  for each row execute function private.publicacions_beta_token();

-- Valors que acabarien a React només poden ser primitius del tipus esperat.
create or replace function private.beta_payload_valid(p_payload jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare k text; v jsonb;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>700000 then return false; end if;
  for k,v in select key,value from jsonb_each(p_payload) loop
    if k in ('title','name','description','summary','content','subtitle','post_subtitle','entradilla','lead','image_url','image','heroImage','logoImage','logo_image','icon','type','date','publishDate','publish_date','location','unit','category','currency')
      and jsonb_typeof(v) not in ('string','null') then return false; end if;
    if k in ('mostrarAlMur','ocultarDelMur') and jsonb_typeof(v)<>'boolean' then return false; end if;
    if k in ('price','preu','preuInicial') and jsonb_typeof(v) not in ('number','string','null') then return false; end if;
    if k in ('tags','categories') then
      if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>50 then return false; end if;
      if exists(select 1 from jsonb_array_elements(v) x where jsonb_typeof(x)<>'string' or length(x#>>'{}')>80) then return false; end if;
    end if;
  end loop;
  return true;
end $$;
revoke all on function private.beta_payload_valid(jsonb) from public,anon,authenticated,service_role;

create or replace function public.publica_section_submission_beta_cas(
  p_id uuid,p_tenant_id uuid,p_section_id text,p_payload jsonb,p_title text,p_description text,
  p_author_org_id uuid,p_preserve_author boolean,p_expected_updated_at timestamptz,p_operation_id uuid
) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare actor uuid:=auth.uid(); s public.section_submissions; r private.publicacions_beta_cas_rebuts;
  payload0 jsonb; org0 uuid; hash0 bytea; replay0 boolean:=false;
begin
  if actor is null then raise exception 'SDP-BETA-002: cal sessió.' using errcode='42501'; end if;
  if p_id is null or p_tenant_id is null or p_operation_id is null or p_section_id is null
    or p_section_id not in ('mur','mercat','events') or p_title is null or length(p_title)>1000
    or length(coalesce(p_description,''))>20000 or p_preserve_author is null
    or (p_preserve_author and p_author_org_id is not null)
    or (p_expected_updated_at is not null and not isfinite(p_expected_updated_at))
    or not private.beta_payload_valid(p_payload) then
    raise exception 'SDP-BETA-001: petició invàlida.' using errcode='22023';
  end if;
  if not coalesce(private.is_town_member(p_tenant_id),false) or not private.copub_compte_actiu(actor)
    or not private.ha_acceptat_normes(actor) then
    raise exception 'SDP-BETA-002: publicació no disponible o normes pendents.' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp:beta:op:'||p_operation_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended('sdp:beta:actor:'||actor::text,0));
  -- Mateix pany de recurs que R21 i R32.11; cap inversió de panys amb Notes.
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||p_id::text,0));
  if exists(select 1 from private.mur_actes_notes where act_id=p_id)
    or exists(select 1 from public.notes where published_submission_id=p_id)
    or exists(select 1 from private.mur_publicacions_revocades where submission_id=p_id) then
    raise exception 'SDP-BETA-002: acte vinculat o retirat; usa el seu contracte.' using errcode='42501';
  end if;
  hash0:=sha256(convert_to(jsonb_build_array(p_id,p_tenant_id,actor,p_section_id,p_payload,p_title,p_description,p_author_org_id,p_preserve_author,
    case when p_expected_updated_at is not null then to_char(p_expected_updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') end)::text,'UTF8'));
  select * into r from private.publicacions_beta_cas_rebuts where operation_id=p_operation_id;
  if found and (r.actor_id<>actor or r.tenant_id<>p_tenant_id or r.submission_id<>p_id or r.request_sha256<>hash0) then
    raise exception 'SDP-BETA-005: operació reutilitzada.' using errcode='22023';
  end if;
  select * into s from public.section_submissions where id=p_id for update;
  org0:=case when p_preserve_author and s.id is not null then s.author_org_id else p_author_org_id end;
  if s.id is not null and (s.tenant_id<>p_tenant_id or s.section_id<>p_section_id
    or s.author_org_id is distinct from org0
    or (s.author_org_id is null and s.owner_user_id<>actor)) then
    raise exception 'SDP-BETA-002: publicació no disponible.' using errcode='42501';
  end if;
  if not coalesce(public.pot_signar_com_organitzacio(org0,p_tenant_id),false) then
    raise exception 'SDP-BETA-002: signatura no autoritzada.' using errcode='42501';
  end if;
  if r.operation_id is not null then
    if s.id is null or s.updated_at is distinct from r.confirmed_updated_at then
      raise exception 'SDP-BETA-003: hi ha una versió posterior.' using errcode='40001';
    end if;
    replay0:=true;
  else
    if (p_expected_updated_at is null and s.id is not null)
      or (p_expected_updated_at is not null and (s.id is null or s.updated_at is distinct from p_expected_updated_at)) then
      raise exception 'SDP-BETA-003: la publicació ha canviat.' using errcode='40001';
    end if;
    if (select count(*) from private.publicacions_beta_cas_rebuts where actor_id=actor and created_at>clock_timestamp()-interval '1 day')>=200 then
      raise exception 'SDP-BETA-429: quota diària de 200 operacions.' using errcode='54000';
    end if;
    -- Purga d'autoritat. Els drets ja publicats es conserven des de la fila real.
    if nullif(btrim(p_payload->>'copyright'),'') is not null and (s.id is null or p_payload->'copyright' is distinct from s.payload->'copyright') then
      raise exception 'SDP-BETA-001: els drets requerixen el seu contracte explícit.' using errcode='22023';
    end if;
    payload0:=p_payload-array['id','tenant_id','tenantId','owner_user_id','ownerUserId','author_org_id','authorOrgId','author_entity_id','author_id','author_user_id','author_agent_id','authorAgentId','isSystem','isAvis','is_pinned','pinned_position','mainHref','slug','article','origen','copyright','seller','autor','source','srcDelPort','author','author_name','author_avatar','sectionId','section_id','created_at','updated_at','updatedAt','_editorialVersio','_editorial','_projeccioLocal','_projeccioPendent']::text[];
    if s.id is not null and s.payload ? 'copyright' then payload0:=payload0||jsonb_build_object('copyright',s.payload->'copyright'); end if;
    if payload0->>'type'='sistema' or not private.mur_public_eligible(payload0) then
      raise exception 'SDP-BETA-002: contingut no publicable.' using errcode='42501';
    end if;
    if s.id is null then
      insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload,author_org_id)
      values(p_id,p_tenant_id,actor,p_section_id,p_title,p_description,payload0,org0) returning * into s;
    else
      if not isfinite(s.updated_at) or not isfinite(s.created_at) or s.created_at>s.updated_at then raise exception 'SDP-BETA-001: dates incoherents.' using errcode='22023'; end if;
      update public.section_submissions set title=p_title,description=p_description,payload=payload0 where id=p_id returning * into s;
      -- El trigger històric usa now(), constant dins la transacció. Assegurem
      -- avanç estricte sense tocar ni substituir eixe trigger compartit.
      if s.updated_at<=p_expected_updated_at then
        raise exception 'SDP-BETA-003: token de servidor no avançat.' using errcode='40001';
      end if;
    end if;
    insert into private.publicacions_beta_cas_rebuts(operation_id,submission_id,actor_id,tenant_id,request_sha256,confirmed_updated_at)
      values(p_operation_id,p_id,actor,p_tenant_id,hash0,s.updated_at);
  end if;
  return jsonb_build_object('id',s.id,'tenant_id',s.tenant_id,'owner_user_id',s.owner_user_id,'section_id',s.section_id,'operation_id',p_operation_id,
    'author_org_id',s.author_org_id,'created_at',to_char(s.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'updated_at',to_char(s.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'replay',replay0);
end $$;
revoke all on function public.publica_section_submission_beta_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid) from public,anon,authenticated,service_role;
grant execute on function public.publica_section_submission_beta_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid) to authenticated;

-- Historial privat: les RPC exposen només el recurs autoritzat, mai perfils/contactes.
create table if not exists public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id),
  section_id text not null check(section_id in ('sistema','mur','mercat','events')),
  slug text check(slug ~ '^[A-Za-z0-9_-]{1,128}$'),
  item_id uuid,
  version_num integer not null check(version_num>0),
  author_id uuid references auth.users(id) on delete set null,
  actor_entity_id uuid references public.organizations(id) on delete set null,
  payload_jsonb jsonb not null check(jsonb_typeof(payload_jsonb)='object' and octet_length(payload_jsonb::text)<=700000),
  created_at timestamptz not null default clock_timestamp(),
  operation_id uuid not null unique,
  request_sha256 bytea not null check(octet_length(request_sha256)=32),
  restored_from integer check(restored_from>0),
  check((slug is null)<>(item_id is null)),
  check(section_id<>'sistema' or slug is not null)
);
create unique index if not exists page_revisions_slug_version on public.page_revisions(tenant_id,section_id,slug,version_num) where slug is not null;
create unique index if not exists page_revisions_item_version on public.page_revisions(tenant_id,section_id,item_id,version_num) where item_id is not null;
create index if not exists page_revisions_author_dia on public.page_revisions(author_id,created_at);
-- v1.2.23 · L4-03 i L6-01 (Gauntlet R1) · Les revisions d'una publicació viuen el mateix que la publicació: esborrar-la
-- (revoca_publicacio_mur o la purga d'una baixa vençuda) s'enduu el seu historial, i un id reutilitzat no hereta
-- revisions d'altri. Un esborrat directe d'Auth no esborra la publicació (section_submissions no té FK cap a auth.users,
-- 2611110100): les seues revisions s'hi queden amb l'author_id a null. Una retirada LSSI cautelar no esborra la fila
-- (R32.5) i les revisions la seguixen. Les revisions editorials (slug) no tenen fila mare: continuen append-only i en
-- una baixa només perden l'author_id. Va com a ALTER idempotent, i no dins del create table, perquè una base de
-- laboratori que ja tinga la taula també la reba.
-- v1.2.23 · R2D-03 (Gauntlet R2) · En una base de laboratori amb la 130 d'abans de l'R1, una revocació esborrava la
-- publicació i en deixava les revisions òrfenes, i la clau forana no s'hi podria afegir (23503). Abans d'afegir-la es
-- retiren eixes òrfenes, com faria ara la cascada; el disparador append-only s'aparta només per a eixa supressió i torna
-- a estar actiu dins de la mateixa transacció. A Producció i en una base nova no n'hi ha, i la branca no s'executa.
do $fk$
begin
  if not exists(select 1 from pg_catalog.pg_constraint where conrelid='public.page_revisions'::regclass and conname='page_revisions_item_fk') then
    if exists(select 1 from public.page_revisions r where r.item_id is not null and not exists(select 1 from public.section_submissions s where s.id=r.item_id)) then
      alter table public.page_revisions disable trigger page_revisions_immutable;
      delete from public.page_revisions r where r.item_id is not null and not exists(select 1 from public.section_submissions s where s.id=r.item_id);
      alter table public.page_revisions enable trigger page_revisions_immutable;
      raise notice 'SDP-R3244-FK: revisions òrfenes d''una publicació ja esborrada retirades abans de la clau forana.';
    end if;
    alter table public.page_revisions add constraint page_revisions_item_fk foreign key (item_id) references public.section_submissions(id) on delete cascade;
  end if;
end $fk$;
create index if not exists page_revisions_item on public.page_revisions(item_id) where item_id is not null;
alter table public.page_revisions enable row level security;
revoke all on public.page_revisions from public,anon,authenticated,service_role;

create or replace function private.page_revisions_immutable()
returns trigger language plpgsql set search_path='' as $$
begin
  -- Les FK només poden llevar l'identificador en una baixa de compte/entitat;
  -- no poden alterar el cos, la versió o eliminar l'historial.
  if tg_op='UPDATE' and pg_trigger_depth()>1
    and (to_jsonb(new)-array['author_id','actor_entity_id'])=(to_jsonb(old)-array['author_id','actor_entity_id'])
    and (new.author_id is not distinct from old.author_id or new.author_id is null)
    and (new.actor_entity_id is not distinct from old.actor_entity_id or new.actor_entity_id is null) then return new; end if;
  -- v1.2.23 · L4-03 i L6-01 (Gauntlet R1) · L'única supressió és la cascada de page_revisions_item_fk, quan la
  -- publicació mare ja no existix. Un DELETE directe continua prohibit.
  if tg_op='DELETE' and pg_trigger_depth()>1 and old.item_id is not null
    and not exists(select 1 from public.section_submissions s where s.id=old.item_id) then return old; end if;
  raise exception 'SDP-PAGE-405: historial append-only.' using errcode='42501';
end $$;
revoke all on function private.page_revisions_immutable() from public,anon,authenticated,service_role;
drop trigger if exists page_revisions_immutable on public.page_revisions;
create trigger page_revisions_immutable before update or delete on public.page_revisions for each row execute function private.page_revisions_immutable();

create or replace function private.page_revision_camps_valid(p_payload jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare k text; v jsonb;
begin
  if not private.beta_payload_valid(p_payload) or p_payload='{}'::jsonb then return false; end if;
  for k,v in select key,value from jsonb_each(p_payload) loop
    if k not in ('title','subtitle','lead','content','heroImage','logoImage','copyright','icon','publishDate','tags','mostrarAlMur') then return false; end if;
    if k='mostrarAlMur' then if jsonb_typeof(v)<>'boolean' then return false; end if;
    elsif k='tags' then null;
    elsif k='publishDate' and v='null'::jsonb then null;
    elsif jsonb_typeof(v)<>'string' or length(v#>>'{}')>(case when k='content' then 600000 else 4000 end) then return false;
    end if;
  end loop;
  return true;
end $$;
revoke all on function private.page_revision_camps_valid(jsonb) from public,anon,authenticated,service_role;

create or replace function private.page_revision_autoritza(p_tenant uuid,p_section text,p_slug text,p_item uuid,p_org uuid)
returns void language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); s public.section_submissions; font jsonb; n integer;
begin
  if u is null or not private.copub_compte_actiu(u) or not coalesce(private.is_town_member(p_tenant),false)
    or p_section is null or p_section not in ('sistema','mur','mercat','events')
    or (p_slug is null)=(p_item is null) or (p_slug is not null and p_slug !~ '^[A-Za-z0-9_-]{1,128}$') then
    raise exception 'SDP-PAGE-002: recurs no disponible.' using errcode='42501';
  end if;
  if p_item is not null then
    select * into s from public.section_submissions where id=p_item and tenant_id=p_tenant and section_id=p_section;
    if not found or s.author_org_id is distinct from p_org
      or (s.author_org_id is null and s.owner_user_id<>u)
      or not coalesce(public.pot_signar_com_organitzacio(s.author_org_id,p_tenant),false)
      or exists(select 1 from private.mur_publicacions_revocades where submission_id=p_item) then
      raise exception 'SDP-PAGE-002: recurs no disponible.' using errcode='42501';
    end if;
  else
    if p_org is null or p_org is distinct from private.copub_actor_oficial('socdepoble')
      or not coalesce(public.pot_signar_com_organitzacio(p_org,p_tenant),false) then
      raise exception 'SDP-PAGE-002: cal identitat editorial oficial.' using errcode='42501';
    end if;
    if p_section='sistema' then
      if not exists(select 1 from private.recursos_copublicacio_paquet where tipus='pagina' and recurs_id=p_slug) then
        raise exception 'SDP-PAGE-002: pàgina desconeguda.' using errcode='42501';
      end if;
    elsif p_section in ('mur','events') then
      select count(*) into n from public.app_content c cross join lateral jsonb_array_elements(case when jsonb_typeof(c.payload)='array' then c.payload else '[]'::jsonb end) x
        where c.tenant_id=p_tenant and c.key=case p_section when 'mur' then 'feedPosts' else 'events' end and x->>'id'=p_slug and private.mur_public_eligible(x);
      if n<>1 then raise exception 'SDP-PAGE-002: peça editorial desconeguda.' using errcode='42501'; end if;
    else raise exception 'SDP-PAGE-002: recurs no disponible.' using errcode='42501'; end if;
  end if;
end $$;
revoke all on function private.page_revision_autoritza(uuid,text,text,uuid,uuid) from public,anon,authenticated,service_role;

-- Una funció interna compartix panys, CAS i idempotència entre desar/restaurar.
create or replace function private.page_revision_append(p_tenant uuid,p_section text,p_slug text,p_item uuid,p_payload jsonb,p_org uuid,p_expected integer,p_op uuid,p_restore integer)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare u uuid:=auth.uid(); latest0 integer; h bytea; r public.page_revisions; payload0 jsonb:=p_payload; dia0 bigint; total0 bigint;
begin
  perform private.page_revision_autoritza(p_tenant,p_section,p_slug,p_item,p_org);
  if p_op is null or p_expected is null or p_expected<0 or p_expected>=2147483647
    or (p_restore is not null and p_restore<1) or (p_restore is null and not private.page_revision_camps_valid(p_payload)) then
    raise exception 'SDP-PAGE-001: revisió invàlida.' using errcode='22023';
  end if;
  if not private.ha_acceptat_normes(u) then raise exception 'SDP-PAGE-002: normes pendents.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp:page:op:'||p_op::text,0));
  perform pg_advisory_xact_lock(hashtextextended('sdp:page:actor:'||u::text,0));
  perform pg_advisory_xact_lock(hashtextextended('sdp:page:'||jsonb_build_array(p_tenant,p_section,p_slug,p_item)::text,0));
  h:=sha256(convert_to(jsonb_build_array(p_tenant,p_section,p_slug,p_item,p_payload,p_org,p_expected,p_restore,u)::text,'UTF8'));
  select coalesce(max(version_num),0) into latest0 from public.page_revisions
    where tenant_id=p_tenant and section_id=p_section and slug is not distinct from p_slug and item_id is not distinct from p_item;
  select * into r from public.page_revisions where operation_id=p_op;
  if found then
    if r.request_sha256<>h or r.author_id is distinct from u then raise exception 'SDP-PAGE-005: operació reutilitzada.' using errcode='22023'; end if;
    if r.version_num<>latest0 then raise exception 'SDP-PAGE-003: hi ha una revisió posterior.' using errcode='40001'; end if;
    return (to_jsonb(r)-'request_sha256')||jsonb_build_object('replay',true);
  end if;
  if latest0<>p_expected then raise exception 'SDP-PAGE-003: conflicte de versió.' using errcode='40001'; end if;
  if latest0>=10000 or (select count(*) from public.page_revisions where author_id=u and created_at>clock_timestamp()-interval '1 day')>=100 then
    raise exception 'SDP-PAGE-429: quota de revisions assolida.' using errcode='54000';
  end if;
  if p_restore is not null then
    select payload_jsonb into payload0 from public.page_revisions where tenant_id=p_tenant and section_id=p_section
      and slug is not distinct from p_slug and item_id is not distinct from p_item and version_num=p_restore;
    if not found then raise exception 'SDP-PAGE-001: versió desconeguda.' using errcode='22023'; end if;
  end if;
  insert into public.page_revisions(tenant_id,section_id,slug,item_id,version_num,author_id,actor_entity_id,payload_jsonb,operation_id,request_sha256,restored_from)
    values(p_tenant,p_section,p_slug,p_item,latest0+1,u,p_org,payload0,p_op,h,p_restore) returning * into r;
  -- v1.2.23 · R2D-04 (Gauntlet R2) · Sostre d'octets per compte de L6-02 (Gauntlet R1), com el de les notes d'R22.3:
  -- 8 MiB en 24 h de totes les revisions i 50 MiB en total de les revisions de publicacions (item_id), les úniques que
  -- s'alliberen en esborrar la publicació. Les editorials (slug), que no s'esborren mai, només compten en el de 24 h, i
  -- continuen limitades per les 10.000 per recurs i les 100 diàries. Es comprova després de l'INSERT perquè totes les
  -- mides, també la de la revisió nova, siguen les desades (pg_column_size, sense descomprimir); el raise desfà l'INSERT.
  -- El pany sdp:page:actor ja serialitza les desades de la mateixa persona i page_revisions_author_dia cobrix les dues
  -- sumes. Un replay ja ha tornat abans i no consumix quota.
  select coalesce(sum(pg_column_size(x.payload_jsonb)) filter (where x.created_at>clock_timestamp()-interval '1 day'),0),
    coalesce(sum(pg_column_size(x.payload_jsonb)) filter (where x.item_id is not null),0)
    into dia0,total0 from public.page_revisions x where x.author_id=u;
  if dia0>8388608 or (r.item_id is not null and total0>52428800) then
    raise exception 'SDP-PAGE-429: quota de revisions assolida.' using errcode='54000';
  end if;
  return (to_jsonb(r)-'request_sha256')||jsonb_build_object('replay',false);
end $$;
revoke all on function private.page_revision_append(uuid,text,text,uuid,jsonb,uuid,integer,uuid,integer) from public,anon,authenticated,service_role;

create or replace function public.desa_revisio_pagina(p_tenant_id uuid,p_section_id text,p_slug text,p_item_id uuid,p_payload_jsonb jsonb,p_actor_entity_id uuid,p_expected_version integer,p_operation_id uuid)
returns jsonb language sql volatile security definer set search_path='' as $$
  select private.page_revision_append(p_tenant_id,p_section_id,p_slug,p_item_id,p_payload_jsonb,p_actor_entity_id,p_expected_version,p_operation_id,null);
$$;
create or replace function public.restaura_revisio_pagina(p_tenant_id uuid,p_section_id text,p_slug text,p_item_id uuid,p_version_num integer,p_expected_version integer,p_operation_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare org0 uuid; r public.page_revisions;
begin
  -- La signatura s'obté del recurs real; cap UUID d'actor ve de l'historial antic.
  if p_item_id is null then org0:=private.copub_actor_oficial('socdepoble');
  else select author_org_id into org0 from public.section_submissions where id=p_item_id and tenant_id=p_tenant_id and section_id=p_section_id; end if;
  return private.page_revision_append(p_tenant_id,p_section_id,p_slug,p_item_id,null,org0,p_expected_version,p_operation_id,p_version_num);
end $$;
create or replace function public.llista_revisions_pagina(p_tenant_id uuid,p_section_id text,p_slug text,p_item_id uuid,p_limit integer,p_before_version integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare org0 uuid;
begin
  if p_item_id is null then org0:=private.copub_actor_oficial('socdepoble');
  else select author_org_id into org0 from public.section_submissions where id=p_item_id and tenant_id=p_tenant_id and section_id=p_section_id; end if;
  perform private.page_revision_autoritza(p_tenant_id,p_section_id,p_slug,p_item_id,org0);
  if p_limit is null or p_limit<1 or p_limit>100 or (p_before_version is not null and p_before_version<1) then raise exception 'SDP-PAGE-001: límit invàlid.' using errcode='22023'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(x)-'request_sha256' order by x.version_num desc),'[]'::jsonb) from
    (select * from public.page_revisions where tenant_id=p_tenant_id and section_id=p_section_id and slug is not distinct from p_slug and item_id is not distinct from p_item_id
      and (p_before_version is null or version_num<p_before_version) order by version_num desc limit p_limit) x);
end $$;
revoke all on function public.desa_revisio_pagina(uuid,text,text,uuid,jsonb,uuid,integer,uuid),public.restaura_revisio_pagina(uuid,text,text,uuid,integer,integer,uuid),public.llista_revisions_pagina(uuid,text,text,uuid,integer,integer) from public,anon,authenticated,service_role;
grant execute on function public.desa_revisio_pagina(uuid,text,text,uuid,jsonb,uuid,integer,uuid),public.restaura_revisio_pagina(uuid,text,text,uuid,integer,integer,uuid),public.llista_revisions_pagina(uuid,text,text,uuid,integer,integer) to authenticated;

-- v1.2.23 · L4-03 (Gauntlet R1) · L'exportació RGPD inclou les revisions de pàgina que la persona ha escrit, sense
-- request_sha256. Embolcall, no còpia, com 2611070600 i el paquet R32.11: la base privada vigent es conserva sencera
-- amb un altre nom i la nova base_r33 hi afig page_revisions. public.exporta_les_meues_dades() no canvia de cos (R28 al
-- catàleg; a Producció, l'embolcall R32.11 sobre R28, que el seu preflight fixa per SHA) i continua cridant la base.
-- v1.2.23 · R2F-01 (Gauntlet R2) · Com a 2611070600, els blocs DO només fan comprovacions i reanomenaments (alter
-- function … rename to). L'embolcall es crea a nivell superior, com qualsevol security definer del catàleg, perquè la
-- Porta RLS (R6) el veja, i amb el nom de treball exporta_les_meues_dades_embolcall_r3244: un create de nivell superior
-- amb el nom base_r33 faria d'esta migració la creadora d'un objecte que 2611070600 ja usa (E-USA-POSTERIOR del
-- verificador estàtic). En reaplicar-la, l'embolcall vigent torna al nom de treball i el create el substituïx en el
-- lloc, amb el mateix OID i la mateixa ACL. Si falta la base, avorta amb 55000; si qui aplica no n'és la propietària,
-- el reanomenament falla amb 42501. En tots dos casos la transacció es desfà sencera i no canvia res.
do $base$
begin
  if to_regprocedure('private.exporta_les_meues_dades_base_abans_r3244()') is null then
    if to_regprocedure('private.exporta_les_meues_dades_base_r33()') is null then
      raise exception 'SDP-R3244-000: falta la base privada de l''exportació (2611070600); no s''ha canviat res.' using errcode='55000';
    end if;
    alter function private.exporta_les_meues_dades_base_r33() rename to exporta_les_meues_dades_base_abans_r3244;
  elsif to_regprocedure('private.exporta_les_meues_dades_base_r33()') is not null then
    alter function private.exporta_les_meues_dades_base_r33() rename to exporta_les_meues_dades_embolcall_r3244;
  end if;
end $base$;
create or replace function private.exporta_les_meues_dades_embolcall_r3244()
returns jsonb language plpgsql stable security definer set search_path='' as $f$
declare actor uuid:=auth.uid(); base jsonb;
begin
  if actor is null then raise exception 'SDP-EXPORT-000: cal la sessió iniciada.' using errcode='42501'; end if;
  base:=private.exporta_les_meues_dades_base_abans_r3244();
  if jsonb_typeof(base) is distinct from 'object' or base->>'format' is distinct from 'socdepoble.exportacio.v1' then
    raise exception 'SDP-R3244-EXPORT-002: format d''exportació inesperat.';
  end if;
  return base||jsonb_build_object('page_revisions',(select coalesce(jsonb_agg(to_jsonb(r)-'request_sha256' order by r.created_at,r.id),'[]'::jsonb)
    from public.page_revisions r where r.author_id=actor));
end $f$;
revoke all on function private.exporta_les_meues_dades_embolcall_r3244() from public,anon,authenticated,service_role;
do $nom$
begin
  alter function private.exporta_les_meues_dades_embolcall_r3244() rename to exporta_les_meues_dades_base_r33;
end $nom$;
revoke all on function private.exporta_les_meues_dades_base_abans_r3244() from public,anon,authenticated,service_role;
revoke all on function private.exporta_les_meues_dades_base_r33() from public,anon,authenticated,service_role;

create table if not exists private.r3244_edicio_contract(id integer primary key check(id=1),snapshot jsonb not null);
alter table private.r3244_edicio_contract enable row level security;
revoke all on private.r3244_edicio_contract from public,anon,authenticated,service_role;
create or replace function private.r3244_edicio_snapshot()
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object(
    'functions',(select jsonb_agg(jsonb_build_array(n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.proowner,p.proacl,p.proconfig,p.prosrc,p.prolang,p.prorettype,p.provolatile,p.prosecdef,p.proretset,p.pronargdefaults) order by n.nspname,p.proname,p.oid)
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace where
      (n.nspname='private' and p.proname in ('publicacions_beta_token','beta_payload_valid','page_revisions_immutable','page_revision_camps_valid','page_revision_autoritza','page_revision_append','r3244_edicio_snapshot','exporta_les_meues_dades_base_r33','exporta_les_meues_dades_base_abans_r3244','exporta_les_meues_dades_embolcall_r3244'))
      or (n.nspname='public' and p.proname in ('publica_section_submission_beta_cas','desa_revisio_pagina','restaura_revisio_pagina','llista_revisions_pagina'))),
    'tables',(select jsonb_agg(jsonb_build_array(c.oid,c.relowner,c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.relacl,
      (select jsonb_agg(jsonb_build_array(a.attname,a.atttypid,a.atttypmod,a.attnotnull,a.attacl,pg_get_expr(d.adbin,d.adrelid)) order by a.attnum)
        from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
      (select jsonb_agg(pg_get_constraintdef(x.oid) order by x.conname) from pg_constraint x where x.conrelid=c.oid),
      (select jsonb_agg(pg_get_indexdef(i.indexrelid) order by i.indexrelid) from pg_index i where i.indrelid=c.oid),
      (select jsonb_agg(to_jsonb(y)-'oid' order by y.polname) from pg_policy y where y.polrelid=c.oid)) order by c.oid)
      from pg_class c where c.oid in (to_regclass('public.page_revisions'),to_regclass('private.publicacions_beta_cas_rebuts'))),
    'triggers',(select jsonb_agg(jsonb_build_array(pg_get_triggerdef(t.oid),t.tgenabled) order by t.tgname) from pg_trigger t
      where not t.tgisinternal and (t.tgrelid=to_regclass('public.page_revisions') or (t.tgrelid=to_regclass('public.section_submissions') and t.tgname='zzz_r3210_beta_token')))
  );
$$;
revoke all on function private.r3244_edicio_snapshot() from public,anon,authenticated,service_role;
-- Els ACL per defecte no poden afegir rols ocults a les taules privades.
do $acl$
begin
  if exists(select 1 from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
    where c.oid in ('public.page_revisions'::regclass,'private.publicacions_beta_cas_rebuts'::regclass,'private.r3244_edicio_contract'::regclass) and a.grantee<>c.relowner)
    or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
      where ((n.nspname='private' and p.proname in ('publicacions_beta_token','beta_payload_valid','page_revisions_immutable','page_revision_camps_valid','page_revision_autoritza','page_revision_append','r3244_edicio_snapshot','exporta_les_meues_dades_base_r33','exporta_les_meues_dades_base_abans_r3244','exporta_les_meues_dades_embolcall_r3244'))
        or (n.nspname='public' and p.proname in ('publica_section_submission_beta_cas','desa_revisio_pagina','restaura_revisio_pagina','llista_revisions_pagina')))
      and a.grantee<>p.proowner and not(n.nspname='public' and a.grantee='authenticated'::regrole::oid and a.privilege_type='EXECUTE' and not a.is_grantable)) then
    raise exception 'SDP-R3244-000: ACL per defecte inesperat.' using errcode='22023';
  end if;
end $acl$;
insert into private.r3244_edicio_contract(id,snapshot) values(1,private.r3244_edicio_snapshot()) on conflict(id) do update set snapshot=excluded.snapshot;
notify pgrst, 'reload schema';
commit;
