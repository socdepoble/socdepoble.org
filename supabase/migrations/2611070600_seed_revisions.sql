-- P1-75 · Revisions vigents de llavor; CAS per peça i autoria de font autoritativa.
-- Depén de 2611051930, 2611011800 i private.es_superadmin(). Idempotent, transaccional.
-- NO aplicada: l'aplica el Mestre després de verificar la font i el client.
begin;
create table if not exists public.seed_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  section text not null check (section in ('mur','events')),
  seed_id text not null check (seed_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  -- Only the current writer's submitted fields are personal export data.
  -- The public payload may also retain fields from earlier public revisions.
  author_payload jsonb not null check (jsonb_typeof(author_payload)='object'),
  author_id uuid references auth.users(id) on delete set null,
  version integer not null default 1 check (version>0),
  source_version integer not null check (source_version>0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (tenant_id,section,seed_id)
);
alter table public.seed_revisions enable row level security;
revoke all on public.seed_revisions from public,anon,authenticated;
grant select (tenant_id,section,seed_id,payload,version,source_version,created_at,updated_at) on public.seed_revisions to anon,authenticated;

-- Pure JSON predicate shared by source authorization and public RLS. Only
-- publication metadata containers are traversed, never an event's dates.
create or replace function private.seed_revision_es_publica(p_font jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare pending jsonb[]:=array[p_font]; layer jsonb; n integer; visited integer:=0; container text;
begin
  while coalesce(array_length(pending,1),0)>0 loop
    n:=array_length(pending,1);layer:=pending[n];pending:=pending[1:n-1];visited:=visited+1;
    if visited>64 or jsonb_typeof(layer) is distinct from 'object' then return false; end if;
    if (layer ? 'visibility' and coalesce(layer->>'visibility' not in ('public','publica'),true))
      or (layer ? 'status' and coalesce(layer->>'status' not in ('published','public','publicat'),true))
      or (layer ? 'isPublished' and layer->'isPublished' is distinct from 'true'::jsonb) then return false; end if;
    foreach container in array array['attributes','payload'] loop
      if layer ? container and layer->container is distinct from 'null'::jsonb then pending:=array_append(pending,layer->container); end if;
    end loop;
  end loop;
  return true;
end;
$$;
revoke all on function private.seed_revision_es_publica(jsonb) from public,anon,authenticated,service_role;
-- Parameter-only, immutable helper: no table, identity or other actor data.
grant execute on function private.seed_revision_es_publica(jsonb) to anon,authenticated;
drop policy if exists seed_revisions_publica on public.seed_revisions;
create policy seed_revisions_publica on public.seed_revisions for select to anon,authenticated using (
  (select count(*)=1 and bool_and(private.seed_revision_es_publica(v.value))
   from public.app_content c cross join lateral jsonb_array_elements(case when jsonb_typeof(c.payload)='array' then c.payload else '[]'::jsonb end) v(value)
   where c.tenant_id=seed_revisions.tenant_id and c.version=seed_revisions.source_version and c.key=case seed_revisions.section when 'mur' then 'feedPosts' else 'events' end
     and v.value->>'id'=seed_revisions.seed_id)
);

-- app_content és administratiu. Cap id/nom d'autor rebut del client és autoritat.
create or replace function private.seed_revision_font(p_tenant_id uuid,p_section text,p_seed_id text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when count(*)=1 and bool_and(private.seed_revision_es_publica(v.value)) then (jsonb_agg(v.value)->0) end
  from public.app_content c cross join lateral jsonb_array_elements(case when jsonb_typeof(c.payload)='array' then c.payload else '[]'::jsonb end) v(value)
  where c.tenant_id=p_tenant_id and c.key=case p_section when 'mur' then 'feedPosts' when 'events' then 'events' end
    and v.value->>'id'=p_seed_id
$$;
revoke all on function private.seed_revision_font(uuid,text,text) from public,anon,authenticated;

-- Àrbitre R11 (R33-L2-03) · Mateixa mesura que el client (String#length): unitats
-- UTF-16. length() compta punts de codi i deixaria passar una fila il·legible per al lector.
create or replace function private.seed_revision_unitats_utf16(p text)
returns integer language sql immutable strict set search_path = '' as $$
  select case when octet_length(p)=length(p) then length(p)
    else length(p)+length(regexp_replace(p,'[\u0001-\uFFFF]+','','g')) end
$$;
revoke all on function private.seed_revision_unitats_utf16(text) from public,anon,authenticated;

create or replace function public.desa_revisio_seed(p_tenant_id uuid,p_section text,p_seed_id text,p_payload jsonb,p_version integer,p_source_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare font jsonb; font_version integer; previa public.seed_revisions; fila public.seed_revisions; entrada record; maxim integer; actor uuid:=auth.uid();
  nou_payload jsonb; nou_author_payload jsonb; vigent integer;
begin
  if actor is null then raise exception 'SDP-SEED-000: cal sessió.' using errcode='42501'; end if;
  if p_tenant_id is null or p_section is null or p_section not in ('mur','events') or p_seed_id is null or p_seed_id !~ '^[A-Za-z0-9_-]{1,128}$'
    or p_version is null or p_version<0 or p_version>=2147483647 or p_source_version is null or p_source_version<1 or jsonb_typeof(p_payload) is distinct from 'object'
    or p_payload='{}'::jsonb or octet_length(p_payload::text)>750000 then
    raise exception 'SDP-SEED-001: revisió invàlida.' using errcode='22023';
  end if;
  for entrada in select key,value from jsonb_each(p_payload) loop
    maxim:=case entrada.key when 'title' then 4000 when 'subtitle' then 4000 when 'lead' then 4000 when 'content' then 600000
      when 'heroImage' then 4000 when 'logoImage' then 4000 when 'copyright' then 4000 when 'icon' then 4000 when 'publishDate' then 4000 when 'tags' then 50 end;
    if maxim is null then raise exception 'SDP-SEED-001: camp no admés.' using errcode='22023'; end if;
    if entrada.key='tags' then
      if jsonb_typeof(entrada.value) is distinct from 'array' then raise exception 'SDP-SEED-001: etiquetes invàlides.' using errcode='22023'; end if;
      if jsonb_array_length(entrada.value)>50 or exists(select 1 from jsonb_array_elements(entrada.value) v where jsonb_typeof(v) is distinct from 'string' or private.seed_revision_unitats_utf16(v#>>'{}')>80) then
        raise exception 'SDP-SEED-001: etiquetes invàlides.' using errcode='22023';
      end if;
    elsif not (entrada.key='publishDate' and entrada.value='null'::jsonb) and (jsonb_typeof(entrada.value) is distinct from 'string' or private.seed_revision_unitats_utf16(entrada.value#>>'{}')>maxim) then
      raise exception 'SDP-SEED-001: text invàlid.' using errcode='22023';
    end if;
  end loop;
  -- El pany de la font impedix canviar l'autoria mentre s'autoritza la revisió.
  select c.version into font_version from public.app_content c where c.tenant_id=p_tenant_id and c.key=case p_section when 'mur' then 'feedPosts' else 'events' end for share;
  font:=private.seed_revision_font(p_tenant_id,p_section,p_seed_id);
  if font is null then raise exception 'SDP-SEED-004: font absent o duplicada.' using errcode='P0002'; end if;
  if font_version is distinct from p_source_version then raise exception 'SDP-SEED-003: la font ha canviat.' using errcode='40001'; end if;
  if not coalesce(private.es_superadmin(),false) and (font->>'owner_user_id' is distinct from actor::text
      or coalesce(font->>'author_org_id','')<>'') then
    raise exception 'SDP-SEED-002: autoria no vinculada.' using errcode='42501';
  end if;
  -- Serialitza també el primer INSERT, quan encara no existix cap fila a bloquejar.
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||':'||p_section||':'||p_seed_id,0));
  select * into previa from public.seed_revisions where tenant_id=p_tenant_id and section=p_section and seed_id=p_seed_id for update;
  -- Àrbitre R11 (R33-L2-02) · El CAS és sobre el parell (font, versió). Una fila d'una
  -- font antiga és invisible per a tot client (RLS), així que el rebase comença amb 0
  -- i reinicia la versió a 1: el parell no es repetix perquè la versió de la font només creix.
  vigent:=case when previa.source_version is not distinct from font_version then previa.version else 0 end;
  if vigent<>p_version then raise exception 'SDP-SEED-003: conflicte de versió.' using errcode='40001'; end if;
  -- Àrbitre R11 (R33-L2-03) · La fila FUSIONADA, no només p_payload, ha de cabre en el lector.
  nou_payload:=(case when vigent>0 then previa.payload else '{}'::jsonb end)||p_payload;
  if octet_length(nou_payload::text)>700000 then raise exception 'SDP-SEED-001: revisió massa gran.' using errcode='22023'; end if;
  -- Les dades pròpies d'exportació només es fusionen amb la mateixa font i el mateix autor.
  nou_author_payload:=(case when vigent>0 and previa.author_id=actor then previa.author_payload else '{}'::jsonb end)||p_payload;
  insert into public.seed_revisions(tenant_id,section,seed_id,payload,author_payload,author_id,version,source_version)
    values(p_tenant_id,p_section,p_seed_id,nou_payload,nou_author_payload,actor,1,font_version)
    on conflict (tenant_id,section,seed_id) do update set payload=excluded.payload,author_payload=excluded.author_payload,
      author_id=actor,version=vigent+1,source_version=font_version,updated_at=clock_timestamp()
    returning * into fila;
  return jsonb_build_object('seccio',fila.section,'id',fila.seed_id,'camps',fila.payload,'versio',fila.version,'fontVersio',fila.source_version);
end;
$$;
revoke all on function public.desa_revisio_seed(uuid,text,text,jsonb,integer,integer) from public,anon;
grant execute on function public.desa_revisio_seed(uuid,text,text,jsonb,integer,integer) to authenticated;
comment on table public.seed_revisions is 'P1-75: només la revisió vigent de cada peça i poble; sense DELETE, INSERT o UPDATE des del client.';

-- P2-08 · Preserve the reviewed exporter implementation without copying its
-- historical source. A private, owner-only base is installed exactly once.
DO $seed_export_base$
declare base_oid oid:=to_regprocedure('private.exporta_les_meues_dades_base_r33()'); current_oid oid;
begin
  if base_oid is null then
    current_oid:=to_regprocedure('public.exporta_les_meues_dades()');
    if current_oid is null or not exists(select 1 from pg_proc p where p.oid=current_oid and p.prosecdef and p.prorettype='jsonb'::regtype and p.proowner=(select oid from pg_roles where rolname=current_user))
      or position('private.exporta_federacio_v1' in pg_get_functiondef(current_oid))=0 then
      raise exception 'SDP-SEED-EXPORT-001: cal l’exportador canònic i la mateixa propietària.';
    end if;
    alter function public.exporta_les_meues_dades() set schema private;
    alter function private.exporta_les_meues_dades() rename to exporta_les_meues_dades_base_r33;
  elsif not exists(select 1 from pg_proc p where p.oid=base_oid and p.proowner=(select oid from pg_roles where rolname=current_user)) then
    raise exception 'SDP-SEED-EXPORT-001: la propietària de la base ha canviat.';
  end if;
end $seed_export_base$;
revoke all on function private.exporta_les_meues_dades_base_r33() from public,anon,authenticated,service_role;

create or replace function public.exporta_les_meues_dades()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); base jsonb; revisions jsonb;
begin
  if actor is null then raise exception 'SDP-EXPORT-000: cal la sessió iniciada.' using errcode='42501'; end if;
  base:=private.exporta_les_meues_dades_base_r33();
  if jsonb_typeof(base) is distinct from 'object' or base->>'format' is distinct from 'socdepoble.exportacio.v1' then
    raise exception 'SDP-SEED-EXPORT-002: format d’exportació inesperat.';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'tenant_id',r.tenant_id,'section',r.section,'seed_id',r.seed_id,
    'payload',r.author_payload,'version',r.version,'source_version',r.source_version,'author_id',r.author_id,
    'created_at',r.created_at,'updated_at',r.updated_at) order by r.tenant_id,r.section,r.seed_id),'[]'::jsonb)
    into revisions from public.seed_revisions r where r.author_id=actor;
  return base||jsonb_build_object('seed_revisions',revisions);
end;
$$;
revoke all on function public.exporta_les_meues_dades() from public,anon,authenticated,service_role;
grant execute on function public.exporta_les_meues_dades() to authenticated;
NOTIFY pgrst, 'reload schema';
commit;
