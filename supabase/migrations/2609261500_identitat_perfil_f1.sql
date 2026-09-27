-- ============================================================================
-- 260926_1500 · Identitat i perfil (Fase 1)
-- Decisions del Mestre D2, D3, D10, D11 i D12
-- (pla 260926_1235_pla_implementacio_fable, auditoria 260926_1330_auditoria_claude).
--
-- Additiva i idempotent: es pot tornar a executar. Requerix 260908_0000 ..
-- 260926_1200 aplicades. Mateix estil que 260920_0300: una sola transacció
-- amb temps d'espera curts, perquè les claus foranes noves bloquegen un moment
-- auth.users i organizations.
--
--   1. Perfil i organitzacions: lema, presentacio_html i hero_url (D2, I9, I12).
--   2. Autoria: author_org_id amb ON DELETE SET NULL i un sol índex (D10, I13).
--   3. Consentiment demostrable: versions, registre de només afegir, revocació,
--      re-consentiment i bloqueig després de la supressió (D3, I5).
--   4. Alta que no cau mai: poble amb reserva i incidència reparable (D11, I14).
--   5. Exportació, baixa amb quarantena, anonimització i purga (D12, I15).
--
-- Codis nous: SDP-RGPD-0xx (consentiment), SDP-REG-0xx/9xx (alta),
-- SDP-EXPORT-000 i SDP-BAIXA-0xx/9xx (compte).
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · Ajustos: pebre de les empremptes i dies de quarantena ─────────────────
-- El pebre es genera una sola volta; si ja existix, no es toca (canviar-lo
-- trencaria la relació entre empremptes velles i noves).
insert into private.ajustos (clau, valor)
values
  ('pebre_rgpd', encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text, 'UTF8')), 'hex')),
  ('dies_quarantena_baixa', '30')
on conflict (clau) do nothing;


-- ── 1 · Perfil de persona (D2) ───────────────────────────────────────────────
-- Fitxa: H1 = full_name, H2 = bio, entradilla = lema, cos = presentacio_html,
-- logotip = avatar_url, capçalera = hero_url, publicat = is_public.
alter table public.profiles
  add column if not exists lema text not null default ''
    constraint profiles_lema_llargaria check (char_length(lema) <= 120);

-- El client sanejarà sempre el cos (DOMPurify); el CHECK és només la segona línia.
alter table public.profiles
  add column if not exists presentacio_html text not null default ''
    constraint profiles_presentacio_llargaria check (char_length(presentacio_html) <= 20000)
    constraint profiles_presentacio_sense_script check (presentacio_html !~* '<\s*script');

-- Buit o null = sense capçalera. Només https, el bucket públic o una ruta del
-- mateix lloc: res de data:, javascript: ni del bucket privat (no es veuria).
alter table public.profiles
  add column if not exists hero_url text
    constraint profiles_hero_url_valida check (
      hero_url is null
      or hero_url = ''
      or (char_length(hero_url) <= 2048 and hero_url ~ '^(https://|sdp-media://mitjans/|/[^/])')
    );

-- La marca de baixa només l'escriuen les funcions de baixa: cap permís de columna.
alter table public.profiles
  add column if not exists baixa_demanada_at timestamptz;

grant update (lema, presentacio_html, hero_url) on table public.profiles to authenticated;

-- H2 de la persona (bio, M05): el client la limita a 500 caràcters, com la
-- descripció d'una organització (M01). La restricció només s'hi posa si cap
-- fila vella la trencaria: una bio més llarga bloquejaria qualsevol UPDATE
-- d'eixe perfil, també el de la baixa.
do $$
begin
  if exists (select 1 from pg_catalog.pg_constraint
             where conrelid = 'public.profiles'::regclass and conname = 'profiles_bio_llargaria') then
    null;
  elsif exists (select 1 from public.profiles where char_length(bio) > 500) then
    raise notice 'SDP-PERFIL-001: hi ha bios de més de 500 caràcters; profiles_bio_llargaria queda sense posar.';
  else
    alter table public.profiles
      add constraint profiles_bio_llargaria check (char_length(bio) <= 500);
  end if;
end
$$;

-- En quarantena el perfil queda congelat. Restrictiva perquè cap política
-- permissiva el puga reobrir. Les funcions de baixa són de la propietària de
-- la taula i no hi passen.
drop policy if exists "profiles sense baixa" on public.profiles;
create policy "profiles sense baixa" on public.profiles
as restrictive for update to authenticated
using (baixa_demanada_at is null);


-- ── 2 · Organitzacions (D2, I12) ─────────────────────────────────────────────
-- Fitxa: H1 = name, H2 = description, entradilla = lema, cos = presentacio_html,
-- logotip = logo_url, capçalera = hero_url, publicat = visibility = 'public'.
alter table public.organizations
  add column if not exists logo_url text;

alter table public.organizations
  add column if not exists presentacio_html text not null default ''
    constraint organizations_presentacio_llargaria check (char_length(presentacio_html) <= 20000)
    constraint organizations_presentacio_sense_script check (presentacio_html !~* '<\s*script');

alter table public.organizations
  add column if not exists hero_url text
    constraint organizations_hero_url_valida check (
      hero_url is null
      or hero_url = ''
      or (char_length(hero_url) <= 2048 and hero_url ~ '^(https://|sdp-media://mitjans/|/[^/])')
    );

-- logo_url (260926_1200) naix sense cap restricció i ara es pot escriure i ix
-- al directori públic: la mateixa regla que hero_url. Només s'hi posa si cap
-- fila vella la trencaria, com profiles_bio_llargaria.
do $$
begin
  if exists (select 1 from pg_catalog.pg_constraint
             where conrelid = 'public.organizations'::regclass and conname = 'organizations_logo_url_valida') then
    null;
  elsif exists (select 1 from public.organizations
                where not (logo_url is null
                           or logo_url = ''
                           or (char_length(logo_url) <= 2048 and logo_url ~ '^(https://|sdp-media://mitjans/|/[^/])'))) then
    raise notice 'SDP-PERFIL-002: hi ha logo_url que no són https ni del bucket públic; organizations_logo_url_valida queda sense posar.';
  else
    alter table public.organizations
      add constraint organizations_logo_url_valida check (
        logo_url is null
        or logo_url = ''
        or (char_length(logo_url) <= 2048 and logo_url ~ '^(https://|sdp-media://mitjans/|/[^/])')
      );
  end if;
end
$$;

-- I12: logo_url (260926_1200) no tenia cap permís. Sense el de lectura, un
-- PATCH amb return=representation que torne la fila sencera fallava amb 42501.
grant select (logo_url, hero_url, presentacio_html) on table public.organizations to anon, authenticated;
grant update (logo_url, hero_url, presentacio_html) on table public.organizations to authenticated;

-- Directori públic: les columnes noves van al final (requisit de CREATE OR REPLACE).
create or replace view public.organization_directory with (security_invoker = true, security_barrier = true)
as
select
  id,
  tenant_id,
  slug,
  name,
  kind,
  parent_organization_id,
  lema,
  description,
  created_at,
  updated_at,
  logo_url,
  hero_url,
  presentacio_html
from public.organizations
where visibility = 'public';

revoke all on table public.organization_directory from public, anon, authenticated;
grant select on table public.organization_directory to anon, authenticated;

-- El returns table canvia: create or replace no ho admet, cal esborrar-la.
drop function if exists public.list_my_organizations(uuid);
create function public.list_my_organizations(p_tenant_id uuid)
returns table (
  id uuid,
  tenant_id uuid,
  slug text,
  name text,
  kind text,
  parent_organization_id uuid,
  lema text,
  description text,
  visibility text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  logo_url text,
  hero_url text,
  presentacio_html text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    organization.id,
    organization.tenant_id,
    organization.slug,
    organization.name,
    organization.kind,
    organization.parent_organization_id,
    organization.lema,
    organization.description,
    organization.visibility,
    membership.role,
    organization.created_at,
    organization.updated_at,
    organization.logo_url,
    organization.hero_url,
    organization.presentacio_html
  from public.organization_memberships membership
  join public.organizations organization
    on organization.id = membership.organization_id
   and organization.tenant_id = membership.tenant_id
  where membership.user_id = (select auth.uid())
    and membership.tenant_id = p_tenant_id
  order by organization.created_at asc;
$$;

revoke execute on function public.list_my_organizations(uuid) from public, anon;
grant execute on function public.list_my_organizations(uuid) to authenticated;


-- ── 3 · Claus foranes que no esborren ni bloquegen (D10, D12) ───────────────
-- section_submissions.author_org_id: 260908_0000 la va crear amb CASCADE i la
-- línia de 260926_1200 no va fer res perquè la columna ja existia (I13).
-- xat_fils.creat_per, user_platform_roles.granted_by i
-- organization_claims.resolta_per impedien esborrar una persona (T1).
-- Es busquen pel catàleg perquè el nom pot variar entre bases.
do $$
declare
  r record;
begin
  for r in
    select cl.relname as taula, c.conname as nom
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_class cl on cl.oid = c.conrelid
    join pg_catalog.pg_namespace n on n.oid = cl.relnamespace
    join pg_catalog.pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and n.nspname = 'public'
      and cardinality(c.conkey) = 1
      and (
           (cl.relname = 'section_submissions' and a.attname = 'author_org_id')
        or (cl.relname = 'xat_fils'            and a.attname = 'creat_per')
        or (cl.relname = 'user_platform_roles' and a.attname = 'granted_by')
        or (cl.relname = 'organization_claims' and a.attname = 'resolta_per')
      )
  loop
    execute format('alter table public.%I drop constraint %I', r.taula, r.nom);
  end loop;
end
$$;

alter table public.xat_fils alter column creat_per drop not null;

alter table public.section_submissions
  add constraint section_submissions_author_org_id_fkey
  foreign key (author_org_id) references public.organizations (id) on delete set null not valid;
alter table public.section_submissions validate constraint section_submissions_author_org_id_fkey;

alter table public.xat_fils
  add constraint xat_fils_creat_per_fkey
  foreign key (creat_per) references auth.users (id) on delete set null not valid;
alter table public.xat_fils validate constraint xat_fils_creat_per_fkey;

alter table public.user_platform_roles
  add constraint user_platform_roles_granted_by_fkey
  foreign key (granted_by) references auth.users (id) on delete set null not valid;
alter table public.user_platform_roles validate constraint user_platform_roles_granted_by_fkey;

alter table public.organization_claims
  add constraint organization_claims_resolta_per_fkey
  foreign key (resolta_per) references auth.users (id) on delete set null not valid;
alter table public.organization_claims validate constraint organization_claims_resolta_per_fkey;

-- Índex redundant de 260926_1200: cap consulta el fa servir. El de 260908_0000
-- (idx_section_submissions_author_org) es queda perquè servix l'acció de la FK.
drop index if exists public.section_submissions_author_org_idx;

-- Mateix cos que 260916_2300 més D10: si l'entitat desapareix (la FK posa
-- author_org_id a null des d'un trigger, profunditat > 1), la publicació
-- conserva la signatura de l'entitat i no passa a nom de qui la va escriure.
create or replace function public.trg_force_submission_author() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_author_name text;
begin
  if TG_OP = 'UPDATE' then
    if new.tenant_id != old.tenant_id then
      raise exception 'SDP-SEC-001: tenant_id is immutable';
    end if;
    if new.section_id != old.section_id then
      raise exception 'SDP-SEC-002: section_id is immutable';
    end if;
    if old.author_org_id is not null and new.author_org_id is null and pg_trigger_depth() > 1 then
      new.payload = new.payload - 'id' - 'created_at' - 'author';
      return new;
    end if;
  end if;

  if new.author_org_id is not null then
    select name into v_author_name from public.organizations where id = new.author_org_id;
  else
    select full_name into v_author_name from public.profiles where id = new.owner_user_id;
  end if;

  if v_author_name is not null then
    new.payload = jsonb_set(new.payload, '{author_name}', to_jsonb(v_author_name));
  end if;

  -- PROTECCIÓ C1 (260916_2300): cap intent de suplantar les claus d'identitat.
  new.payload = new.payload - 'id' - 'created_at' - 'author';
  return new;
end;
$$;
-- Funció de trigger: el trigger no comprova EXECUTE, ningú la necessita cridar.
revoke execute on function public.trg_force_submission_author() from public, anon, authenticated;

-- Higiene: mateix cos que 260926_1200, amb search_path buit.
-- EXECUTE per a authenticated: el CHECK section_submissions_autoria_org_valida
-- l'avalua amb el rol de qui escriu.
create or replace function public.pot_signar_com_organitzacio(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_org_id is null
    or exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = p_org_id
        and m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin')
    );
$$;
revoke execute on function public.pot_signar_com_organitzacio(uuid) from public, anon;
grant execute on function public.pot_signar_com_organitzacio(uuid) to authenticated;

-- Higiene: mateix cos que 260926_1200, amb search_path fix.
create or replace function public.section_submissions_conserva_creacio()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.section_submissions_conserva_creacio() from public, anon, authenticated;


-- ── 4 · Consentiment demostrable (D3) ────────────────────────────────────────
-- Què es va mostrar: versió, data, URL, empremta SHA-256 del text i, si pot
-- ser, el text sencer (el CHECK lliga text i empremta). Una versió segellada
-- (amb empremta) és immutable i cap versió s'esborra.
create table if not exists public.politiques_privacitat (
  versio        text primary key
                constraint politiques_versio_format check (versio ~ '^[A-Za-z0-9._-]{1,40}$'),
  vigent_des_de timestamptz not null,
  url           text not null default '/legal'
                constraint politiques_url_llargaria check (char_length(url) <= 300),
  text_sha256   text
                constraint politiques_sha256_format check (text_sha256 is null or text_sha256 ~ '^[0-9a-f]{64}$'),
  text_complet  text
                constraint politiques_text_llargaria check (text_complet is null or char_length(text_complet) <= 200000),
  mecanisme     text not null default ''
                constraint politiques_mecanisme_llargaria check (char_length(mecanisme) <= 2000),
  resum_canvis  text not null default ''
                constraint politiques_resum_llargaria check (char_length(resum_canvis) <= 2000),
  creat_al      timestamptz not null default now(),
  constraint politiques_text_i_empremta check (
    text_complet is null
    or text_sha256 = encode(sha256(convert_to(text_complet, 'UTF8')), 'hex')
  )
);

alter table public.politiques_privacitat enable row level security;
revoke all on table public.politiques_privacitat from public, anon, authenticated;
grant select on table public.politiques_privacitat to anon, authenticated;

drop policy if exists "politiques publicades" on public.politiques_privacitat;
create policy "politiques publicades" on public.politiques_privacitat
for select to anon, authenticated
using (vigent_des_de <= now());

-- La v1 que 260915_0000 ja escrivia: sense empremta perquè el text no es va arxivar.
-- Per a publicar-ne una de nova (decisió D3a): una fila amb text_complet i
-- vigent_des_de; el CHECK valida l'empremta i estat_consentiment() demana
-- re-consentir a tothom.
insert into public.politiques_privacitat (versio, vigent_des_de, url, mecanisme, resum_canvis)
values (
  'v1',
  timestamptz '2026-09-15 00:00:00+00',
  '/legal',
  'Casella del formulari d''alta: accepta_rgpd a les metadades de GoTrue.',
  'Versió heretada de 260915_0000: el text exacte no es va arxivar i no té empremta.'
)
on conflict (versio) do nothing;

create or replace function private.politiques_immutables()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'SDP-RGPD-020: una versió de política no s''esborra mai.' using errcode = '42501';
  end if;
  if old.text_sha256 is not null and (
       new.versio is distinct from old.versio
    or new.vigent_des_de is distinct from old.vigent_des_de
    or new.text_sha256 is distinct from old.text_sha256
    or new.text_complet is distinct from old.text_complet) then
    raise exception 'SDP-RGPD-021: la versió % ja està segellada.', old.versio using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.politiques_immutables() from public, anon, authenticated;

drop trigger if exists trg_politiques_immutables on public.politiques_privacitat;
create trigger trg_politiques_immutables
before update or delete on public.politiques_privacitat
for each row execute function private.politiques_immutables();

-- Registre: acció (atorga o revoca), origen, empremta del text mostrat i
-- empremta del subjecte (correu amb pebre) per al bloqueig posterior.
alter table public.consentiments
  add column if not exists accio text not null default 'atorga'
    constraint consentiments_accio_valida check (accio in ('atorga', 'revoca'));
alter table public.consentiments
  add column if not exists origen text not null default 'migracio'
    constraint consentiments_origen_valid check (origen in ('alta', 'rpc', 'migracio'));
alter table public.consentiments alter column origen set default 'rpc';
alter table public.consentiments
  add column if not exists text_sha256 text
    constraint consentiments_sha256_format check (text_sha256 is null or text_sha256 ~ '^[0-9a-f]{64}$');
alter table public.consentiments
  add column if not exists subjecte_hash text;

create index if not exists idx_consentiments_usuari_tipus
  on public.consentiments (user_id, tipus, creat_al desc);

-- not valid: les files velles amb una versió desconeguda no es revaliden.
alter table public.consentiments drop constraint if exists consentiments_versio_politica_fkey;
alter table public.consentiments
  add constraint consentiments_versio_politica_fkey
  foreign key (versio_politica) references public.politiques_privacitat (versio) not valid;

-- Només lectura, i sense ip_hash, user_agent ni subjecte_hash. Escriu el servidor.
revoke all on table public.consentiments from public, anon, authenticated;
grant select (id, user_id, tipus, versio_politica, accio, origen, text_sha256, creat_al)
  on table public.consentiments to authenticated;

-- Bloqueig (LOPDGDD art. 32): l'evidència sobreviu pseudonimitzada a la
-- supressió del compte, fins a la prescripció (3 anys), i després es purga.
create table if not exists private.consentiments_bloquejats (
  id              uuid primary key,
  subjecte_hash   text,
  tipus           text not null,
  versio_politica text not null,
  accio           text not null,
  origen          text not null,
  text_sha256     text,
  creat_al        timestamptz not null,
  bloquejat_al    timestamptz not null default now()
);
revoke all on table private.consentiments_bloquejats from public, anon, authenticated;
create index if not exists idx_consentiments_bloquejats_al
  on private.consentiments_bloquejats (bloquejat_al);

create or replace function private.consentiments_immutables()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'SDP-RGPD-010: el registre de consentiments només admet afegir.' using errcode = '42501';
  end if;
  -- Esborrat directe: prohibit. En cascada des d'auth.users (profunditat > 1):
  -- la fila passa al bloqueig abans de desaparéixer.
  if pg_trigger_depth() <= 1 then
    raise exception 'SDP-RGPD-011: un consentiment no s''esborra; es revoca.' using errcode = '42501';
  end if;
  insert into private.consentiments_bloquejats
    (id, subjecte_hash, tipus, versio_politica, accio, origen, text_sha256, creat_al)
  values
    (old.id, old.subjecte_hash, old.tipus, old.versio_politica, old.accio, old.origen, old.text_sha256, old.creat_al)
  on conflict (id) do nothing;
  return old;
end;
$$;
revoke execute on function private.consentiments_immutables() from public, anon, authenticated;

drop trigger if exists trg_consentiments_immutables on public.consentiments;
create trigger trg_consentiments_immutables
before update or delete on public.consentiments
for each row execute function private.consentiments_immutables();

-- Capçaleres de la petició (PostgREST les posa a request.headers). Des de
-- GoTrue o pg_cron no n'hi ha i torna null.
create or replace function private.capcalera_client(p_que text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_h jsonb;
begin
  begin
    v_h := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    return null;
  end;
  if v_h is null then
    return null;
  end if;
  if p_que = 'ip' then
    return nullif(btrim(split_part(coalesce(v_h ->> 'cf-connecting-ip', v_h ->> 'x-real-ip', v_h ->> 'x-forwarded-for', ''), ',', 1)), '');
  elsif p_que = 'ua' then
    return nullif(left(btrim(coalesce(v_h ->> 'user-agent', '')), 300), '');
  end if;
  return null;
end;
$$;
revoke execute on function private.capcalera_client(text) from public, anon, authenticated;

-- Pseudonimització (RGPD arts. 4.5 i 32): empremta amb pebre secret, mai el valor.
create or replace function private.hash_subjecte(p_valor text)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_valor is null or btrim(p_valor) = '' then null
    else encode(sha256(convert_to(
      coalesce((select a.valor from private.ajustos a where a.clau = 'pebre_rgpd'), '')
      || '|' || lower(btrim(p_valor)), 'UTF8')), 'hex')
  end;
$$;
revoke execute on function private.hash_subjecte(text) from public, anon, authenticated;

create or replace function private.versio_vigent()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.versio
  from public.politiques_privacitat p
  where p.vigent_des_de <= now()
  order by p.vigent_des_de desc, p.creat_al desc
  limit 1;
$$;
revoke execute on function private.versio_vigent() from public, anon, authenticated;

-- L'única porta d'escriptura del registre. Copia l'empremta del text perquè
-- cada fila siga una prova autosuficient; hora del servidor, no del client.
create or replace function private.anota_consentiment(
  p_user   uuid,
  p_email  text,
  p_tipus  text,
  p_versio text,
  p_accio  text,
  p_origen text
)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_sha text;
  v_id  uuid;
begin
  select p.text_sha256 into v_sha
  from public.politiques_privacitat p
  where p.versio = p_versio;
  if not found then
    raise exception 'SDP-RGPD-002: la versió de política % no existix.', p_versio using errcode = '22023';
  end if;

  insert into public.consentiments
    (user_id, tipus, versio_politica, accio, origen, text_sha256, subjecte_hash, ip_hash, user_agent, creat_al)
  values
    (p_user, p_tipus, p_versio, p_accio, p_origen, v_sha,
     private.hash_subjecte('mail:' || p_email),
     private.hash_subjecte('ip:' || private.capcalera_client('ip')),
     private.capcalera_client('ua'),
     clock_timestamp())
  returning id into v_id;

  if p_tipus = 'rgpd_acepta' then
    update public.profiles
       set consentiment_rgpd_at = case when p_accio = 'atorga' then now() else null end
     where id = p_user;
  end if;
  return v_id;
end;
$$;
revoke execute on function private.anota_consentiment(uuid, text, text, text, text, text) from public, anon, authenticated;

-- Mateixa signatura que 260915_0000: auth.js (registraConsentiment) no canvia.
-- p_versio null o buit = la vigent. Només s'accepta la vigent. Idempotent.
create or replace function public.registra_consentiment(p_tipus text, p_versio text)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_vigent  text := private.versio_vigent();
  v_demanda text := coalesce(nullif(btrim(p_versio), ''), v_vigent);
  v_accio   text;
  v_versio  text;
begin
  if v_uid is null then
    raise exception 'SDP-RGPD-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_tipus is null or p_tipus not in ('rgpd_acepta', 'marketing_butlleti', 'analitica') then
    raise exception 'SDP-RGPD-001: tipus de consentiment desconegut.' using errcode = '22023';
  end if;
  if v_demanda is distinct from v_vigent then
    raise exception 'SDP-RGPD-003: només es pot acceptar la versió vigent (%).', v_vigent using errcode = '22023';
  end if;
  select c.accio, c.versio_politica into v_accio, v_versio
  from public.consentiments c
  where c.user_id = v_uid and c.tipus = p_tipus
  order by c.creat_al desc, c.id desc
  limit 1;
  if v_accio = 'atorga' and v_versio = v_demanda then
    return;
  end if;
  perform private.anota_consentiment(
    v_uid, (select u.email from auth.users u where u.id = v_uid), p_tipus, v_demanda, 'atorga', 'rpc');
end;
$$;
revoke execute on function public.registra_consentiment(text, text) from public, anon;
grant execute on function public.registra_consentiment(text, text) to authenticated;

-- RGPD art. 7.3: retirar ha de ser tan fàcil com donar. Una fila 'revoca', mai
-- un esborrat. Idempotent: si ja està retirat (o no s'havia donat), no fa res.
create or replace function public.revoca_consentiment(p_tipus text)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_accio  text;
  v_versio text;
begin
  if v_uid is null then
    raise exception 'SDP-RGPD-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_tipus is null or p_tipus not in ('rgpd_acepta', 'marketing_butlleti', 'analitica') then
    raise exception 'SDP-RGPD-001: tipus de consentiment desconegut.' using errcode = '22023';
  end if;
  select c.accio, c.versio_politica into v_accio, v_versio
  from public.consentiments c
  where c.user_id = v_uid and c.tipus = p_tipus
  order by c.creat_al desc, c.id desc
  limit 1;
  if v_accio is distinct from 'atorga' then
    return;
  end if;
  perform private.anota_consentiment(
    v_uid, (select u.email from auth.users u where u.id = v_uid), p_tipus, v_versio, 'revoca', 'rpc');
end;
$$;
revoke execute on function public.revoca_consentiment(text) from public, anon;
grant execute on function public.revoca_consentiment(text) to authenticated;

-- Estat per a la interfície: versió vigent, últim acte per tipus i si cal
-- tornar a consentir (no hi ha cap 'atorga' de rgpd_acepta per a la vigent).
create or replace function public.estat_consentiment()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with vigent as (
    select p.versio, p.url, p.text_sha256
    from public.politiques_privacitat p
    where p.vigent_des_de <= now()
    order by p.vigent_des_de desc, p.creat_al desc
    limit 1
  ),
  darrers as (
    select distinct on (c.tipus) c.tipus, c.accio, c.versio_politica, c.creat_al
    from public.consentiments c
    where c.user_id = (select auth.uid())
    order by c.tipus, c.creat_al desc, c.id desc
  )
  select jsonb_build_object(
    'versio_vigent', (select v.versio from vigent v),
    'url', (select v.url from vigent v),
    'text_sha256', (select v.text_sha256 from vigent v),
    'consentiments', coalesce((
      select jsonb_agg(jsonb_build_object('tipus', d.tipus, 'accio', d.accio,
                                          'versio', d.versio_politica, 'al', d.creat_al) order by d.tipus)
      from darrers d), '[]'::jsonb),
    'cal_reconsentir', not exists (
      select 1 from darrers d join vigent v on v.versio = d.versio_politica
      where d.tipus = 'rgpd_acepta' and d.accio = 'atorga')
  );
$$;
revoke execute on function public.estat_consentiment() from public, anon;
grant execute on function public.estat_consentiment() to authenticated;


-- ── 5 · Alta que no cau mai (D11) ────────────────────────────────────────────
-- 260915_0000 llançava SDP-REG-001 si l'alta no portava tenant_id: la primera
-- entrada amb Google (OAuth no porta metadades d'alta) queia sencera (I14).
-- Ara cap pas pot tombar l'alta: el que falla queda anotat ací i ho repara
-- completa_la_meua_alta() quan el client torna amb sessió.
create table if not exists private.incidencies_alta (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  codi     text not null,
  detall   text,
  creat_al timestamptz not null default now()
);
revoke all on table private.incidencies_alta from public, anon, authenticated;

create or replace function private.anota_incidencia_alta(p_user uuid, p_codi text, p_detall text)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  insert into private.incidencies_alta (user_id, codi, detall)
  values (p_user, p_codi, left(p_detall, 500))
  on conflict (user_id) do update
    set codi = excluded.codi, detall = excluded.detall, creat_al = now();
exception when others then
  -- Ni tan sols el registre de la incidència pot tombar l'alta.
  raise warning 'SDP-REG-999: incidència d''alta no anotada per a %: %', p_user, sqlerrm;
end;
$$;
revoke execute on function private.anota_incidencia_alta(uuid, text, text) from public, anon, authenticated;

create or replace function private.nom_d_alta(p_meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(btrim(left(btrim(p_meta ->> 'full_name'), 120)), ''),
    nullif(btrim(left(btrim(p_meta ->> 'name'), 120)), ''),
    'Veí/na');
$$;
revoke execute on function private.nom_d_alta(jsonb) from public, anon, authenticated;

create or replace function private.url_https_o_null(p_url text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_url ~ '^https://' and char_length(p_url) <= 2048 then p_url end;
$$;
revoke execute on function private.url_https_o_null(text) from public, anon, authenticated;

-- Ordre: poble demanat (si és obert) → poble per defecte (si és obert) → cap.
create or replace function private.resol_poble_alta(p_tenant text, p_amb_defecte boolean default true)
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v uuid;
begin
  begin
    v := nullif(btrim(coalesce(p_tenant, '')), '')::uuid;
  exception when invalid_text_representation then
    v := null;
  end;
  if v is not null and exists (select 1 from public.towns t where t.id = v and t.is_open) then
    return v;
  end if;
  if not p_amb_defecte then
    return null;
  end if;
  begin
    select a.valor::uuid into v from private.ajustos a where a.clau = 'poble_per_defecte';
  exception when invalid_text_representation then
    v := null;
  end;
  if v is not null and exists (select 1 from public.towns t where t.id = v and t.is_open) then
    return v;
  end if;
  return null;
end;
$$;
revoke execute on function private.resol_poble_alta(text, boolean) from public, anon, authenticated;

-- Tres blocs independents: si falla el consentiment, el perfil i el poble es queden.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_tenant uuid;
  v_versio text;
begin
  -- 1 · Perfil, sempre, amb nom i foto de reserva (Google porta name i picture).
  begin
    insert into public.profiles (id, full_name, avatar_url)
    values (new.id, private.nom_d_alta(v_meta),
            private.url_https_o_null(coalesce(v_meta ->> 'avatar_url', v_meta ->> 'picture')))
    on conflict (id) do nothing;
  exception when others then
    perform private.anota_incidencia_alta(new.id, 'SDP-REG-900', sqlstate || ': ' || sqlerrm);
  end;

  -- 2 · Poble.
  begin
    v_tenant := private.resol_poble_alta(v_meta ->> 'tenant_id', true);
    if v_tenant is null then
      perform private.anota_incidencia_alta(new.id, 'SDP-REG-001',
        'Alta sense cap poble obert; la repara completa_la_meua_alta().');
    else
      insert into public.town_memberships (town_id, user_id, role)
      values (v_tenant, new.id, 'member')
      on conflict (town_id, user_id) do nothing;
    end if;
  exception when others then
    perform private.anota_incidencia_alta(new.id, 'SDP-REG-901', sqlstate || ': ' || sqlerrm);
  end;

  -- 3 · Consentiment de la casella del formulari. OAuth no en porta: la
  --     interfície el demana després (estat_consentiment().cal_reconsentir).
  begin
    if lower(coalesce(v_meta ->> 'accepta_rgpd', '')) in ('true', 't', '1') then
      select p.versio into v_versio
      from public.politiques_privacitat p
      where p.versio = v_meta ->> 'versio_politica'
        and p.vigent_des_de <= now();
      v_versio := coalesce(v_versio, private.versio_vigent());
      if v_versio is not null then
        perform private.anota_consentiment(new.id, new.email, 'rgpd_acepta', v_versio, 'atorga', 'alta');
      end if;
    end if;
  exception when others then
    perform private.anota_incidencia_alta(new.id, 'SDP-REG-902', sqlstate || ': ' || sqlerrm);
  end;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Idempotent: el client la crida en tornar d'OAuth amb el tenantId de la
-- configuració. Amb p_tenant_id null prova el poble per defecte; amb un poble
-- que no és obert, no s'unix a cap (mateixa semàntica que l'alta, D11b).
create or replace function public.completa_la_meua_alta(p_tenant_id uuid default null)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_meta   jsonb;
  v_tenant uuid;
  v_nou    integer := 0;
begin
  if v_uid is null then
    raise exception 'SDP-REG-010: cal la sessió iniciada.' using errcode = '42501';
  end if;
  select coalesce(u.raw_user_meta_data, '{}'::jsonb) into v_meta from auth.users u where u.id = v_uid;

  insert into public.profiles (id, full_name, avatar_url)
  values (v_uid, private.nom_d_alta(coalesce(v_meta, '{}'::jsonb)),
          private.url_https_o_null(coalesce(v_meta ->> 'avatar_url', v_meta ->> 'picture')))
  on conflict (id) do nothing;

  v_tenant := private.resol_poble_alta(p_tenant_id::text, p_tenant_id is null);
  if v_tenant is not null then
    insert into public.town_memberships (town_id, user_id, role)
    values (v_tenant, v_uid, 'member')
    on conflict (town_id, user_id) do nothing;
    get diagnostics v_nou = row_count;
    delete from private.incidencies_alta where user_id = v_uid;
  end if;

  -- poble_nou: la pertinença ha nascut ara i el client ha de tornar a llegir
  -- les seccions (les que ja havia carregat eren d'algú sense poble).
  return jsonb_build_object(
    'poble', v_tenant,
    'poble_nou', v_nou > 0,
    'baixa_demanada_at', (select p.baixa_demanada_at from public.profiles p where p.id = v_uid));
end;
$$;
revoke execute on function public.completa_la_meua_alta(uuid) from public, anon;
grant execute on function public.completa_la_meua_alta(uuid) to authenticated;


-- ── 6 · Exportació, baixa, quarantena i purga (D12) ─────────────────────────
-- Una baixa és una quarantena: el perfil s'anonimitza al moment, la persona
-- pot tornar a entrar i cancel·lar-la, i passats els dies de quarantena la
-- purga esborra el compte. La instantània (perfil i claus retirades de les
-- publicacions) és el que permet desfer-ho; desapareix amb el compte.
create table if not exists private.baixes (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  demanada_al       timestamptz not null default now(),
  purga_prevista_al timestamptz not null,
  instantania       jsonb not null default '{}'::jsonb,
  motiu             text,
  intents           integer not null default 0,
  ultim_error       text,
  ultim_intent_al   timestamptz
);
revoke all on table private.baixes from public, anon, authenticated;
create index if not exists idx_baixes_purga on private.baixes (purga_prevista_al);

-- Storage no s'esborra des de SQL: esta cua la buida una funció amb
-- service_role i l'API de Storage (peça pendent). referenciat = encara el fa
-- servir una entitat o una publicació: no s'ha d'esborrar.
create table if not exists private.purga_storage_pendent (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  bucket_id   text not null,
  nom         text not null,
  referenciat boolean not null default false,
  creat_al    timestamptz not null default now(),
  feta_al     timestamptz,
  unique (bucket_id, nom)
);
revoke all on table private.purga_storage_pendent from public, anon, authenticated;

-- Claus del payload d'una publicació que porten dades de l'autora. Contrastat
-- amb mapejadorSeccions.js i content.js (ownerUserId, author, author_avatar,
-- avatar_url, seller) i amb la llavor (author_id, authorAvatar). Les imatges
-- només quan són l'avatar (el mapejador hi cau si no n'hi ha cap altra) i
-- source (multimèdia) només quan és el nom de l'autora. searchText sempre:
-- Connectar hi escriu el nom de l'autora, i sense la clau el mapejador el
-- torna a compondre amb el títol i el nom que ja és anònim.
create or replace function private.claus_personals_payload(p_payload jsonb, p_nom text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(p_payload) = 'object' then
    array(
      select e.key
      from jsonb_each(p_payload) e
      where e.key in ('ownerUserId', 'owner_user_id', 'author_id', 'author',
                      'author_avatar', 'authorAvatar', 'avatar_url', 'seller', 'searchText')
         or (e.key in ('imageSrc', 'image_url', 'image', 'src')
             and jsonb_typeof(e.value) = 'string'
             and (e.value #>> '{}') in (p_payload ->> 'avatar_url',
                                        p_payload ->> 'author_avatar',
                                        p_payload ->> 'authorAvatar'))
         or (e.key = 'source'
             and jsonb_typeof(e.value) = 'string'
             and nullif(btrim(p_nom), '') is not null
             and btrim(e.value #>> '{}') = btrim(p_nom))
      order by e.key
    )
  else array[]::text[] end;
$$;
revoke execute on function private.claus_personals_payload(jsonb, text) from public, anon, authenticated;

create or replace function public.exporta_les_meues_dades()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_fitxers   jsonb := '[]'::jsonb;
  v_federacio jsonb := '{}'::jsonb;
  v_taula     text;
  v_condicio  text;
  v_files     jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-EXPORT-000: cal la sessió iniciada.' using errcode = '42501';
  end if;

  -- Fitxers propis: <poble>/<uid>/<carpeta>/fitxer o el format antic <uid>/fitxer.
  begin
    select coalesce(jsonb_agg(jsonb_build_object('bucket', o.bucket_id, 'nom', o.name, 'creat_al', o.created_at)
                              order by o.created_at), '[]'::jsonb)
      into v_fitxers
    from storage.objects o
    where o.bucket_id in ('mitjans', 'mitjans_privats')
      and ((storage.foldername(o.name))[2] = v_uid::text
        or (cardinality(storage.foldername(o.name)) = 1 and (storage.foldername(o.name))[1] = v_uid::text));
  exception when insufficient_privilege or undefined_table or undefined_function then
    v_fitxers := null;
  end;

  -- Federació no versionada (directiva del Mestre): al Supabase viu hi ha
  -- taules que no són al repositori (realms, user_realms, connections i potser
  -- posts). No se'n suposa cap columna. Per a cada taula que existisca,
  -- s'exporten les files on alguna columna uuid (llevat d'id i tenant_id) és la
  -- de la persona. Si la taula no existix, o no té cap columna uuid candidata,
  -- no hi apareix. Els noms passen per format('%I'): cap concatenació crua.
  foreach v_taula in array array['realms', 'user_realms', 'connections', 'posts'] loop
    if to_regclass(format('public.%I', v_taula)) is null then
      continue;
    end if;
    select string_agg(format('t.%I = $1', c.column_name), ' or ' order by c.ordinal_position)
      into v_condicio
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = v_taula
      and c.data_type = 'uuid'
      and c.column_name not in ('id', 'tenant_id');
    if v_condicio is null then
      continue;
    end if;
    begin
      execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where %s',
                     v_taula, v_condicio)
        into v_files
        using v_uid;
      v_federacio := v_federacio || jsonb_build_object(v_taula, v_files);
    exception when others then
      v_federacio := v_federacio || jsonb_build_object(v_taula, jsonb_build_object('error', sqlstate));
    end;
  end loop;

  return jsonb_build_object(
    'format', 'socdepoble.exportacio.v1',
    'generat_al', now(),
    'compte', (
      select jsonb_build_object('id', u.id, 'email', u.email, 'creat_al', u.created_at,
                                'ultima_entrada_al', u.last_sign_in_at, 'metadades', u.raw_user_meta_data)
      from auth.users u where u.id = v_uid),
    'perfil', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'baixa', (
      select jsonb_build_object('demanada_al', b.demanada_al, 'purga_prevista_al', b.purga_prevista_al,
                                'motiu', b.motiu, 'dades_en_quarantena', b.instantania)
      from private.baixes b where b.user_id = v_uid),
    'pobles', coalesce((
      select jsonb_agg(jsonb_build_object('poble_id', t.id, 'slug', t.slug, 'nom', t.name,
                                          'rol', m.role, 'des_de', m.created_at) order by m.created_at)
      from public.town_memberships m join public.towns t on t.id = m.town_id
      where m.user_id = v_uid), '[]'::jsonb),
    'organitzacions', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'slug', o.slug, 'nom', o.name, 'tipus', o.kind,
                                          'rol', m.role, 'des_de', m.created_at,
                                          'creada_per_mi', o.created_by = v_uid) order by m.created_at)
      from public.organization_memberships m join public.organizations o on o.id = m.organization_id
      where m.user_id = v_uid), '[]'::jsonb),
    'reclamacions', coalesce((
      select jsonb_agg(jsonb_build_object('organitzacio', c.organization_id, 'estat', c.estat,
                                          'justificacio', c.justificacio, 'al', c.created_at,
                                          'resolta_al', c.resolta_at) order by c.created_at)
      from public.organization_claims c where c.user_id = v_uid), '[]'::jsonb),
    'rols_plataforma', coalesce((
      select jsonb_agg(jsonb_build_object('rol', r.role, 'des_de', r.granted_at))
      from public.user_platform_roles r where r.user_id = v_uid), '[]'::jsonb),
    'publicacions', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at)
      from public.section_submissions s where s.owner_user_id = v_uid), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(to_jsonb(n) order by n.created_at)
      from public.notes n where n.owner_user_id = v_uid), '[]'::jsonb),
    'consentiments', coalesce((
      select jsonb_agg(jsonb_build_object('tipus', c.tipus, 'accio', c.accio, 'versio_politica', c.versio_politica,
                                          'text_sha256', c.text_sha256, 'origen', c.origen, 'al', c.creat_al)
                       order by c.creat_al)
      from public.consentiments c where c.user_id = v_uid), '[]'::jsonb),
    'xat', jsonb_build_object(
      'converses', coalesce((
        select jsonb_agg(jsonb_build_object('fil_id', f.id, 'titol', f.titol, 'creat_al', f.creat_al,
                                            'creada_per_mi', f.creat_per = v_uid) order by f.creat_al)
        from public.xat_participants p join public.xat_fils f on f.id = p.fil_id
        where p.usuari_id = v_uid), '[]'::jsonb),
      'missatges_propis', coalesce((
        select jsonb_agg(jsonb_build_object('fil_id', m.fil_id, 'text', m.text, 'creat_al', m.creat_al)
                         order by m.creat_al)
        from public.xat_missatges m where m.usuari_id = v_uid), '[]'::jsonb),
      'lectures', coalesce((
        select jsonb_agg(jsonb_build_object('fil_id', l.fil_id, 'ultim_llegit_al', l.ultim_llegit_al))
        from public.xat_lectures l where l.usuari_id = v_uid), '[]'::jsonb)),
    'fitxers', v_fitxers,
    'federacio_no_versionada', v_federacio
  );
end;
$$;
revoke execute on function public.exporta_les_meues_dades() from public, anon;
grant execute on function public.exporta_les_meues_dades() to authenticated;

create or replace function public.estat_baixa()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b   private.baixes;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  select * into v_b from private.baixes b where b.user_id = v_uid;
  return jsonb_build_object(
    'demanada', v_b.user_id is not null,
    'demanada_al', v_b.demanada_al,
    'purga_prevista_al', v_b.purga_prevista_al);
end;
$$;
revoke execute on function public.estat_baixa() from public, anon;
grant execute on function public.estat_baixa() to authenticated;

create or replace function public.demana_baixa(p_motiu text default null)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_perfil  public.profiles;
  v_baixa   private.baixes;
  v_dies    integer;
  v_retirat jsonb;
  v_meta    jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;

  select * into v_baixa from private.baixes b where b.user_id = v_uid;
  if found then
    return jsonb_build_object('demanada_al', v_baixa.demanada_al,
                              'purga_prevista_al', v_baixa.purga_prevista_al, 'ja_demanada', true);
  end if;

  select * into v_perfil from public.profiles p where p.id = v_uid for update;

  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
    from private.ajustos a where a.clau = 'dies_quarantena_baixa';
  exception when invalid_text_representation then
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 30);

  -- Les claus personals de cada publicació pròpia (signada com a persona) es
  -- guarden a la instantània abans de retirar-les: cancela_baixa les torna.
  select coalesce(jsonb_object_agg(s.id::text, (
           select jsonb_object_agg(e.key, e.value)
           from jsonb_each(s.payload) e
           where e.key = any (private.claus_personals_payload(s.payload, v_perfil.full_name)))), '{}'::jsonb)
    into v_retirat
  from public.section_submissions s
  where s.owner_user_id = v_uid
    and s.author_org_id is null
    and cardinality(private.claus_personals_payload(s.payload, v_perfil.full_name)) > 0;

  -- GoTrue en guarda una còpia a user_metadata (updateProfile hi escriu el nom,
  -- la foto i la bio; Google, name i picture): sense retirar-la, el nom
  -- sobreviuria a l'anonimització. També va a la instantània.
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
    into v_meta
  from auth.users u
  cross join lateral jsonb_each(case when jsonb_typeof(u.raw_user_meta_data) = 'object'
                                     then u.raw_user_meta_data else '{}'::jsonb end) e
  where u.id = v_uid
    and e.key = any (array['full_name', 'name', 'avatar_url', 'picture', 'bio']);

  insert into private.baixes (user_id, demanada_al, purga_prevista_al, instantania, motiu)
  values (
    v_uid, now(), now() + make_interval(days => v_dies),
    jsonb_build_object(
      'perfil', jsonb_build_object('full_name', v_perfil.full_name, 'avatar_url', v_perfil.avatar_url,
                                   'bio', v_perfil.bio, 'lema', v_perfil.lema,
                                   'presentacio_html', v_perfil.presentacio_html,
                                   'hero_url', v_perfil.hero_url, 'is_public', v_perfil.is_public),
      'publicacions', v_retirat,
      'metadades', v_meta),
    nullif(left(btrim(coalesce(p_motiu, '')), 500), ''))
  returning * into v_baixa;

  -- Anonimització immediata. membres_del_poble ja no la mostra (baixa_demanada_at).
  update public.profiles
     set full_name = 'Veïna que se n''ha anat',
         avatar_url = null, bio = '', lema = '', presentacio_html = '', hero_url = null,
         is_public = false, baixa_demanada_at = v_baixa.demanada_al
   where id = v_uid;

  -- La còpia de GoTrue, fora. Millor esforç: si el rol propietari no pot
  -- escriure a auth.users, la baixa continua i ho diu el registre.
  begin
    update auth.users u
       set raw_user_meta_data = u.raw_user_meta_data - array['full_name', 'name', 'avatar_url', 'picture', 'bio']
     where u.id = v_uid
       and jsonb_typeof(u.raw_user_meta_data) = 'object';
  exception when insufficient_privilege then
    raise notice 'SDP-BAIXA-021: sense permís per a netejar les metadades de GoTrue de %.', v_uid;
  end;

  -- Publicacions personals: fora les claus personals. El trigger d'autor
  -- reescriu author_name amb el nom anònim. Les signades per una entitat són
  -- de l'entitat i no es toquen.
  update public.section_submissions s
     set payload = s.payload - private.claus_personals_payload(s.payload, v_perfil.full_name)
   where s.owner_user_id = v_uid
     and s.author_org_id is null;

  -- Tancament de sessions (millor esforç; el client fa a més logout global).
  begin
    delete from auth.sessions where user_id = v_uid;
  exception when insufficient_privilege or undefined_table then
    null;
  end;

  return jsonb_build_object('demanada_al', v_baixa.demanada_al,
                            'purga_prevista_al', v_baixa.purga_prevista_al, 'ja_demanada', false);
end;
$$;
revoke execute on function public.demana_baixa(text) from public, anon;
grant execute on function public.demana_baixa(text) to authenticated;

-- Idempotent: sense cap baixa pendent, l'estat desitjat ja es complix.
create or replace function public.cancela_baixa()
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b   private.baixes;
  v_p   jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  select * into v_b from private.baixes b where b.user_id = v_uid for update;
  if not found then
    return jsonb_build_object('cancelada', true);
  end if;
  v_p := coalesce(v_b.instantania -> 'perfil', '{}'::jsonb);

  update public.profiles p
     set full_name = coalesce(nullif(btrim(v_p ->> 'full_name'), ''), p.full_name),
         avatar_url = v_p ->> 'avatar_url',
         bio = coalesce(v_p ->> 'bio', ''),
         lema = coalesce(v_p ->> 'lema', ''),
         presentacio_html = coalesce(v_p ->> 'presentacio_html', ''),
         hero_url = v_p ->> 'hero_url',
         is_public = coalesce((v_p ->> 'is_public')::boolean, false),
         baixa_demanada_at = null
   where p.id = v_uid;

  -- Torna a GoTrue el nom, la foto i la bio que la baixa li va retirar.
  if jsonb_typeof(v_b.instantania -> 'metadades') = 'object' and v_b.instantania -> 'metadades' <> '{}'::jsonb then
    begin
      update auth.users u
         set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || (v_b.instantania -> 'metadades')
       where u.id = v_uid;
    exception when insufficient_privilege then
      raise notice 'SDP-BAIXA-022: sense permís per a restaurar les metadades de GoTrue de %.', v_uid;
    end;
  end if;

  -- Torna les claus retirades i el trigger d'autor torna a signar amb el nom.
  update public.section_submissions s
     set payload = s.payload || coalesce(v_b.instantania -> 'publicacions' -> (s.id::text), '{}'::jsonb)
   where s.owner_user_id = v_uid
     and s.author_org_id is null;

  delete from private.baixes where user_id = v_uid;
  return jsonb_build_object('cancelada', true);
end;
$$;
revoke execute on function public.cancela_baixa() from public, anon;
grant execute on function public.cancela_baixa() to authenticated;

-- Còpia de 260914_0100 amb dos canvis: fora qui està de baixa, i (select auth.uid()).
create or replace function public.membres_del_poble(
  p_tenant_id uuid,
  p_cerca     text default null,
  p_limit     integer default 100
)
returns table (
  usuari_id uuid,
  nom       text,
  fil_id    uuid
)
language sql stable security definer set search_path = ''
as $$
  select
    pr.id as usuari_id,
    coalesce(pr.full_name, 'Veí')::text as nom,
    (
      select f.id
      from public.xat_fils f
      where f.tenant_id = p_tenant_id
        and (select count(*) from public.xat_participants xp where xp.fil_id = f.id) = 2
        and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = (select auth.uid()))
        and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = pr.id)
      order by f.creat_al asc
      limit 1
    ) as fil_id
  from public.town_memberships tm
  join public.profiles pr on pr.id = tm.user_id
  where tm.town_id = p_tenant_id
    and pr.consentiment_rgpd_at is not null
    and pr.baixa_demanada_at is null
    and tm.user_id <> (select auth.uid())
    and (select private.is_town_member(p_tenant_id))
    and (
        p_cerca is null
        or btrim(p_cerca) = ''
        or pr.full_name ilike '%' || btrim(p_cerca) || '%'
    )
  order by pr.full_name asc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;
revoke execute on function public.membres_del_poble(uuid, text, integer) from public, anon;
grant execute on function public.membres_del_poble(uuid, text, integer) to authenticated;

-- Esborrat definitiu d'una persona. La crida purga_baixes_vencudes, mai el client.
-- Torna false si la baixa ja no hi és o encara no ha vençut: el cursor de la
-- purga porta una instantània d'abans, i una cancel·lació confirmada pel camí
-- no pot acabar esborrant el compte. El bloqueig de la fila l'ordena amb
-- cancela_baixa, que la bloqueja igual.
drop function if exists private.purga_una_baixa(uuid);
create or replace function private.purga_una_baixa(p_uid uuid)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  r     record;
  v_nou uuid;
begin
  perform 1
  from private.baixes b
  where b.user_id = p_uid
    and b.purga_prevista_al <= now()
  for update;
  if not found then
    return false;
  end if;

  -- T2 · Grups on és propietària: un grup ha de tindre exactament una
  -- propietària (comprova_una_propietaria). Passa a qui l'administra o, si no,
  -- al membre més antic que no estiga de baixa. Si no queda ningú, el grup
  -- desapareix (les seues publicacions conserven la signatura, D10).
  for r in
    select m.organization_id
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = p_uid and m.role = 'owner' and o.kind = 'group'
  loop
    v_nou := null;
    select m2.user_id into v_nou
    from public.organization_memberships m2
    where m2.organization_id = r.organization_id
      and m2.user_id <> p_uid
      and not exists (select 1 from private.baixes b where b.user_id = m2.user_id)
    order by (m2.role = 'admin') desc, m2.created_at asc
    limit 1;

    if v_nou is null then
      delete from public.organizations where id = r.organization_id;
    else
      update public.organization_memberships
         set role = 'owner'
       where organization_id = r.organization_id and user_id = v_nou;
      delete from public.organization_memberships
       where organization_id = r.organization_id and user_id = p_uid;
    end if;
  end loop;

  -- D12: les notes (privades) s'esborren. Les publicacions personals es
  -- conserven anònimes (també les de la secció notes: no s'esborra res que
  -- s'haja publicat). Les signades per una entitat són de l'entitat.
  delete from public.notes where owner_user_id = p_uid;
  update public.section_submissions s
     set owner_user_id = '00000000-0000-0000-0000-000000000000'::uuid,
         payload = s.payload - private.claus_personals_payload(s.payload, null)
   where s.owner_user_id = p_uid
     and s.author_org_id is null;

  -- Fitxers: a la cua. Els que encara usa una entitat o una publicació es
  -- marquen com a referenciats i es conserven. Es compara amb el bucket
  -- inclòs (casa amb sdp-media://<bucket>/<nom> i amb /object/public/<bucket>/<nom>):
  -- la còpia pública d'un adjunt té el mateix nom que l'original privat, i
  -- només la pública és la referenciada. Les imatges del cos de la fitxa
  -- d'una entitat (presentacio_html) també són seues.
  begin
    insert into private.purga_storage_pendent (user_id, bucket_id, nom, referenciat)
    select p_uid, o.bucket_id, o.name,
           exists (select 1 from public.organizations org
                    where right(coalesce(org.logo_url, ''), char_length(o.bucket_id || '/' || o.name)) = o.bucket_id || '/' || o.name
                       or right(coalesce(org.hero_url, ''), char_length(o.bucket_id || '/' || o.name)) = o.bucket_id || '/' || o.name
                       or strpos(coalesce(org.presentacio_html, ''), o.bucket_id || '/' || o.name) > 0)
        or exists (select 1 from public.section_submissions s
                    where strpos(s.payload::text, o.bucket_id || '/' || o.name) > 0)
    from storage.objects o
    where o.bucket_id in ('mitjans', 'mitjans_privats')
      and ((storage.foldername(o.name))[2] = p_uid::text
        or (cardinality(storage.foldername(o.name)) = 1 and (storage.foldername(o.name))[1] = p_uid::text))
    on conflict (bucket_id, nom) do nothing;
  exception when insufficient_privilege or undefined_table or undefined_function then
    raise notice 'SDP-BAIXA-020: sense accés a storage.objects per a %.', p_uid;
  end;

  -- Cascada: perfil, pertinences, rols, reclamacions, missatges i lectures del
  -- xat, incidències, la pròpia baixa i els consentiments (que passen a bloqueig).
  delete from auth.users where id = p_uid;

  -- Fils que ja no són de ningú.
  delete from public.xat_fils f
   where f.creat_per is null
     and not exists (select 1 from public.xat_participants p where p.fil_id = f.id);
  return true;
end;
$$;
revoke execute on function private.purga_una_baixa(uuid) from public, anon, authenticated;

create or replace function private.purga_baixes_vencudes(p_limit integer default 100)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  r       record;
  v_fetes integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtext('sdp-purga-baixes')) then
    return 0;
  end if;

  for r in
    select b.user_id
    from private.baixes b
    where b.purga_prevista_al <= now()
    order by b.purga_prevista_al asc
    limit greatest(1, least(coalesce(p_limit, 100), 1000))
  loop
    begin
      -- Només compta el que s'ha purgat de veres (una cancel·lació pel camí, no).
      if not private.purga_una_baixa(r.user_id) then
        continue;
      end if;
      -- El trigger diferit d'una propietària salta ací, dins del bloc, i no al
      -- COMMIT: una persona que falla no tomba la purga de la resta.
      set constraints all immediate;
      set constraints all deferred;
      v_fetes := v_fetes + 1;
    exception when others then
      update private.baixes
         set intents = intents + 1,
             ultim_error = left(sqlstate || ': ' || sqlerrm, 500),
             ultim_intent_al = now()
       where user_id = r.user_id;
    end;
  end loop;

  -- Bloqueig: fins a 3 anys (prescripció, LOPDGDD arts. 72-74).
  delete from private.consentiments_bloquejats where bloquejat_al < now() - interval '3 years';
  return v_fetes;
end;
$$;
revoke execute on function private.purga_baixes_vencudes(integer) from public, anon, authenticated;

-- Programació només si pg_cron ja està actiu (s'activa des del panell). Si no
-- ho està, cal programar private.purga_baixes_vencudes() a mà: vegeu el README.
do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule('sdp-purga-baixes', '17 3 * * *', $cron$select private.purga_baixes_vencudes(100)$cron$);
  else
    raise notice 'SDP-BAIXA-900: pg_cron no està actiu; la purga queda sense programar.';
  end if;
end
$$;

notify pgrst, 'reload schema';
commit;
