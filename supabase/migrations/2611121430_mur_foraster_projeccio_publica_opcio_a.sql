-- R21 D1 Opció A / F03. Només una projecció escalar pública; cap payload cru.
-- Dependències: 2609140000, 2609261200, 2611111735, 2611112005, 2611112149.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Els estats canònics de les files legacy eren públic/visible. Un marcador
-- privat, moderat o eliminat dins del payload sempre domina aquests defaults.
alter table public.section_submissions add column if not exists visibility text not null default 'public';
alter table public.section_submissions add column if not exists moderation_state text not null default 'visible';
alter table public.section_submissions add column if not exists deleted_at timestamptz;

create table if not exists private.mur_publicacions_revocades (
  submission_id uuid primary key,
  tenant_id uuid not null,
  owner_user_id uuid not null,
  revoked_at timestamptz not null default now()
);
revoke all on table private.mur_publicacions_revocades from public, anon, authenticated, service_role;
alter table private.mur_publicacions_revocades enable row level security;

create or replace function private.mur_public_eligible(p_payload jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog, public as $$
declare pendents jsonb[] := array[p_payload]; capa jsonb; n integer; visites integer := 0; clau text;
begin
  if not private.publicacio_mur_es_publica(p_payload) then return false; end if;
  while coalesce(array_length(pendents,1),0)>0 loop
    n := array_length(pendents,1); capa := pendents[n]; pendents := pendents[1:n-1]; visites := visites+1;
    if visites>64 or jsonb_typeof(capa) is distinct from 'object' then return false; end if;
    if (capa ? 'moderation_state' and capa->'moderation_state' is distinct from '"visible"'::jsonb)
      or (capa ? 'deleted_at' and capa->'deleted_at' is distinct from 'null'::jsonb)
      or (capa ? 'deletedAt' and capa->'deletedAt' is distinct from 'null'::jsonb)
      or (capa ? 'deleted' and capa->'deleted' is distinct from 'false'::jsonb) then return false; end if;
    foreach clau in array array['attributes','payload'] loop
      if capa ? clau and capa->clau is distinct from 'null'::jsonb then pendents := array_append(pendents,capa->clau); end if;
    end loop;
  end loop;
  return true;
end;
$$;
revoke all on function private.mur_public_eligible(jsonb) from public, anon, authenticated, service_role;

-- Text pla: mai cap HTML, URL d'imatge, EXIF binari, UUID intern ni contacte
-- automàtic. El text lliure és text explícitament publicat per la persona.
create or replace function private.mur_text_public(p_text text)
returns text language plpgsql immutable set search_path = pg_catalog, public as $$
declare net text := left(coalesce(p_text,''),100000);
begin
  net := regexp_replace(net,'<(script|style|iframe|object)[^>]*>.*?</\1[[:space:]]*>','','gis');
  net := regexp_replace(net,'<[^>]*>','','g');
  net := regexp_replace(net,'[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}','[contacte omés]','gi');
  net := regexp_replace(net,'[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}','[identificador omés]','gi');
  net := regexp_replace(net,'(https?://|data:|sdp-media:|tel:|mailto:)[^[:space:]<>]+','[recurs omés]','gi');
  net := regexp_replace(net,'[+]?[[:digit:]][[:digit:] ()-]{7,}[[:digit:]]','[contacte omés]','g');
  net := regexp_replace(net,'[-+]?[[:digit:]]{1,3}\.[[:digit:]]{4,}','[coordenada omesa]','g');
  return net;
end;
$$;
revoke all on function private.mur_text_public(text) from public, anon, authenticated, service_role;

-- REVOKE de taula no retira els GRANT de columna de 2005: retirem ambdós.
revoke select on table public.section_submissions from public, anon;
do $$ declare columna record; begin
  for columna in select attname from pg_attribute where attrelid='public.section_submissions'::regclass and attnum>0 and not attisdropped loop
    execute format('revoke select (%I) on table public.section_submissions from public, anon', columna.attname);
  end loop;
end $$;
drop policy if exists "public read section_submissions" on public.section_submissions;
drop policy if exists "owner read section_submissions" on public.section_submissions;
create policy "owner read section_submissions" on public.section_submissions for select to authenticated
using (owner_user_id=(select auth.uid()) and (select private.is_town_member(tenant_id)) and deleted_at is null);

-- Referència pública de catàleg: enums del contracte JS, cap identitat.
create or replace function private.mur_cataleg_public(p_payload jsonb)
returns table(catalog_font text,catalog_id text,catalog_destins text[],destinacio_workspace text)
language plpgsql immutable set search_path = pg_catalog, public as $$
declare marca jsonb := p_payload->'projeccioCataleg'; destins text[];
begin
  <<valida>> begin
    if jsonb_typeof(marca) is distinct from 'object' or marca->'v' is distinct from '1'::jsonb
      or marca->'audiencia' is distinct from '"publica"'::jsonb
      or jsonb_typeof(marca->'font') is distinct from 'string' or jsonb_typeof(marca->'id') is distinct from 'string'
      or jsonb_typeof(marca->'destins') is distinct from 'array' then exit valida; end if;
    if marca->>'font' not in ('herbari','llavors','receptes','nevera','bar','importacio-wp')
      or (marca->>'id') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$'
      or (marca->>'id') ~* '^[[:xdigit:]]{8}-([[:xdigit:]]{4}-){3}[[:xdigit:]]{12}$'
      or jsonb_array_length(marca->'destins')>9 then exit valida; end if;
    if exists(select 1 from jsonb_array_elements(marca->'destins') e
      where jsonb_typeof(e) is distinct from 'string' or e#>>'{}' not in ('mur','mercat','receptes','herbari','llavors','arbres-monumentals','pagina')) then exit valida; end if;
    select coalesce(array_agg(e#>>'{}'),array[]::text[]) into destins from jsonb_array_elements(marca->'destins') e;
    if cardinality(destins)<>(select count(distinct d) from unnest(destins) d) then exit valida; end if;
    if marca->>'font'='importacio-wp' then
      if marca->>'id' !~ '^[1-9][0-9]{0,9}$' or cardinality(destins)>1
        or exists(select 1 from unnest(destins) d where d not in ('mur','arbres-monumentals','herbari','receptes','pagina'))
        or (p_payload ? 'destinacio_workspace' and p_payload->'destinacio_workspace' is distinct from coalesce(to_jsonb(destins[1]),'null'::jsonb)) then exit valida; end if;
      destinacio_workspace := destins[1];
    end if;
    catalog_font := marca->>'font'; catalog_id := marca->>'id'; catalog_destins := destins;
  end valida;
  return next;
end;
$$;
revoke all on function private.mur_cataleg_public(jsonb) from public, anon, authenticated, service_role;

create or replace function public.llig_mur_public(
  p_tenant_id uuid default null, p_section_id text default null, p_limit integer default 200,
  p_before_created_at timestamptz default null, p_before_id uuid default null
) returns table (id uuid,tenant_id uuid,section_id text,title text,description text,public_content text,created_at timestamptz,updated_at timestamptz,catalog_font text,catalog_id text,catalog_destins text[],destinacio_workspace text)
language sql stable security definer set search_path = pg_catalog, public as $$
  select s.id,s.tenant_id,s.section_id,private.mur_text_public(s.title),private.mur_text_public(s.description),
    private.mur_text_public(case when jsonb_typeof(s.payload->'content')='string' then s.payload->>'content' else '' end),s.created_at,s.updated_at,c.catalog_font,c.catalog_id,c.catalog_destins,c.destinacio_workspace
  from public.section_submissions s
  cross join lateral private.mur_cataleg_public(s.payload) c
  where s.section_id in ('mur','mercat','events','multimedia')
    and s.visibility='public' and s.moderation_state='visible' and s.deleted_at is null
    and private.mur_public_eligible(s.payload)
    and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id)
    and exists(select 1 from public.towns t where t.id=s.tenant_id)
    and (p_tenant_id is null or s.tenant_id=p_tenant_id)
    and (p_section_id is null or s.section_id=p_section_id)
    and ((p_before_created_at is null and p_before_id is null) or (p_before_created_at is not null and p_before_id is not null and (s.created_at,s.id)<(p_before_created_at,p_before_id)))
  order by s.created_at desc,s.id desc limit greatest(1,least(coalesce(p_limit,200),200));
$$;
revoke all on function public.llig_mur_public(uuid,text,integer,timestamptz,uuid) from public, anon, authenticated, service_role;
grant execute on function public.llig_mur_public(uuid,text,integer,timestamptz,uuid) to anon, authenticated;

-- El padró opt-in comparteix exactament la frontera R21 del Mur.
create or replace function private.copub_recurs(p_tenant_id uuid, p_tipus text, p_recurs_id text)
returns table (origen_id uuid, article_id uuid) language plpgsql stable set search_path = '' as $$
declare
  id_article uuid := private.copub_text_uuid(p_recurs_id);
  fila record;
  origen_paquet text;
  element jsonb;
  quantes integer;
begin
  if not exists (select 1 from public.towns t where t.id = p_tenant_id) then return; end if;

  if p_tipus = 'article' and id_article is not null then
    if exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=id_article) then return; end if;
    select s.author_org_id,s.owner_user_id,s.payload,s.visibility,s.moderation_state,s.deleted_at into fila
    from public.section_submissions s
    where s.id = id_article and s.tenant_id = p_tenant_id and s.section_id = 'mur';
    if found then
      if fila.visibility='public' and fila.moderation_state='visible' and fila.deleted_at is null
        and private.mur_public_eligible(fila.payload) then
        return query select coalesce(fila.author_org_id, fila.owner_user_id), id_article;
      end if;
      return;
    end if;
  end if;

  if p_tipus in ('article', 'pagina') then
    select c.payload into element from public.app_content c
    where c.tenant_id = p_tenant_id and c.key = case p_tipus when 'article' then 'feedPosts' else 'pages' end;
    if jsonb_typeof(element) = 'array' then
      select count(*), (jsonb_agg(e.value)->0) into quantes, element
      from jsonb_array_elements(element) e where e.value->>'id' = p_recurs_id;
      if quantes > 1 then return; end if;
    end if;
  end if;

  select r.origen_clau into origen_paquet from private.recursos_copublicacio_paquet r
  where r.tipus = p_tipus and r.recurs_id = p_recurs_id;
  if found or quantes = 1 then
    return query select coalesce(
      private.copub_text_uuid(element->>'author_org_id'),
      private.copub_text_uuid(element->>'author_id'),
      private.copub_text_uuid(element->>'authorId'),
      private.copub_actor_oficial(origen_paquet),
      private.copub_actor_oficial(case coalesce(element->>'authorId', element->>'author_id')
        when 'rentonar' then 'rentonar'
        when 'socdepoble' then 'socdepoble'
        when 'soc-de-poble_official' then 'socdepoble'
      end)
    ), null::uuid;
  end if;
end;
$$;

revoke all on function private.copub_recurs(uuid,text,text) from public, anon, authenticated, service_role;

-- Mateix pany en publicació i revocació: la transacció més antiga no pot
-- ressuscitar un UUID tombstonat després que la retirada haja confirmat.
create or replace function private.mur_anti_resurreccio()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if ((tg_op='INSERT' and (new.moderation_state is distinct from 'visible' or new.deleted_at is not null))
    or (tg_op='UPDATE' and (new.moderation_state is distinct from old.moderation_state or new.deleted_at is distinct from old.deleted_at)))
    and not (current_setting('role',true) in ('service_role','postgres')
      or (current_setting('role',true)='none' and exists(select 1 from pg_roles r where r.rolname=session_user and r.rolsuper))
      or (coalesce(private.es_superadmin(),false) and private.copub_compte_actiu(auth.uid()))) then
    raise exception using errcode='42501',message='SDP-MUR-MODERATION: camps de servidor; cal superadmin actiu amb aal2.';
  end if;
  if tg_op='UPDATE' and (new.id is distinct from old.id or new.tenant_id is distinct from old.tenant_id) then
    raise exception using errcode='23514',message='SDP-MUR-IDENTITY: UUID i poble són immutables.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||new.id::text,0));
  if exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=new.id) then
    raise exception using errcode='23514',message='SDP-MUR-REVOKED: UUID retirat definitivament; publica amb un UUID nou.';
  end if;
  return new;
end;
$$;
revoke all on function private.mur_anti_resurreccio() from public, anon, authenticated, service_role;
drop trigger if exists sdp_mur_anti_resurreccio on public.section_submissions;
create trigger sdp_mur_anti_resurreccio before insert or update on public.section_submissions
for each row execute function private.mur_anti_resurreccio();

create or replace function public.revoca_publicacio_mur(p_id uuid,p_tenant_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare persona uuid := auth.uid(); fila record; retirada record;
begin
  if persona is null or p_id is null or p_tenant_id is null then
    raise exception using errcode='42501',message='SDP-MUR-AUTH: sessió i identificadors requerits.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||p_id::text,0));
  select * into retirada from private.mur_publicacions_revocades r where r.submission_id=p_id;
  if found then
    if retirada.owner_user_id<>persona or retirada.tenant_id<>p_tenant_id then
      raise exception using errcode='42501',message='SDP-MUR-OWNER: retirada aliena.';
    end if;
    return true;
  end if;
  select s.owner_user_id,s.tenant_id into fila from public.section_submissions s where s.id=p_id for update;
  if not found then
    if not exists(select 1 from public.town_memberships m where m.town_id=p_tenant_id and m.user_id=persona) then
      raise exception using errcode='42501',message='SDP-MUR-TENANT: pertinença requerida.';
    end if;
    insert into private.mur_publicacions_revocades(submission_id,tenant_id,owner_user_id) values(p_id,p_tenant_id,persona);
    return true;
  end if;
  if fila.owner_user_id<>persona or fila.tenant_id<>p_tenant_id then
    raise exception using errcode='42501',message='SDP-MUR-OWNER: publicació aliena.';
  end if;
  insert into private.mur_publicacions_revocades(submission_id,tenant_id,owner_user_id) values(p_id,p_tenant_id,persona);
  delete from public.section_submissions where id=p_id;
  return true;
end;
$$;
revoke all on function public.revoca_publicacio_mur(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function public.revoca_publicacio_mur(uuid,uuid) to authenticated;

-- DELETE cru autoritzat també deixa tombstone. No necessita auth.uid perquè
-- el DELETE ha passat RLS (o és administració real); no amplia ACL de client.
create or replace function private.mur_registra_esborrat()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||old.id::text,0));
  insert into private.mur_publicacions_revocades(submission_id,tenant_id,owner_user_id)
    values(old.id,old.tenant_id,old.owner_user_id) on conflict(submission_id) do nothing;
  return old;
end;
$$;
revoke all on function private.mur_registra_esborrat() from public, anon, authenticated, service_role;
drop trigger if exists sdp_mur_registra_esborrat on public.section_submissions;
create trigger sdp_mur_registra_esborrat before delete on public.section_submissions
for each row execute function private.mur_registra_esborrat();

-- Servidor F03: eliminar o despublicar la nota retira la publicació en la
-- mateixa transacció. Es comprova owner+tenant: un FK aliè no permet IDOR.
create or replace function private.mur_retira_des_de_nota()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare candidat uuid;
begin
  if tg_op='DELETE' or (tg_op='UPDATE' and (
      (old.is_published and not new.is_published)
      or (old.published_submission_id is not null and new.published_submission_id is distinct from old.published_submission_id)
      or (to_jsonb(new)->>'status'='paperera' and to_jsonb(old)->>'status' is distinct from 'paperera'))) then
    -- old.id és el destí per defecte de publishNote, també abans del seu POST.
    for candidat in select distinct x from unnest(array[old.published_submission_id,old.id]) x where x is not null loop
      perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||candidat::text,0));
      if not exists(select 1 from public.section_submissions s where s.id=candidat
        and (s.owner_user_id<>old.owner_user_id or s.tenant_id<>old.tenant_id)) then
        insert into private.mur_publicacions_revocades(submission_id,tenant_id,owner_user_id)
          values(candidat,old.tenant_id,old.owner_user_id) on conflict(submission_id) do nothing;
        delete from public.section_submissions s where s.id=candidat
          and s.owner_user_id=old.owner_user_id and s.tenant_id=old.tenant_id;
      end if;
    end loop;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.mur_retira_des_de_nota() from public, anon, authenticated, service_role;
drop trigger if exists sdp_mur_retira_des_de_nota on public.notes;
create trigger sdp_mur_retira_des_de_nota after delete or update on public.notes
for each row execute function private.mur_retira_des_de_nota();
-- Rebut transaccional per intent (nota+revisió): si es perd l'ACK després
-- del FK SET NULL, el mateix intent no es converteix en un conflicte fals.
create table if not exists private.mur_revocacions_notes (
  note_id uuid not null,
  expected_revision integer not null,
  tenant_id uuid not null,
  owner_user_id uuid not null,
  revoked_at timestamptz not null default now(),
  primary key(note_id,expected_revision)
);
revoke all on table private.mur_revocacions_notes from public, anon, authenticated, service_role;
alter table private.mur_revocacions_notes enable row level security;

-- RPC d'intenció amb CAS avant de retirer. Cap GET client ni rebuig CAS
-- posterior pot publicar un ACK fals. La nota es comprova sota pany servidor.
create or replace function public.revoca_publicacio_de_nota(p_id uuid,p_tenant_id uuid,p_expected_revision integer)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare persona uuid := auth.uid(); nota record; candidat uuid; retirada record;
begin
  if persona is null or p_id is null or p_tenant_id is null or p_expected_revision is null or p_expected_revision<1 then
    raise exception using errcode='42501',message='SDP-MUR-AUTH: sessió, nota i revisió requerides.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp:note-revoca:'||p_id::text||':'||p_expected_revision::text,0));
  select * into retirada from private.mur_revocacions_notes r where r.note_id=p_id and r.expected_revision=p_expected_revision;
  if found then
    if retirada.owner_user_id<>persona or retirada.tenant_id<>p_tenant_id then
      raise exception using errcode='42501',message='SDP-MUR-OWNER: intent de retirada alié.';
    end if;
    return true; -- ACK anterior; mai torna a retirar una publicació nova.
  end if;
  select * into nota from public.notes n where n.id=p_id for update;
  if not found then
    select * into retirada from private.mur_publicacions_revocades r where r.submission_id=p_id;
    if found and retirada.owner_user_id=persona and retirada.tenant_id=p_tenant_id then return true; end if;
    return false;
  end if;
  if nota.owner_user_id<>persona or nota.tenant_id<>p_tenant_id then
    raise exception using errcode='42501',message='SDP-MUR-OWNER: nota aliena.';
  end if;
  if nota.revision<>p_expected_revision then
    -- Un PATCH ja confirmat pot haver perdut la resposta abans de la RPC.
    -- Només confirmem el fet existent: cap retirada nova amb una revisió vella.
    if p_expected_revision<nota.revision and nota.published_submission_id is null
      and (not nota.is_published or to_jsonb(nota)->>'status'='paperera')
      and exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=p_id
        and r.owner_user_id=persona and r.tenant_id=p_tenant_id) then
      insert into private.mur_revocacions_notes(note_id,expected_revision,tenant_id,owner_user_id)
        values(p_id,p_expected_revision,p_tenant_id,persona) on conflict(note_id,expected_revision) do nothing;
      return true;
    end if;
    raise exception using errcode='40001',message='SDP-MUR-REVISION: la nota ha canviat.';
  end if;
  for candidat in select distinct x from unnest(array[nota.published_submission_id,nota.id]) x where x is not null loop
    perform public.revoca_publicacio_mur(candidat,p_tenant_id);
  end loop;
  -- L'intent offline retira la projecció, però no confirma el DELETE de nota.
  -- La nota que es conserva tampoc pot continuar anunciant-se publicada.
  update public.notes set is_published=false where id=p_id and is_published;
  insert into private.mur_revocacions_notes(note_id,expected_revision,tenant_id,owner_user_id)
    values(p_id,p_expected_revision,p_tenant_id,persona) on conflict(note_id,expected_revision) do nothing;
  return true;
end;
$$;
revoke all on function public.revoca_publicacio_de_nota(uuid,uuid,integer) from public, anon, authenticated, service_role;
grant execute on function public.revoca_publicacio_de_nota(uuid,uuid,integer) to authenticated;
commit;
