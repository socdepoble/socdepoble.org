-- R21.9b · Canal Beta Testers i registre privat de sincronització consentida.
-- Idempotent. Requerix el catàleg vigent, incloses 2611111735 i 2611121630.
-- Ordre manual: últim catàleg històric -> esta migració -> client R21.9b.
-- Els noms de 10 i 14 dígits es comparen per data normalitzada, no per alfabet.
-- No crea persones ni entitats fictícies, no envia missatges ni activa cap cron.
-- Les imatges: SQL verifica reserva, propietat i metadata de Storage; no descodifica
-- els bytes ni acredita eliminació EXIF. El preparador de mitjans és una altra capa.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

alter table public.xat_fils add column if not exists canal_clau text;
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.xat_fils'::regclass and conname='xat_fils_canal_canonic_forma') then
    alter table public.xat_fils add constraint xat_fils_canal_canonic_forma check(canal_clau is null or
      (canal_clau='beta_testers' and tipus='grup' and subjecte_tipus='entitat'
        and subjecte_id is not null and comunitat_id is not null and org_id is null
        and interlocutor_id is null and propi_usuari_id is null));
  end if;
end $$;
create unique index if not exists xat_fils_canal_canonic_uq
  on public.xat_fils(tenant_id,canal_clau) where canal_clau is not null;
-- The old tuple describes General, not every group under the same community.
-- Exclude the explicit canonical channel and keep the historical name/index key.
drop index if exists public.xat_fils_subjecte_uq;
create unique index xat_fils_subjecte_uq
  on public.xat_fils(tenant_id,subjecte_tipus,subjecte_id,tipus)
  where subjecte_tipus is not null and canal_clau is null;

create or replace function private.xat_beta_membre_vigent(p_tenant uuid,p_usuari uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_usuari is not null and exists(
    select 1 from public.town_memberships tm join public.profiles pr on pr.id=tm.user_id
    where tm.town_id=p_tenant and tm.user_id=p_usuari and pr.baixa_demanada_at is null)
    and not exists(select 1 from private.baixes b where b.user_id=p_usuari);
$$;
revoke all on function private.xat_beta_membre_vigent(uuid,uuid) from public,anon,authenticated,service_role;

create or replace function private.xat_fil_del_subjecte(p_tenant_id uuid, p_tipus text, p_comunitat_id uuid,
  p_titol text, p_org_id uuid, p_subjecte_tipus text, p_subjecte_id text, p_subjecte_ruta text,
  p_subjecte_titol text, p_subjecte_uri text)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_fil uuid;
begin
  select f.id into v_fil from public.xat_fils f
  where f.tenant_id = p_tenant_id and f.subjecte_tipus = p_subjecte_tipus
    and f.subjecte_id = p_subjecte_id and f.tipus = p_tipus and f.canal_clau is null;
  if v_fil is null then
    insert into public.xat_fils (tenant_id, titol, creat_per, tipus, comunitat_id, org_id, permisos,
      subjecte_tipus, subjecte_id, subjecte_ruta, subjecte_titol, subjecte_uri)
    values (p_tenant_id, p_titol, null, p_tipus, p_comunitat_id, p_org_id,
      case when p_tipus = 'canal' then '{"escriuen": "administradors"}'::jsonb else '{}'::jsonb end,
      p_subjecte_tipus, p_subjecte_id, p_subjecte_ruta, p_subjecte_titol, p_subjecte_uri)
    returning id into v_fil;
  end if;
  return v_fil;
end;
$$;


-- Resolve only the explicit institutional principal. Names/slugs and the seed UUID
-- are never authority. Missing/private/other-tenant entity means no provisioning.
create or replace function private.xat_reconcilia_beta_testers(p_tenant_id uuid)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid:=(select auth.uid()); v_org uuid; v_nom text; v_ruta text;
  v_comunitat uuid; v_fil uuid; v_rol text;
begin
  if not private.xat_beta_membre_vigent(p_tenant_id,v_jo) then return null; end if;
  select o.id,left(o.name,100),'/empresa/'||coalesce(o.slug,o.id::text) into v_org,v_nom,v_ruta
  from public.organizations o where o.id=private.copub_actor_oficial('socdepoble')
    and o.tenant_id=p_tenant_id and o.visibility='public' and o.kind='entity';
  if v_org is null then return null; end if;
  v_rol:=case when private.can_manage_organization(v_org) then 'admin' else 'membre' end;
  -- R22 · Fast path without the per-town lock: a coherent channel whose
  -- community and participant rows are already reconciled for this person.
  -- The periodic inbox refresh no longer serialises every member of the town;
  -- the lock below only guards provisioning and role changes.
  select f.id,f.comunitat_id into v_fil,v_comunitat from public.xat_fils f
    where f.tenant_id=p_tenant_id and f.canal_clau='beta_testers' and f.tipus='grup'
      and f.subjecte_tipus='entitat' and f.subjecte_id=v_org::text;
  if v_fil is not null
    and exists(select 1 from public.xat_fils c where c.id=v_comunitat and c.tenant_id=p_tenant_id
      and c.tipus='comunitat' and c.subjecte_tipus='entitat' and c.subjecte_id=v_org::text and c.canal_clau is null)
    and exists(select 1 from public.xat_participants p where p.fil_id=v_comunitat and p.usuari_id=v_jo)
    and exists(select 1 from public.xat_participants p where p.fil_id=v_fil and p.usuari_id=v_jo and p.rol=v_rol) then
    return v_fil;
  end if;
  v_fil:=null; v_comunitat:=null;
  -- Same lock as obri_fil_de_pagina: community creation cannot race General.
  perform pg_advisory_xact_lock(hashtextextended('xat:subjecte:'||p_tenant_id::text||':entitat:'||v_org::text,0));
  v_comunitat:=private.xat_fil_del_subjecte(p_tenant_id,'comunitat',null,v_nom,v_org,
    'entitat',v_org::text,v_ruta,v_nom,null);
  select f.id into v_fil from public.xat_fils f where f.tenant_id=p_tenant_id and f.canal_clau='beta_testers';
  if v_fil is null then
    insert into public.xat_fils(tenant_id,titol,tipus,comunitat_id,permisos,
      subjecte_tipus,subjecte_id,subjecte_ruta,subjecte_titol,canal_clau)
      values(p_tenant_id,'Beta Testers','grup',v_comunitat,'{}'::jsonb,
        'entitat',v_org::text,v_ruta,v_nom,'beta_testers')
      on conflict(tenant_id,canal_clau) where canal_clau is not null do nothing
      returning id into v_fil;
    if v_fil is null then
      select f.id into v_fil from public.xat_fils f where f.tenant_id=p_tenant_id and f.canal_clau='beta_testers';
    end if;
  end if;
  if not exists(select 1 from public.xat_fils f where f.id=v_fil and f.subjecte_id=v_org::text
    and f.subjecte_tipus='entitat' and f.comunitat_id=v_comunitat and f.tipus='grup') then
    raise exception 'SDP-XAT-018: configuració del canal no coherent.' using errcode='23514';
  end if;
  insert into public.xat_participants(fil_id,usuari_id,rol)
    values(v_comunitat,v_jo,v_rol),(v_fil,v_jo,v_rol)
    on conflict(fil_id,usuari_id) do nothing;
  -- Beta admin is derived from current institutional authority. It is not a
  -- permanent privilege after role withdrawal; no other participant field moves.
  update public.xat_participants set rol=v_rol where fil_id=v_fil and usuari_id=v_jo
    and rol is distinct from v_rol;
  -- Existing exit, archive, silence, read cursors and signing identity survive.
  return v_fil;
end;
$$;
revoke all on function private.xat_reconcilia_beta_testers(uuid) from public,anon,authenticated,service_role;

create or replace function private.es_admin_del_fil(p_fil_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.es_participant(p_fil_id) and exists(
    select 1 from public.xat_participants p join public.xat_fils f on f.id=p.fil_id
    where p.fil_id=p_fil_id and p.usuari_id=(select auth.uid()) and p.rol in ('propietari','admin')
      and (f.canal_clau is null or (private.xat_beta_membre_vigent(f.tenant_id,p.usuari_id)
        and private.can_manage_organization(f.subjecte_id::uuid))));
$$;
revoke all on function private.es_admin_del_fil(uuid) from public,anon,service_role;
grant execute on function private.es_admin_del_fil(uuid) to authenticated;

create or replace function private.xat_participant_vigent(p_fil_id uuid, p_usuari_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.xat_participants p
    join public.xat_fils f on f.id = p.fil_id
    where p.fil_id = p_fil_id and p.usuari_id = p_usuari_id
      and (f.canal_clau is null or private.xat_beta_membre_vigent(f.tenant_id,p_usuari_id))
      and (f.propi_usuari_id is null or (f.propi_usuari_id=p_usuari_id
        and exists(select 1 from public.profiles pr where pr.id=p_usuari_id and pr.baixa_demanada_at is null)
        and not exists(select 1 from private.baixes bx where bx.user_id=p_usuari_id)))
      and (f.interlocutor_id is null or f.org_id is not null)
      and (
        (p.com_org_id is null
          and (f.interlocutor_id is null or f.interlocutor_id = p_usuari_id)
          and exists (select 1 from public.town_memberships tm
            where tm.town_id = f.tenant_id and tm.user_id = p_usuari_id))
        or (p.com_org_id = f.org_id and exists (
          select 1 from public.organization_memberships om
          where om.organization_id = f.org_id and om.tenant_id = f.tenant_id
            and om.user_id = p_usuari_id and om.role in ('owner', 'admin')))
      )
      and (f.subjecte_tipus is null or f.subjecte_tipus not in ('entitat', 'grup')
        or exists (select 1 from public.organizations so
          where so.id = (case when f.subjecte_tipus in ('entitat', 'grup') then f.subjecte_id::uuid end)
            and (so.visibility = 'public' or exists (select 1 from public.organization_memberships sm
              where sm.organization_id = so.id and sm.user_id = p_usuari_id))))
  );
$$;

create or replace function private.xat_fil_de_pagina_visible(p_fil_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.xat_fils f
    where f.id = p_fil_id and f.subjecte_tipus is not null
      and private.is_town_member(f.tenant_id)
      and (f.canal_clau is null or private.xat_beta_membre_vigent(f.tenant_id,(select auth.uid())))
      and exists (select 1 from private.xat_subjecte(f.tenant_id, f.subjecte_tipus, f.subjecte_id)));
$$;

drop function if exists public.xat_fils_meus(uuid);
CREATE FUNCTION public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb,
  comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text,
  subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text, epoca_actual integer, cap_epoca_hash text, e2ee_des_de_seq bigint, canal_clau text
)
language plpgsql volatile security definer SET search_path = ''
as $$
#variable_conflict use_column
begin
  -- R22 · Beta reconciliation is best effort only for the two expected
  -- configuration outcomes, which roll back just this block while the inbox
  -- keeps listing direct, own and existing threads:
  --   · 23514 raised as SDP-XAT-018 (incoherent channel, for example after
  --     rotating the institutional principal);
  --   · 55P03 lock_not_available (lock_timeout while another session holds
  --     the per-town lock); the next listing retries.
  -- R22 (ronda 3) · Each warning carries the real SQLSTATE (as its code and in
  -- the text) and only SDP-XAT-018 keeps that label. Any other error, also a
  -- 23514 from another check, 23505, 40001, 40P01 or a code bug, propagates
  -- with its own SQLSTATE. statement_timeout (57014) is never caught here.
  begin
    perform private.xat_reconcilia_beta_testers(p_tenant_id);
  exception
    when check_violation then
      if sqlerrm not like 'SDP-XAT-018:%' then raise; end if;
      raise warning using errcode = sqlstate,
        message = format('SDP-XAT-018: reconciliació del canal Beta omesa (SQLSTATE %s).', sqlstate);
    when lock_not_available then
      raise warning using errcode = sqlstate,
        message = format('Canal Beta: reconciliació ajornada, pany per poble ocupat (SQLSTATE %s).', sqlstate);
  end;
  insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
  select f.id, om.user_id, f.org_id, 'admin' from public.xat_fils f
  join public.organization_memberships om on om.organization_id = f.org_id and om.tenant_id = f.tenant_id
  where f.tenant_id = p_tenant_id and f.interlocutor_id is not null
    and f.interlocutor_id <> (select auth.uid())
    and om.user_id = (select auth.uid()) and om.role in ('owner', 'admin')
  on conflict (fil_id, usuari_id) do nothing;

  return query select f.id, f.tipus, f.titol,
    coalesce(f.imatge_url, costat.dades -> 0 ->> 'avatarUrl'), f.actualitzat_al,
    coalesce(costat.noms, array[]::text[]), u.text, u.creat_al, u.usuari_id,
    f.ultim_seq, jo.llegit_fins_seq, jo.rebut_fins_seq,
    coalesce((select min(p.llegit_fins_seq) from public.xat_participants p
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or p.com_org_id is distinct from jo.com_org_id)), 0),
    greatest(0, f.ultim_seq - greatest(jo.llegit_fins_seq, jo.buidat_fins_seq))::integer,
    jo.arxivat_al, jo.fixat_al, jo.silenciat_fins_al, jo.preferit_al, jo.no_llegit_manual,
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb),
    f.comunitat_id, f.subjecte_tipus, f.subjecte_id, f.subjecte_ruta, f.subjecte_titol, f.subjecte_uri,
    jo.rol,
    (select count(*)::integer from public.xat_participants p
      where p.fil_id = f.id and p.visible_fins_seq is null),
    u.tipus, f.epoca_actual, f.cap_epoca_hash, f.e2ee_des_de_seq, f.canal_clau
  from public.xat_fils f
  join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = (select auth.uid())
    and jo.visible_fins_seq is null
  left join public.organizations o on o.id = f.org_id
  left join lateral (
    select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom, 'tipus', c.tipus,
      'avatarUrl', c.avatar_url, 'slug', c.slug) order by c.nom) as dades,
      array_agg(c.nom order by c.nom) as noms
    from (
      select o.id, o.name as nom, 'entitat'::text as tipus, o.logo_url as avatar_url, o.slug
      where o.id is not null and jo.com_org_id is null
      union all
      select pr.id, coalesce(pr.full_name, 'Veí'), 'persona'::text, pr.avatar_url, null::text
      from public.xat_participants p join public.profiles pr on pr.id = p.usuari_id
      where p.fil_id = f.id and (p.usuari_id <> (select auth.uid()) or f.propi_usuari_id = (select auth.uid()))
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or (jo.com_org_id is not null and p.com_org_id is null))
        and f.subjecte_tipus is null
    ) c
  ) costat on true
  left join lateral (
    select m.text, m.creat_al, m.usuari_id, m.tipus from public.xat_missatges m
    where m.fil_id = f.id and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;


-- Extend only the current E2EE-aware format contract. Keep encryption and caps.
alter table public.xat_adjunts drop constraint if exists xat_adjunts_format_lot3;
alter table public.xat_adjunts add constraint xat_adjunts_format_lot3 check(coalesce(
  (xifrat and mime='application/octet-stream' and durada_ms is null) or
  (not xifrat and mime in ('image/webp','image/png','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg')
    and ((mime like 'image/%' and durada_ms is null) or (mime like 'video/%' and durada_ms between 1 and 10000)
      or (mime like 'audio/%' and durada_ms>0))),false));
update storage.buckets set public=false,file_size_limit=20000000,
  allowed_mime_types=array['image/webp','image/png','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg','application/octet-stream']
  where id='xat_adjunts';
create or replace function private.xat_maxim_adjunt(p_mime text) returns bigint
language sql immutable set search_path = '' as $$
  select (case when p_mime in ('image/webp','image/png','image/jpeg') then 2000000
    when p_mime in ('audio/mp4','audio/webm','audio/ogg') then 3000000
    when p_mime in ('application/octet-stream','video/mp4','video/webm','video/quicktime') then 20000000 end)::bigint;
$$;
revoke all on function private.xat_maxim_adjunt(text) from public,anon,authenticated,service_role;



-- T3: consented source state is private and is not a publication executor.
-- Only a privileged operator creates/approves a source or product link. The
-- service RPC below records a pure daily plan; it never mutates app_content,
-- section_submissions, slugs, images, tags or public visibility.
create table if not exists private.aparadors_sync_sources(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  canonical_origin text not null check(char_length(canonical_origin)<=500 and
    canonical_origin ~ '^https://[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    and canonical_origin !~ '^https://[0-9.]+$'
    and canonical_origin !~ '\.(localhost|local|internal|invalid)$'),
  consented_at timestamptz,
  enabled boolean not null default false,
  state_version bigint not null default 0 check(state_version between 0 and 9007199254740991),
  last_complete_scan_date date,
  last_complete_scan_digest text check(last_complete_scan_digest ~ '^[0-9a-f]{64}$'),
  unique(tenant_id,canonical_origin),
  check((last_complete_scan_date is null)=(last_complete_scan_digest is null))
);
create table if not exists private.aparadors_sync_products(
  source_id uuid not null references private.aparadors_sync_sources(id) on delete cascade,
  external_product_id text not null check(char_length(external_product_id) between 1 and 200),
  external_source_url text not null check(char_length(external_source_url)<=2048 and external_source_url like 'https://%'),
  -- The link is optional: an approved legacy catalogue may use app_content.
  -- A URL match alone is never proof of ownership or a publish permission.
  linked_submission_id uuid,
  approved_at timestamptz,
  title text not null check(char_length(title) between 1 and 300),
  price_cents bigint not null check(price_cents between 0 and 9007199254740991),
  currency text not null default 'EUR' check(currency='EUR'),
  in_stock boolean,
  status text not null default 'pending_review' check(status in ('active','pending_review','seasonal_hidden')),
  missing_streak smallint not null default 0 check(missing_streak between 0 and 2),
  last_seen_date date,
  last_missing_scan_date date,
  proposed_status text check(proposed_status='seasonal_hidden'),
  proposed_label text check(char_length(proposed_label)<=80),
  primary key(source_id,external_product_id),
  unique(source_id,external_source_url),
  check(status<>'active' or approved_at is not null),
  check(proposed_status is null or missing_streak>=2)
);
create table if not exists private.aparadors_sync_events(
  event_key text primary key check(event_key ~ '^[0-9a-f]{64}$'),
  source_id uuid not null references private.aparadors_sync_sources(id) on delete cascade,
  external_product_id text not null,
  kind text not null check(kind in ('price_changed','stock_changed','new_product_detected',
    'product_missing_in_source','product_returned_to_source')),
  observed_on date not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now(),
  foreign key(source_id,external_product_id)
    references private.aparadors_sync_products(source_id,external_product_id) on delete cascade
);
create table if not exists private.aparadors_sync_aplicacions(
  source_id uuid not null references private.aparadors_sync_sources(id) on delete cascade,
  observed_on date not null,
  scan_digest text not null check(scan_digest ~ '^[0-9a-f]{64}$'),
  plan_sha256 text not null check(plan_sha256 ~ '^[0-9a-f]{64}$'),
  confirmed_version bigint not null,
  primary key(source_id,observed_on)
);
-- The full plan is not retained. Receipts are hashes and versions only; all
-- rows cascade with source/account deletion. No permanent owner-linked ledger.
alter table private.aparadors_sync_sources enable row level security;
alter table private.aparadors_sync_products enable row level security;
alter table private.aparadors_sync_events enable row level security;
alter table private.aparadors_sync_aplicacions enable row level security;
revoke all on table private.aparadors_sync_sources,private.aparadors_sync_products,
  private.aparadors_sync_events,private.aparadors_sync_aplicacions from public,anon,authenticated,service_role;
-- No direct table ACL and no policy for any API role, service_role included.
-- private is not an exposed API schema; the only entry point is the
-- service-only SECURITY DEFINER RPC below (consent, CAS and receipts). RLS
-- stays enabled with no policy, so a later grant by mistake still reads nothing
-- for a role without BYPASSRLS. The drops converge an earlier draft that gave
-- service_role a using(true) read policy.
drop policy if exists aparadors_sync_service_lectura on private.aparadors_sync_sources;
drop policy if exists aparadors_sync_service_lectura on private.aparadors_sync_products;
drop policy if exists aparadors_sync_service_lectura on private.aparadors_sync_events;
drop policy if exists aparadors_sync_service_lectura on private.aparadors_sync_aplicacions;

create or replace function private.aparadors_sync_claus(p jsonb,admeses text[])
returns boolean language sql immutable set search_path='' as $$
  select case when jsonb_typeof(p)='object' then not exists(
    select 1 from jsonb_object_keys(p) k where not(k=any(admeses))) else false end;
$$;
create or replace function private.aparadors_sync_enter(p jsonb, maxim numeric)
returns boolean language sql immutable set search_path='' as $$
  select case when jsonb_typeof(p)='number' then (p#>>'{}')::numeric between 0 and maxim
    and trunc((p#>>'{}')::numeric)=(p#>>'{}')::numeric else false end;
$$;
create or replace function private.aparadors_sync_data(p text)
returns boolean language plpgsql immutable set search_path='' as $$
begin
  if p is null or p !~ '^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$' then return false; end if;
  perform make_date(substring(p,1,4)::int,substring(p,6,2)::int,substring(p,9,2)::int);
  return true;
exception when datetime_field_overflow then return false;
end;
$$;
create or replace function private.aparadors_sync_resum(p jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
begin
  if p is null or p='null'::jsonb then return true; end if;
  if not private.aparadors_sync_claus(p,array['title','price_cents','currency','in_stock','status','proposed_label','missing_streak']) then return false; end if;
  if p?'title' and (jsonb_typeof(p->'title')<>'string' or char_length(p->>'title') not between 1 and 300
    or position('<' in p->>'title')>0 or position('>' in p->>'title')>0) then return false; end if;
  if p?'price_cents' and not private.aparadors_sync_enter(p->'price_cents',9007199254740991) then return false; end if;
  if p?'currency' and (p->>'currency') is distinct from 'EUR' then return false; end if;
  if p?'in_stock' and jsonb_typeof(p->'in_stock') not in ('boolean','null') then return false; end if;
  if p?'status' and coalesce(p->>'status','') not in ('active','pending_review','seasonal_hidden') then return false; end if;
  if p?'proposed_label' and (jsonb_typeof(p->'proposed_label') not in ('string','null') or char_length(p->>'proposed_label')>80) then return false; end if;
  if p?'missing_streak' and not private.aparadors_sync_enter(p->'missing_streak',2) then return false; end if;
  return true;
end;
$$;
revoke all on function private.aparadors_sync_claus(jsonb,text[]),private.aparadors_sync_enter(jsonb,numeric),
  private.aparadors_sync_data(text),private.aparadors_sync_resum(jsonb) from public,anon,authenticated,service_role;

-- Canonical JSON for this closed event schema, matching the pure engine.
-- Keys are ASCII contract fields, amounts are integral safe cents; source text
-- is already bounded. No user callback, dynamic SQL or external IO is involved.
create or replace function private.aparadors_sync_json_canonic(p jsonb)
returns text language plpgsql immutable set search_path='' as $$
begin
  case jsonb_typeof(p)
    when 'object' then return '{'||coalesce((select string_agg(to_jsonb(k)::text||':'||private.aparadors_sync_json_canonic(v),',' order by k collate pg_catalog."C") from jsonb_each(p) t(k,v)),'')||'}';
    when 'array' then return '['||coalesce((select string_agg(private.aparadors_sync_json_canonic(v),',' order by n) from jsonb_array_elements(p) with ordinality t(v,n)),'')||']';
    else return p::text;
  end case;
end;
$$;
create or replace function private.aparadors_sync_event(p_source uuid,p_day text,p_product text,p_kind text,p_before jsonb,p_after jsonb)
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object('event_key',encode(sha256(convert_to(private.aparadors_sync_json_canonic(
    jsonb_build_array(p_source::text,p_day,p_product,p_kind,p_before,p_after)),'UTF8')),'hex'),
    'external_product_id',p_product,'kind',p_kind,'before',p_before,'after',p_after);
$$;
revoke all on function private.aparadors_sync_json_canonic(jsonb),private.aparadors_sync_event(uuid,text,text,text,jsonb,jsonb)
  from public,anon,authenticated,service_role;

create or replace function public.aparadors_sync_registra_pla(p_pla jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  s private.aparadors_sync_sources%rowtype; pr private.aparadors_sync_products%rowtype;
  receipt private.aparadors_sync_aplicacions%rowtype;
  c jsonb; st jsonb; ev jsonb; v_id text; v_url text; v_mode text; v_date date;
  v_seen date; v_missing date; v_streak int; v_source uuid; v_expected bigint; v_hash text;
  v_new boolean; v_count int; v_changes int; v_events int;
  v_expected_events jsonb:='[]'::jsonb; v_expected_ordered jsonb; v_provided_ordered jsonb;
  v_expected_proposal text;
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'SDP-SYNC-001: cal el servei autoritzat.' using errcode='42501';
  end if;
  if p_pla is null or octet_length(p_pla::text)>4194304
    or not private.aparadors_sync_claus(p_pla,array['schema','source_id','observed_on','expected_state_version','scan','product_changes','events'])
    or not(p_pla?&array['schema','source_id','observed_on','expected_state_version','scan','product_changes','events'])
    or (p_pla->>'schema') is distinct from 'sdp.aparadors-sync.plan.v1'
    or coalesce(p_pla->>'source_id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or not private.aparadors_sync_data(p_pla->>'observed_on')
    or not private.aparadors_sync_enter(p_pla->'expected_state_version',9007199254740991)
    or not private.aparadors_sync_claus(p_pla->'scan',array['status','digest','product_count','reason'])
    or not((p_pla->'scan')?&array['status','digest','product_count','reason'])
    or coalesce(p_pla#>>'{scan,status}','') not in ('complete','partial','rejected')
    or coalesce(p_pla#>>'{scan,digest}','') !~ '^[0-9a-f]{64}$'
    or not private.aparadors_sync_enter(p_pla#>'{scan,product_count}',2000)
    or jsonb_typeof(p_pla#>'{scan,reason}') not in ('null','string')
    or char_length(p_pla#>>'{scan,reason}')>200
    or jsonb_typeof(p_pla->'product_changes') is distinct from 'array'
    or jsonb_typeof(p_pla->'events') is distinct from 'array' then
    raise exception 'SDP-SYNC-002: pla invàlid.' using errcode='22023';
  end if;
  v_changes:=jsonb_array_length(p_pla->'product_changes'); v_events:=jsonb_array_length(p_pla->'events');
  if v_changes>2000 or v_events>4000 then raise exception 'SDP-SYNC-002: pla massa gran.' using errcode='22023'; end if;
  v_source:=(p_pla->>'source_id')::uuid; v_date:=(p_pla->>'observed_on')::date;
  v_expected:=(p_pla->>'expected_state_version')::bigint;
  select * into s from private.aparadors_sync_sources where id=v_source for update;
  if not found or not s.enabled or s.consented_at is null or (s.consented_at at time zone 'UTC')::date>v_date or
    not private.xat_beta_membre_vigent(s.tenant_id,s.owner_user_id) then
    raise exception 'SDP-SYNC-001: origen no autoritzat o consentiment retirat.' using errcode='42501';
  end if;
  if p_pla#>>'{scan,status}'<>'complete' then
    if v_changes<>0 or v_events<>0 then raise exception 'SDP-SYNC-002: captura incompleta amb canvis.' using errcode='22023'; end if;
    return jsonb_build_object('aplicat',false,'rebutjat',true,'state_version',s.state_version);
  end if;
  v_hash:=encode(sha256(convert_to(p_pla::text,'UTF8')),'hex');
  select * into receipt from private.aparadors_sync_aplicacions where source_id=v_source and observed_on=v_date;
  if found then
    if receipt.scan_digest is distinct from p_pla#>>'{scan,digest}'
      or (receipt.plan_sha256<>v_hash and not(v_changes=0 and v_events=0 and v_expected=s.state_version)) then
      raise exception 'SDP-SYNC-003: el dia ja té una captura immutable.' using errcode='40001';
    end if;
    return jsonb_build_object('aplicat',false,'replay',true,'state_version',s.state_version,'confirmed_version',receipt.confirmed_version);
  end if;
  if s.state_version<>v_expected or s.state_version>=9007199254740991
    or (s.last_complete_scan_date is not null and v_date<=s.last_complete_scan_date) then
    raise exception 'SDP-SYNC-003: versió o data desfasada.' using errcode='40001';
  end if;
  if (p_pla#>>'{scan,product_count}')::int=0 and exists(select 1 from private.aparadors_sync_products where source_id=v_source) then
    raise exception 'SDP-SYNC-002: catàleg buit sospitós.' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(p_pla->'product_changes') x group by x->>'external_product_id' having count(*)>1)
    or exists(select 1 from jsonb_array_elements(p_pla->'events') x group by x->>'event_key' having count(*)>1) then
    raise exception 'SDP-SYNC-002: identificadors duplicats.' using errcode='22023';
  end if;
  if exists(select 1 from private.aparadors_sync_products known_product where known_product.source_id=v_source
    and not exists(select 1 from jsonb_array_elements(p_pla->'product_changes') x where x->>'external_product_id'=known_product.external_product_id))
    or (select count(*) from jsonb_array_elements(p_pla->'product_changes') x
      where x#>>'{state,last_seen_date}'=p_pla->>'observed_on')<>(p_pla#>>'{scan,product_count}')::int then
    raise exception 'SDP-SYNC-002: la captura no cobrix tot el registre.' using errcode='22023';
  end if;
  for c in select * from jsonb_array_elements(p_pla->'product_changes') loop
    st:=c->'state'; v_id:=c->>'external_product_id'; v_url:=c->>'external_source_url'; v_mode:=c->>'mode';
    if not private.aparadors_sync_claus(c,array['external_product_id','external_source_url','mode','state','proposed_status'])
      or not(c?&array['external_product_id','external_source_url','mode','state','proposed_status'])
      or jsonb_typeof(c->'external_product_id') is distinct from 'string' or char_length(v_id) not between 1 and 200
      or jsonb_typeof(c->'external_source_url') is distinct from 'string' or char_length(v_url)>2048
      or left(v_url,char_length(s.canonical_origin)+1)<>s.canonical_origin||'/'
      or v_url !~ '^[!-~]+$' or position(chr(92) in v_url)>0 or position('#' in v_url)>0
      or position('<' in v_url)>0 or position('>' in v_url)>0
      or coalesce(v_mode,'') not in ('insert_pending_review','update_linked','observe')
      or not private.aparadors_sync_claus(st,array['title','price_cents','currency','in_stock','status','missing_streak','last_seen_date','last_missing_scan_date','proposed_label'])
      or not private.aparadors_sync_resum(st-array['last_seen_date','last_missing_scan_date'])
      or not(st?&array['title','price_cents','currency','in_stock','status','missing_streak','last_seen_date','last_missing_scan_date','proposed_label'])
      or not private.aparadors_sync_enter(st->'missing_streak',2)
      or (st->>'last_seen_date' is not null and not private.aparadors_sync_data(st->>'last_seen_date'))
      or (st->>'last_missing_scan_date' is not null and not private.aparadors_sync_data(st->>'last_missing_scan_date'))
      or jsonb_typeof(c->'proposed_status') not in ('null','string')
      or (c->>'proposed_status' is not null and c->>'proposed_status'<>'seasonal_hidden') then
      raise exception 'SDP-SYNC-002: producte invàlid.' using errcode='22023';
    end if;
    v_seen:=(st->>'last_seen_date')::date; v_missing:=(st->>'last_missing_scan_date')::date; v_streak:=(st->>'missing_streak')::int;
    select * into pr from private.aparadors_sync_products where source_id=v_source and external_product_id=v_id for update;
    v_new:=not found;
    if exists(select 1 from private.aparadors_sync_products where source_id=v_source and external_source_url=v_url and external_product_id<>v_id)
      or (not v_new and pr.external_source_url<>v_url) then
      raise exception 'SDP-SYNC-002: col·lisió d’identitat o URL.' using errcode='22023';
    end if;
    if v_new then
      if v_mode<>'insert_pending_review' or st->>'status'<>'pending_review' or v_streak<>0 or v_seen is distinct from v_date
        or v_missing is not null or c->>'proposed_status' is not null then
        raise exception 'SDP-SYNC-002: un producte nou requerix revisió.' using errcode='22023';
      end if;
      v_expected_events:=v_expected_events||jsonb_build_array(private.aparadors_sync_event(v_source,p_pla->>'observed_on',v_id,'new_product_detected',null,
        jsonb_build_object('title',st->>'title','price_cents',(st->>'price_cents')::bigint,'currency','EUR','in_stock',(st->>'in_stock')::boolean,
          'status','pending_review','proposed_label',st->>'proposed_label')));
      insert into private.aparadors_sync_products(source_id,external_product_id,external_source_url,title,price_cents,currency,in_stock,last_seen_date,proposed_label)
        values(v_source,v_id,v_url,st->>'title',(st->>'price_cents')::bigint,'EUR',(st->>'in_stock')::boolean,v_seen,st->>'proposed_label');
    else
      if v_mode='insert_pending_review' or st->>'status' is distinct from pr.status or st->>'title' is distinct from pr.title
        or st->>'proposed_label' is distinct from pr.proposed_label then
        raise exception 'SDP-SYNC-002: el pla no pot reaprovar ni reescriure la fitxa.' using errcode='22023';
      end if;
      if v_seen=v_date then
        if v_streak<>0 or v_missing is not null then raise exception 'SDP-SYNC-002: observació present inconsistent.' using errcode='22023'; end if;
      elsif v_seen is not distinct from pr.last_seen_date and v_missing=v_date then
        if v_streak<>least(2,pr.missing_streak+1) then raise exception 'SDP-SYNC-002: comptador d’absència invàlid.' using errcode='22023'; end if;
      else raise exception 'SDP-SYNC-002: dates de producte invàlides.' using errcode='22023'; end if;
      v_expected_proposal:=case when pr.missing_streak<2 and v_streak=2 and pr.status<>'seasonal_hidden' and v_missing=v_date
        then 'seasonal_hidden' else null end;
      if (c->>'proposed_status' is distinct from v_expected_proposal)
        or (v_mode='update_linked' and (pr.approved_at is null or (pr.approved_at at time zone 'UTC')::date>v_date
          or pr.status='pending_review' or v_seen is distinct from v_date))
        or (v_mode='update_linked' and st->>'in_stock' is null and pr.in_stock is not null)
        or (v_mode='observe' and ((st->>'price_cents')::bigint<>pr.price_cents or (st->>'in_stock')::boolean is distinct from pr.in_stock)) then
        raise exception 'SDP-SYNC-002: actualització fora del vincle aprovat.' using errcode='22023';
      end if;
      if v_mode='update_linked' and (st->>'price_cents')::bigint<>pr.price_cents then
        v_expected_events:=v_expected_events||jsonb_build_array(private.aparadors_sync_event(v_source,p_pla->>'observed_on',v_id,'price_changed',
          jsonb_build_object('price_cents',pr.price_cents),jsonb_build_object('price_cents',(st->>'price_cents')::bigint)));
      end if;
      if v_mode='update_linked' and (st->>'in_stock')::boolean is distinct from pr.in_stock then
        v_expected_events:=v_expected_events||jsonb_build_array(private.aparadors_sync_event(v_source,p_pla->>'observed_on',v_id,'stock_changed',
          jsonb_build_object('in_stock',pr.in_stock),jsonb_build_object('in_stock',(st->>'in_stock')::boolean)));
      end if;
      if v_seen=v_date and pr.status='seasonal_hidden' and pr.missing_streak>0 then
        v_expected_events:=v_expected_events||jsonb_build_array(private.aparadors_sync_event(v_source,p_pla->>'observed_on',v_id,'product_returned_to_source',
          jsonb_build_object('status',pr.status,'missing_streak',pr.missing_streak),jsonb_build_object('status',pr.status,'missing_streak',0)));
      end if;
      if v_expected_proposal='seasonal_hidden' then
        v_expected_events:=v_expected_events||jsonb_build_array(private.aparadors_sync_event(v_source,p_pla->>'observed_on',v_id,'product_missing_in_source',
          jsonb_build_object('missing_streak',pr.missing_streak,'status',pr.status),jsonb_build_object('missing_streak',2,'status',pr.status)));
      end if;
      update private.aparadors_sync_products set
        price_cents=case when v_mode='update_linked' then (st->>'price_cents')::bigint else pr.price_cents end,
        in_stock=case when v_mode='update_linked' then (st->>'in_stock')::boolean else pr.in_stock end,
        missing_streak=v_streak,last_seen_date=v_seen,last_missing_scan_date=v_missing,
        proposed_status=case when v_seen=v_date then null else coalesce(c->>'proposed_status',pr.proposed_status) end
        where source_id=v_source and external_product_id=v_id;
    end if;
  end loop;
  -- Missing, invented, altered or incorrectly hashed audit events roll back the
  -- entire plan, including earlier product writes. No silent price-only update.
  select coalesce(jsonb_agg(e order by e->>'external_product_id' collate pg_catalog."C",e->>'kind' collate pg_catalog."C"),'[]'::jsonb)
    into v_expected_ordered from jsonb_array_elements(v_expected_events) t(e);
  select coalesce(jsonb_agg(e order by e->>'external_product_id' collate pg_catalog."C",e->>'kind' collate pg_catalog."C"),'[]'::jsonb)
    into v_provided_ordered from jsonb_array_elements(p_pla->'events') t(e);
  if v_expected_ordered<>v_provided_ordered then
    raise exception 'SDP-SYNC-002: auditoria absent o no coherent amb el canvi.' using errcode='22023';
  end if;
  for ev in select * from jsonb_array_elements(p_pla->'events') loop
    if not private.aparadors_sync_claus(ev,array['event_key','external_product_id','kind','before','after'])
      or not(ev?&array['event_key','external_product_id','kind','before','after'])
      or coalesce(ev->>'event_key','') !~ '^[0-9a-f]{64}$'
      or coalesce(ev->>'kind','') not in ('price_changed','stock_changed','new_product_detected','product_missing_in_source','product_returned_to_source')
      or not private.aparadors_sync_resum(ev->'before') or not private.aparadors_sync_resum(ev->'after')
      or not exists(select 1 from private.aparadors_sync_products where source_id=v_source and external_product_id=ev->>'external_product_id') then
      raise exception 'SDP-SYNC-002: esdeveniment invàlid.' using errcode='22023';
    end if;
    insert into private.aparadors_sync_events(event_key,source_id,external_product_id,kind,observed_on,before_state,after_state)
      values(ev->>'event_key',v_source,ev->>'external_product_id',ev->>'kind',v_date,nullif(ev->'before','null'::jsonb),nullif(ev->'after','null'::jsonb));
  end loop;
  update private.aparadors_sync_sources set state_version=state_version+1,last_complete_scan_date=v_date,
    last_complete_scan_digest=p_pla#>>'{scan,digest}' where id=v_source;
  insert into private.aparadors_sync_aplicacions(source_id,observed_on,scan_digest,plan_sha256,confirmed_version)
    values(v_source,v_date,p_pla#>>'{scan,digest}',v_hash,s.state_version+1);
  return jsonb_build_object('aplicat',true,'replay',false,'state_version',s.state_version+1,'confirmed_version',s.state_version+1,
    'productes',v_changes,'esdeveniments',v_events);
end;
$$;
revoke all on function public.aparadors_sync_registra_pla(jsonb) from public,anon,authenticated;
grant execute on function public.aparadors_sync_registra_pla(jsonb) to service_role;

revoke all on function private.xat_fil_del_subjecte(uuid,text,uuid,text,uuid,text,text,text,text,text) from public,anon,authenticated,service_role;
revoke all on function private.xat_participant_vigent(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function private.xat_fil_de_pagina_visible(uuid) from public,anon,authenticated,service_role;
revoke all on function public.xat_fils_meus(uuid) from public,anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
