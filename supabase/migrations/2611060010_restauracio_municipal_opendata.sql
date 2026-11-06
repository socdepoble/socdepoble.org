-- IDEA-104c. Public municipal data only; no identities, memberships or private notes.
-- Independent of administration proposal 2611052345; catalogue76 is sufficient.
-- Writes are serialized and checked against a fixed tenant.
begin;
create table if not exists private.municipi_opendata (
  tenant_id uuid primary key references public.towns(id) on delete restrict,
  slug text not null unique, municipi jsonb not null,
  versio text not null check(versio='1.2.0')
);
create table if not exists private.municipi_opendata_documents (
  tenant_id uuid not null references private.municipi_opendata(tenant_id) on delete cascade,
  coleccio text not null check(coleccio in ('entitats','noticies','agenda','memoria','memoriaOral')),
  id text not null check(length(id) between 1 and 128), document jsonb not null,
  primary key(coleccio,id)
);
alter table private.municipi_opendata enable row level security;
alter table private.municipi_opendata_documents enable row level security;
revoke all on private.municipi_opendata,private.municipi_opendata_documents from public,anon,authenticated,service_role;

-- The JSON-lot RPC is independently callable: ZIP validation in JavaScript
-- cannot protect it. Mirror the canonical OKF parser's nested public schema.
create or replace function private.opendata_instant_public_valid(value text)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if value is null or value !~ '^[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,9})?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$' then return false; end if;
  perform value::timestamptz;
  return true;
exception when invalid_datetime_format or datetime_field_overflow then return false;
end; $$;

create or replace function private.opendata_okf_public_valid(okf jsonb,municipi text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare fm jsonb; entry jsonb; key text;
begin
  if okf is null or jsonb_typeof(okf)<>'object' or municipi is null then return false; end if;
  if (select count(*) from jsonb_object_keys(okf))<>3 or exists(select 1 from jsonb_object_keys(okf) k where k not in ('cami','frontmatter','cos'))
    or jsonb_typeof(okf->'cami') is distinct from 'string' or length(okf->>'cami')>200
    or okf->>'cami' !~ ('^memoria-oral/'||municipi||'/[a-z0-9]+(-[a-z0-9]+)*[.]md$')
    or jsonb_typeof(okf->'cos') is distinct from 'string' or length(okf->>'cos')>262144
    or jsonb_typeof(okf->'frontmatter') is distinct from 'object' then return false; end if;
  fm:=okf->'frontmatter';
  if exists(select 1 from jsonb_object_keys(fm) k where k not in ('type','title','description','resource','tags','status','generated','verified','stale_after','sources','municipi'))
    or jsonb_typeof(fm->'type') is distinct from 'string' or jsonb_typeof(fm->'status') is distinct from 'string'
    or fm->>'status' not in ('draft','stable','deprecated') or fm->>'municipi' is distinct from municipi then return false; end if;
  foreach key in array array['type','title','description','resource','municipi'] loop
    if fm?key and (jsonb_typeof(fm->key)<>'string' or length(fm->>key)>262144) then return false; end if;
  end loop;
  if fm?'stale_after' and (jsonb_typeof(fm->'stale_after')<>'string' or not private.opendata_instant_public_valid(fm->>'stale_after')) then return false; end if;
  if fm?'tags' then
    if jsonb_typeof(fm->'tags')<>'array' then return false; end if;
    if jsonb_array_length(fm->'tags')>1000 or exists(select 1 from jsonb_array_elements(fm->'tags') r where jsonb_typeof(r)<>'string' or length(r#>>'{}')>1024) then return false; end if;
  end if;
  if fm?'generated' then
    entry:=fm->'generated';
    if jsonb_typeof(entry)<>'object' then return false; end if;
    if exists(select 1 from jsonb_object_keys(entry) k where k not in ('by','at')) or jsonb_typeof(entry->'by') is distinct from 'string' or length(entry->>'by')>1024 then return false; end if;
    if entry?'at' and (jsonb_typeof(entry->'at')<>'string' or not private.opendata_instant_public_valid(entry->>'at')) then return false; end if;
  end if;
  if fm?'verified' then
    if jsonb_typeof(fm->'verified')<>'array' then return false; end if;
    if jsonb_array_length(fm->'verified')>1000 then return false; end if;
    for entry in select value from jsonb_array_elements(fm->'verified') loop
      if jsonb_typeof(entry)<>'object' then return false; end if;
      if (select count(*) from jsonb_object_keys(entry))<>2 or exists(select 1 from jsonb_object_keys(entry) k where k not in ('by','at'))
        or jsonb_typeof(entry->'by') is distinct from 'string' or length(entry->>'by')>1024 or jsonb_typeof(entry->'at') is distinct from 'string'
        or not private.opendata_instant_public_valid(entry->>'at') then return false; end if;
    end loop;
  end if;
  if fm?'sources' then
    if jsonb_typeof(fm->'sources')<>'array' then return false; end if;
    if jsonb_array_length(fm->'sources')>5000 then return false; end if;
    for entry in select value from jsonb_array_elements(fm->'sources') loop
      if jsonb_typeof(entry)<>'object' then return false; end if;
      if exists(select 1 from jsonb_object_keys(entry) k where k not in ('id','resource','title','author')) or jsonb_typeof(entry->'resource') is distinct from 'string' then return false; end if;
      for key in select jsonb_object_keys(entry) loop
        if jsonb_typeof(entry->key)<>'string' or length(entry->>key)>262144 then return false; end if;
      end loop;
    end loop;
  end if;
  return true;
end; $$;
revoke all on function private.opendata_instant_public_valid(text),private.opendata_okf_public_valid(jsonb,text) from public,anon,authenticated,service_role;

create or replace function public.importa_municipi_open_data(p_tenant_id uuid,p_lot jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare c text; fila jsonb; camps text[]; old jsonb; old_tenant uuid; v_slug text; v_nom text; n integer; comptador text;
  informe jsonb:='{"creats":{"entitats":0,"noticies":0,"agenda":0,"memoria":0,"memoriaOral":0},"actualitzats":{"entitats":0,"noticies":0,"agenda":0,"memoria":0,"memoriaOral":0},"iguals":{"entitats":0,"noticies":0,"agenda":0,"memoria":0,"memoriaOral":0}}';
begin
  if not coalesce(private.es_superadmin(),false) then raise exception 'SDP-ADMIN-003' using errcode='42501'; end if;
  if p_tenant_id is null or p_lot is null or jsonb_typeof(p_lot)<>'object' or octet_length(p_lot::text)>33554432
    or p_lot->>'format' is distinct from 'socdepoble.dadesobertes.v1' or p_lot->>'versio' is distinct from '1.2.0'
    or jsonb_typeof(p_lot->'municipi') is distinct from 'object'
    or exists(select 1 from jsonb_object_keys(p_lot) k where k not in ('format','versio','municipi','entitats','noticies','agenda','memoria','memoriaOral'))
    then raise exception 'invalid_opendata_lot' using errcode='22023'; end if;
  v_slug:=p_lot->'municipi'->>'slug'; v_nom:=p_lot->'municipi'->>'nom';
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or v_nom is null or length(btrim(v_nom)) not between 1 and 120
    or not exists(select 1 from public.towns where id=p_tenant_id and towns.slug=v_slug and name=v_nom)
    or exists(select 1 from jsonb_object_keys(p_lot->'municipi') k where k not in ('slug','nom','descripcio','wikidata','lat','lng'))
    then raise exception 'opendata_tenant_mismatch' using errcode='22023'; end if;
  -- One lock covers every collection and every tenant, including IDs first seen concurrently.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('municipi-opendata-v1',0));
  insert into private.municipi_opendata values(p_tenant_id,v_slug,p_lot->'municipi','1.2.0')
    on conflict(tenant_id) do update set municipi=excluded.municipi;
  foreach c in array array['entitats','noticies','agenda','memoria','memoriaOral'] loop
    if jsonb_typeof(p_lot->c) is distinct from 'array' or jsonb_array_length(p_lot->c)>5000 then raise exception 'invalid_opendata_collection' using errcode='22023'; end if;
    if exists(select 1 from jsonb_array_elements(p_lot->c) r group by r->>'id' having count(*)>1) then raise exception 'opendata_duplicate_id' using errcode='22023'; end if;
    camps:=case c
      when 'entitats' then array['id','slug','name','kind','parent_organization_id','lema','description','logo_url','hero_url','copyright','town_name','visibility']
      when 'noticies' then array['id','title','subtitle','entradilla','body','created_at','updated_at','image_url','author_org_id','poble_id','copyright','visibility']
      when 'agenda' then array['id','title','subtitle','entradilla','inici','fi','location','image_url','author_org_id','poble_id','copyright','created_at','updated_at','visibility']
      when 'memoria' then array['id','title','entradilla','text','created_at','updated_at','image_url','author_org_id','poble_id','copyright','visibility']
      else array['id','okf','author_org_id','copyright','created_at','updated_at','visibility'] end;
    for fila in select value from jsonb_array_elements(p_lot->c) loop
      if jsonb_typeof(fila)<>'object' or fila->>'visibility' is distinct from 'public' or fila->>'id' is null or length(fila->>'id') not between 1 and 128 or fila->>'id' ~ '[[:space:]<>[:cntrl:]]'
        or exists(select 1 from jsonb_object_keys(fila) k where not(k=any(camps)))
        or exists(select 1 from jsonb_each(fila) e where e.key<>'okf' and jsonb_typeof(e.value) not in ('string','null'))
        then raise exception 'invalid_opendata_document' using errcode='22023'; end if;
      if c='entitats' then
        if fila->>'town_name' is distinct from v_nom or coalesce(length(btrim(fila->>'name')),0)=0 or fila->>'kind' is not null and fila->>'kind' not in ('company','entity','group') then raise exception 'invalid_opendata_entity' using errcode='22023'; end if;
        if fila->>'slug' is not null and (fila->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or exists(select 1 from private.municipi_opendata_documents d where d.coleccio='entitats' and d.document->>'slug'=fila->>'slug' and d.id<>fila->>'id') or exists(select 1 from public.organizations o where o.slug=fila->>'slug' and o.id::text<>fila->>'id')) then raise exception 'opendata_entity_slug_conflict' using errcode='23505'; end if;
      elsif c='memoriaOral' then
        if not private.opendata_okf_public_valid(fila->'okf',v_slug) then raise exception 'invalid_opendata_oral' using errcode='22023'; end if;
        if exists(select 1 from private.municipi_opendata_documents d where d.tenant_id=p_tenant_id and d.coleccio=c and d.id<>fila->>'id' and d.document->'okf'->>'cami'=fila->'okf'->>'cami') then raise exception 'opendata_oral_path_conflict' using errcode='23505'; end if;
      elsif fila->>'poble_id' is distinct from v_slug then raise exception 'opendata_document_tenant_mismatch' using errcode='22023'; end if;
      if c<>'entitats' and (fila->>'author_org_id' is null or not exists(select 1 from jsonb_array_elements(p_lot->'entitats') e where e->>'id'=fila->>'author_org_id')) then raise exception 'opendata_missing_entity_author' using errcode='22023'; end if;
      select d.document,d.tenant_id into old,old_tenant from private.municipi_opendata_documents d where d.coleccio=c and d.id=fila->>'id';
      if found and old_tenant<>p_tenant_id then raise exception 'opendata_identifier_conflict' using errcode='23505'; end if;
      comptador:=case when old is null then 'creats' when old=fila then 'iguals' else 'actualitzats' end;
      n:=(informe->comptador->>c)::integer+1; informe:=jsonb_set(informe,array[comptador,c],to_jsonb(n));
      insert into private.municipi_opendata_documents values(p_tenant_id,c,fila->>'id',fila)
        on conflict(coleccio,id) do update set document=excluded.document;
    end loop;
  end loop;
  return informe;
end; $$;

create or replace function public.llegix_municipi_open_data(p_tenant_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('noticies',coalesce((select jsonb_agg(document order by id) from private.municipi_opendata_documents where tenant_id=p_tenant_id and coleccio='noticies'),'[]'::jsonb),
    'agenda',coalesce((select jsonb_agg(document order by id) from private.municipi_opendata_documents where tenant_id=p_tenant_id and coleccio='agenda'),'[]'::jsonb),
    'memoria',coalesce((select jsonb_agg(document order by id) from private.municipi_opendata_documents where tenant_id=p_tenant_id and coleccio='memoria'),'[]'::jsonb),
    'memoriaOral',coalesce((select jsonb_agg(document order by id) from private.municipi_opendata_documents where tenant_id=p_tenant_id and coleccio='memoriaOral'),'[]'::jsonb));
$$;
revoke all on function public.importa_municipi_open_data(uuid,jsonb),public.llegix_municipi_open_data(uuid) from public,anon,authenticated,service_role;
grant execute on function public.importa_municipi_open_data(uuid,jsonb) to authenticated;
grant execute on function public.llegix_municipi_open_data(uuid) to anon,authenticated;
create or replace function public.llegix_municipi_open_data_per_slug(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('poble',jsonb_build_object('slug',t.slug,'nom',t.name),'dades',public.llegix_municipi_open_data(t.id))
    from public.towns t where t.slug=p_slug and exists(select 1 from private.municipi_opendata m where m.tenant_id=t.id);
$$;
revoke all on function public.llegix_municipi_open_data_per_slug(text) from public,anon,authenticated,service_role;
grant execute on function public.llegix_municipi_open_data_per_slug(text) to anon,authenticated;
do $$ begin
  if exists(select 1 from pg_roles where rolname='node0_runtime') then
    grant execute on function public.llegix_municipi_open_data_per_slug(text) to node0_runtime;
  end if;
end; $$;
commit;
