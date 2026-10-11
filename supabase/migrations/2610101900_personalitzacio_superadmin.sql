-- ============================================================================
-- 261010_1900 · Onada 11 (tasca 2) · La personalització del poble que desa el
-- superadmin: taxonomia (etiquetes i categories) i estil (tokens).
-- Ordre del Mestre (261010, prompt 261010_1730_prompt_claude_onada11.md,
-- tasca 2; brainstorming 261009_2005 §2-§4, F2). Front D2.
--
-- QUÈ FA:
--   1. app_content · Les tres polítiques de LECTURA de 2609200300 es tornen
--      a crear amb dues claus més a la llista explícita: 'taxonomia' i
--      'estil'. Són contingut editorial del poble, com 'pages': les llig
--      tothom (anon i authenticated) i les escriu només la RPC d'ací.
--      NO s'afig 'agents' (vegeu la nota de davall de les polítiques): és
--      una decisió del Mestre.
--   2. public.app_content_historial · Cada versió desada de cada clau
--      (tenant_id, key, payload, version, autor, creat). RLS activa, revoke
--      all, i només SELECT per a la superadmin amb aal2
--      (private.es_superadmin, migració 2610061448). Cap política
--      d'escriptura: hi escriu només la RPC (SECURITY DEFINER).
--   3. Dues RPC SECURITY DEFINER amb search_path buit, darrere de
--      private.es_superadmin() (que exigix el rol i el claim aal = 'aal2'):
--      · admin_desa_contingut(p_tenant_id, p_clau, p_payload, p_versio) →
--        jsonb { key, payload, version }. Desa una versió nova de la clau
--        amb control de versió optimista: p_versio és la que s'editava
--        (null o 0 si no n'hi havia) i, si la vigent ja no és eixa, rebutja
--        (SDP-ADMIN-006). Escriu app_content (insert … on conflict
--        (tenant_id, key), la clau primària real de 2609080000) i una fila
--        de l'historial.
--      · admin_historial_contingut(p_tenant_id, p_clau) → setof
--        app_content_historial, de la versió més nova a la més vella, com a
--        màxim 50.
--   L'adaptador del client (src/data/supabase/personalitzacio.js) crida les
--   dues amb estos mateixos noms i paràmetres, i tradueix els codis pel
--   prefix del missatge: «SDP-ADMIN» amb 42501 → 'cal-segon-factor';
--   «SDP-ADMIN-006» → 'conflicte-versio'.
--
-- CODIS (missatges en valencià; l'adaptador els llig pel prefix):
--   SDP-ADMIN-003 cal el rol de superadmin amb el segon factor (aal2) (42501)
--   SDP-ADMIN-004 la clau no és 'taxonomia' ni 'estil', o falta el poble (22023)
--   SDP-ADMIN-005 el contingut no és un objecte JSON o passa de 64 KB (22023)
--   SDP-ADMIN-006 la versió que s'editava ja no és la vigent (PT409: PostgREST
--                 respon 409 Conflict amb este codi PTnnn)
--   Els codis 001 i 002 són d'admin_list_users i admin_list_organizations
--   (2609121600); no es repetixen.
--
-- Columnes que usa, comprovades al disc: app_content (tenant_id, key,
-- payload, version, updated_at; primary key (tenant_id, key)) de 2609080000,
-- towns(id) de 2609080000 i private.es_superadmin() de 2610061448.
--
-- Additiva i idempotent: es pot tornar a executar. Revisada i NO aplicada a
-- cap base de dades: l'aplica el Mestre, després de 2610090100 i de
-- 2610061448 (sense es_superadmin amb aal2 no té sentit).
-- Va ABANS de publicar el client: sense ella, rpc() torna 404 i la faceta
-- «Etiquetes i categories» del Tauler diu que el servidor encara no té les
-- funcions (NO-DISPONIBLE), i les claus 'taxonomia' i 'estil' d'app_content
-- no les llig ningú (RLS les filtra en silenci).
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Lectura d'app_content: 'taxonomia' i 'estil' entren a la llista ─────
-- La llista continua sent explícita (2609200300): un key nou requerix decidir
-- la seua visibilitat ací. 'agents' NO s'hi afig: loadCoreContent el demana
-- (src/data/supabase/content.js) però la seua lectura pública encara no té
-- ordre del Mestre; mentre no la tinga, RLS el filtra i el client rep la
-- llista buida, com fins ara.
drop policy if exists "app_content lectura publica" on public.app_content;
create policy "app_content lectura publica" on public.app_content for select to anon, authenticated
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding', 'taxonomia', 'estil'));
drop policy if exists "sdp app_content anon frontera" on public.app_content;
create policy "sdp app_content anon frontera" on public.app_content as restrictive for select to anon
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding', 'taxonomia', 'estil'));
drop policy if exists "sdp app_content auth frontera" on public.app_content;
create policy "sdp app_content auth frontera" on public.app_content as restrictive for select to authenticated
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding', 'taxonomia', 'estil')
  or (select private.es_superadmin()));

-- ── 2 · L'historial de versions ─────────────────────────────────────────────
create table if not exists public.app_content_historial (
  id        bigserial primary key,
  tenant_id uuid not null references public.towns (id) on delete cascade,
  key       text not null check (key in ('taxonomia', 'estil')),
  payload   jsonb not null,
  version   integer not null,
  autor     uuid references auth.users (id) on delete set null,
  creat     timestamptz not null default now()
);

create index if not exists idx_app_content_historial_clau
  on public.app_content_historial (tenant_id, key, version desc);

alter table public.app_content_historial enable row level security;
revoke all on table public.app_content_historial from public, anon, authenticated;
grant select on table public.app_content_historial to authenticated;

drop policy if exists "superadmin llig l'historial de personalitzacio" on public.app_content_historial;
create policy "superadmin llig l'historial de personalitzacio" on public.app_content_historial
for select to authenticated
using ((select private.es_superadmin()));

-- ── 3 · Desar una versió nova (control de versió optimista) ──────────────────
-- Torna jsonb { key, payload, version } amb la versió NOVA. El poble ha
-- d'existir (la clau forana d'app_content ho garantix). Abans de comparar la
-- versió es pren un pany consultiu de transacció per (poble, clau), com fan
-- les RPC del xat (2609282100): `for update` no bloqueja una fila que encara
-- no existix, i sense el pany dues superadmins que desaren alhora la PRIMERA
-- versió passarien totes dues (la segona trepitjaria la primera sense
-- SDP-ADMIN-006 i l'historial tindria dues files «1»). Amb el pany, la segona
-- espera, llig la versió 1 i rep el conflicte.
create or replace function public.admin_desa_contingut(
  p_tenant_id uuid,
  p_clau text,
  p_payload jsonb,
  p_versio integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo     uuid := (select auth.uid());
  v_vigent integer;
  v_nova   integer;
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'SDP-ADMIN-003: cal el rol de superadmin amb el segon factor confirmat (aal2).' using errcode = '42501';
  end if;
  if p_tenant_id is null or p_clau is null or p_clau not in ('taxonomia', 'estil') then
    raise exception 'SDP-ADMIN-004: la clau de personalització no és vàlida (només taxonomia o estil).' using errcode = '22023';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 65536 then
    raise exception 'SDP-ADMIN-005: el contingut ha de ser un objecte JSON de fins a 64 KB.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('personalitzacio:' || p_tenant_id::text || ':' || p_clau, 0));
  select c.version into v_vigent
    from public.app_content c
   where c.tenant_id = p_tenant_id and c.key = p_clau
     for update;
  v_vigent := coalesce(v_vigent, 0);
  if v_vigent <> coalesce(p_versio, 0) then
    raise exception 'SDP-ADMIN-006: algú ha desat una versió més nova (la vigent és la %). Recarrega i torna a aplicar el canvi.', v_vigent using errcode = 'PT409';
  end if;
  v_nova := v_vigent + 1;

  insert into public.app_content (tenant_id, key, payload, version, updated_at)
  values (p_tenant_id, p_clau, p_payload, v_nova, now())
  on conflict (tenant_id, key) do update
    set payload = excluded.payload, version = excluded.version, updated_at = now();

  insert into public.app_content_historial (tenant_id, key, payload, version, autor)
  values (p_tenant_id, p_clau, p_payload, v_nova, v_jo);

  return jsonb_build_object('key', p_clau, 'payload', p_payload, 'version', v_nova);
end;
$$;
revoke execute on function public.admin_desa_contingut(uuid, text, jsonb, integer) from public, anon;
grant execute on function public.admin_desa_contingut(uuid, text, jsonb, integer) to authenticated;

-- ── 4 · L'historial d'una clau, de més nova a més vella ─────────────────────
create or replace function public.admin_historial_contingut(
  p_tenant_id uuid,
  p_clau text
)
returns setof public.app_content_historial
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'SDP-ADMIN-003: cal el rol de superadmin amb el segon factor confirmat (aal2).' using errcode = '42501';
  end if;
  if p_tenant_id is null or p_clau is null or p_clau not in ('taxonomia', 'estil') then
    raise exception 'SDP-ADMIN-004: la clau de personalització no és vàlida (només taxonomia o estil).' using errcode = '22023';
  end if;
  return query
    select h.*
      from public.app_content_historial h
     where h.tenant_id = p_tenant_id and h.key = p_clau
     order by h.version desc
     limit 50;
end;
$$;
revoke execute on function public.admin_historial_contingut(uuid, text) from public, anon;
grant execute on function public.admin_historial_contingut(uuid, text) to authenticated;

notify pgrst, 'reload schema';
commit;
