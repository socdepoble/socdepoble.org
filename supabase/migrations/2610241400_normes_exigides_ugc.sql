-- ============================================================================
-- 261024_1400 · T2 (P0-18) · Les normes de convivència, exigides al servidor
-- abans d'admetre publicacions i missatges dels veïns (no tot l'UGC: vegeu
-- QUÈ NO FA).
-- Auditoria Codex 261024_1315, C-02 (CWE-602, condició imposada només al
-- client): xat_envia i la política d'inserció de section_submissions no
-- miraven private.normes_acceptades, i un compte vàlid podia publicar sense
-- haver acceptat les normes cridant l'API directament. Google Play UGC
-- exigix acceptar-les abans de crear o pujar contingut; App Store Review
-- Guideline 1.2. MANDAT SUPABASE 30-OCT-2026 (core-seguretat-audit, Llei E):
-- cap taula nova; les funcions noves revoquen l'execució a tots els rols, i
-- només private.he_acceptat_normes() la torna a authenticated (2b).
--
-- QUÈ FA:
--   1. private.versio_normes_vigent() · La versió vigent de les normes:
--      '2026-10-24', la de VERSIO_NORMES_CONVIVENCIA (src/data/contracte.js).
--      La prova estàtica src/data/supabase/normesExigides.migracio.test.js les
--      contrasta: pujar la versió del client vol dir redefinir esta funció en
--      una migració nova, i aleshores tothom les torna a acceptar.
--   2. private.ha_acceptat_normes(p_usuari uuid) · Cert si la persona té una
--      fila a private.normes_acceptades amb la versió vigent.
--  2b. private.he_acceptat_normes() · La mateixa pregunta per a la persona de
--      la sessió (auth.uid()), sense paràmetre: SECURITY DEFINER i executable
--      només per authenticated, perquè la crida el disparador 3, que corre
--      amb el rol de qui escriu.
--   3. private.exigix_normes_publicacio() · Disparador d'abans d'inserir a
--      public.section_submissions (també l'upsert de publishNote) i d'abans
--      d'actualitzar-ne section_id, tenant_id, title, description o payload:
--      fora de les notes privades ('notes'), qui no ha acceptat la versió
--      vigent no publica, no passa una nota a una secció pública i no reescriu
--      una publicació amb un PATCH directe (auditoria Codex D-07.2, Gemini
--      G2-06.2). En una actualització només hi passen les escriptures directes
--      per l'API (current_user = 'authenticated': la funció és SECURITY
--      INVOKER a posta) i només si alguna d'eixes columnes canvia de valor.
--   4. private.exigix_normes_missatge() · Disparador d'abans d'inserir a
--      public.xat_missatges: només els missatges que envia una persona amb la
--      seua sessió (tipus 'text', l'únic que admet xat_envia; es_ia fals; de
--      qui crida). Els adjunts hi passen: xat_publica_adjunt insereix per
--      xat_envia amb tipus 'text' i el canvia després.
--
-- QUÈ NO FA:
--   · No toca cap fila que ja hi siga ni cap funció existent: només afig.
--   · No filtra el contingut abans de publicar (Apple 1.2): només exigix
--     l'acceptació de les normes.
--   · service_role, els seeds i les funcions del sistema (sense auth.uid())
--     queden fora, i també els missatges de la IAIA (es_ia), els de sistema
--     i qualsevol tipus que el client no envia.
--   · El xat privat amb la IAIA queda fora, com al client (XatContext.jsx,
--     esXatDeLaIAIA): un fil de tipus 'iaia', o un fil que no és de grup on
--     participa la IAIA ('11111111-1a1a-0000-0000-000000000000',
--     src/data/agentsSeed.js). El xat PÚBLIC de la pàgina /iaia, en canvi, sí
--     que les exigix: el llig el poble. El client hi passa la porta i, si el
--     servidor respon SDP-MOD-428, la torna a obrir (XatContext.jsx).
--   · No exigix la versió nova a qui edita un missatge que ja va enviar.
--   · Les funcions SECURITY DEFINER que reescriuen publicacions amb la sessió
--     de la persona (demana_baixa i cancela_baixa, 2609291200) no passen per
--     la porta d'actualització: hi escriuen com a propietàries. Una funció
--     SECURITY DEFINER nova que publique o reescriga contingut en nom d'algú
--     ha de mirar ella mateixa private.ha_acceptat_normes.
--   · No cobrix la resta del contingut dels veïns: els camps del perfil
--     (bio, lema, presentacio_html, hero_url, avatar_url i is_public, que
--     perfil_public mostra), els textos de les entitats (name, lema,
--     description) ni les pujades a Storage. Exigir-les-hi és decisió del
--     Mestre.
--
-- CODIS (missatge en valencià; el client el llig pel prefix,
-- src/data/errorsBackend.js · esRebuigDeNormes):
--   SDP-MOD-428 cal acceptar les normes de convivència (42501)
--   SDP-MOD-901 en aplicar-la: falta 2610201500 (42P01; la transacció es desfà)
--
-- Depén de: 2610201500 (private.normes_acceptades; sense ella, la migració
-- sencera falla i no queda res a mitges), 2609080000 (section_submissions i
-- l'USAGE de l'esquema private per a authenticated), 2609261200
-- (section_submissions.author_org_id i updated_at, que no obrin la porta),
-- 2609080200 (xat_missatges.es_ia), 2609270200 (xat_missatges.tipus,
-- xat_fils.tipus) i 2609282100 (xat_fils.subjecte_tipus i subjecte_id).
-- L'aplica el mateix rol que 2610201500 (el propietari de
-- private.normes_acceptades): el disparador de missatges i
-- he_acceptat_normes són SECURITY DEFINER i la lligen com a propietaris.
--
-- Additiva i idempotent. Revisada i NO aplicada a cap base de dades.
-- L'aplica el Mestre, mai un agent.
-- Va DESPRÉS de publicar el client amb VERSIO_NORMES_CONVIVENCIA = '2026-10-24':
-- un client antic només sap acceptar '2026-10-20' i, amb esta migració, ja no
-- podria publicar.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · La dependència, abans de res ────────────────────────────────────────
do $$
begin
  if to_regclass('private.normes_acceptades') is null then
    raise exception 'SDP-MOD-901: falta private.normes_acceptades; aplica abans 2610201500_moderacio_denuncies_i_bloquejos.sql.'
      using errcode = '42P01';
  end if;
end;
$$;

-- ── 1 · La versió vigent de les normes ──────────────────────────────────────
create or replace function private.versio_normes_vigent()
returns text
language sql
stable
set search_path = ''
as $$
  select '2026-10-24'::text;
$$;
revoke execute on function private.versio_normes_vigent() from public, anon, authenticated, service_role;

-- ── 2 · Si una persona ha acceptat la versió vigent ─────────────────────────
create or replace function private.ha_acceptat_normes(p_usuari uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_usuari is not null and exists (
    select 1 from private.normes_acceptades n
     where n.usuari_id = p_usuari and n.versio = private.versio_normes_vigent());
$$;
revoke execute on function private.ha_acceptat_normes(uuid) from public, anon, authenticated, service_role;

-- ── 2b · Si qui escriu les ha acceptades ────────────────────────────────────
-- SECURITY DEFINER i sense paràmetre: només diu si la persona de la sessió
-- (auth.uid()) ha acceptat la versió vigent, mai una altra. La crida el
-- disparador de publicacions, que s'executa amb el rol de qui escriu (3).
create or replace function private.he_acceptat_normes()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.ha_acceptat_normes((select auth.uid()));
$$;
revoke execute on function private.he_acceptat_normes() from public, anon, authenticated, service_role;
grant execute on function private.he_acceptat_normes() to authenticated;

-- ── 3 · Publicacions: section_submissions ───────────────────────────────────
-- SECURITY INVOKER a posta: current_user és el rol de qui escriu. En una
-- escriptura directa per l'API (PostgREST, també GraphQL) és authenticated;
-- dins d'una funció SECURITY DEFINER (demana_baixa i cancela_baixa retiren i
-- tornen les claus personals del payload) és la propietària de la funció.
create or replace function private.exigix_normes_publicacio()
returns trigger
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
begin
  -- Fora: service_role, els seeds i el sistema (sense persona).
  if v_jo is null or coalesce((select auth.role()), '') = 'service_role' then
    return new;
  end if;
  -- Les notes privades no es publiquen al poble.
  if new.section_id = 'notes' then
    return new;
  end if;
  -- En una actualització, només les escriptures directes per l'API i només si
  -- canvia el que es publica (títol, descripció, cos) o on (secció, poble):
  -- una nota que passa al Mur o una publicació que es reescriu amb un PATCH.
  if tg_op = 'UPDATE' then
    if current_user <> 'authenticated' then
      return new;
    end if;
    if (old.section_id, old.tenant_id, old.title, old.description, old.payload)
       is not distinct from (new.section_id, new.tenant_id, new.title, new.description, new.payload) then
      return new;
    end if;
  end if;
  if not private.he_acceptat_normes() then
    raise exception 'SDP-MOD-428: cal acceptar les normes de convivència.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.exigix_normes_publicacio() from public, anon, authenticated, service_role;

drop trigger if exists section_submissions_exigix_normes on public.section_submissions;
create trigger section_submissions_exigix_normes
  before insert or update of section_id, tenant_id, title, description, payload on public.section_submissions
  for each row execute function private.exigix_normes_publicacio();

-- ── 4 · Missatges del xat: xat_missatges ────────────────────────────────────
create or replace function private.exigix_normes_missatge()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
begin
  -- Fora: service_role, els seeds i el sistema (sense persona), la IAIA
  -- (es_ia), els tipus que el client no envia i el que no signa qui crida.
  if v_jo is null or coalesce((select auth.role()), '') = 'service_role'
     or coalesce(new.es_ia, false) or new.tipus is distinct from 'text'
     or new.usuari_id is distinct from v_jo then
    return new;
  end if;
  -- El xat privat amb la IAIA no és cap publicació per al poble (esXatDeLaIAIA).
  if exists (
    select 1 from public.xat_fils f
     where f.id = new.fil_id
       and (f.tipus = 'iaia'
         or (f.tipus not in ('grup', 'canal', 'comunitat')
             and exists (select 1 from public.xat_participants p
                          where p.fil_id = f.id
                            and p.usuari_id = '11111111-1a1a-0000-0000-000000000000'::uuid)))) then
    return new;
  end if;
  if not private.ha_acceptat_normes(v_jo) then
    raise exception 'SDP-MOD-428: cal acceptar les normes de convivència.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.exigix_normes_missatge() from public, anon, authenticated, service_role;

drop trigger if exists xat_missatges_exigix_normes on public.xat_missatges;
create trigger xat_missatges_exigix_normes
  before insert on public.xat_missatges
  for each row execute function private.exigix_normes_missatge();

notify pgrst, 'reload schema';

commit;
