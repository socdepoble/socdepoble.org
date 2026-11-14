-- ============================================================================
-- 20261114171500_r25_2_r23_octet_length_bounds.sql
-- Onada R25.2 · Tancament de CODEX-R24.2-T1-02: sostres físics d'octets
-- (`octet_length(...) <= N`) sobre totes les columnes de text lliure de les
-- taules R23 del Refranyer i Consens d'Isoglosses.
--
-- Depén de: 20261113233000_refranyer_sonor_i_aportacions_dialectals.sql
--           20261114023000_joc_isoglosses_consens_comarcal.sql
--
-- Motivació (CODEX-R24.2-T1-02):
--   Un CHECK basat només en `char_length(btrim(col))` o fins i tot només en
--   caràcters sense límit explícit de bytes no acota la mida binària UTF-8
--   d'un INSERT directe via PostgREST. Esta migració additiva i idempotent
--   imposa sostres d'octets (`<= 4096` com a invariant màxim i ajustats a
--   `4 * max_chars` per camp) amb `DROP CONSTRAINT IF EXISTS`, `ADD CONSTRAINT
--   ... NOT VALID` i `VALIDATE CONSTRAINT` dins d'una transacció amb lock_timeout
--   curt.
--
-- Com tornar enrere (idempotent):
--   begin;
--   alter table if exists public.refranys_poble
--     drop constraint if exists refranys_poble_octets_bounds;
--   alter table if exists public.aportacions_veu_poble
--     drop constraint if exists aportacions_veu_poble_octets_bounds;
--   alter table if exists public.joc_isoglosses_vots_consens
--     drop constraint if exists joc_isoglosses_vots_consens_octets_bounds;
--   commit;
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · public.refranys_poble ────────────────────────────────────────────────
alter table public.refranys_poble
  drop constraint if exists refranys_poble_octets_bounds;

alter table public.refranys_poble
  add constraint refranys_poble_octets_bounds
  check (
    octet_length(id) <= 320
    and octet_length(text_refrany) <= 1120
    and octet_length(comarca) <= 480
    and (poble is null or octet_length(poble) <= 480)
    and octet_length(explicacio_i18n::text) <= 4096
  ) not valid;

alter table public.refranys_poble
  validate constraint refranys_poble_octets_bounds;


-- ── 2 · public.aportacions_veu_poble (variants locals i àudios d'isoglosses) ─
alter table public.aportacions_veu_poble
  drop constraint if exists aportacions_veu_poble_octets_bounds;

alter table public.aportacions_veu_poble
  add constraint aportacions_veu_poble_octets_bounds
  check (
    (refrany_id is null or octet_length(refrany_id) <= 320)
    and (pregunta_id is null or octet_length(pregunta_id) <= 320)
    and octet_length(text_aportat) <= 1120
    and octet_length(poble_comarca) <= 480
    and (audio_storage_path is null or octet_length(audio_storage_path) <= 1020)
    and (poble is null or octet_length(poble) <= 320)
    and (comarca_id is null or octet_length(comarca_id) <= 160)
  ) not valid;

alter table public.aportacions_veu_poble
  validate constraint aportacions_veu_poble_octets_bounds;


-- ── 3 · public.joc_isoglosses_vots_consens ───────────────────────────────────
alter table public.joc_isoglosses_vots_consens
  drop constraint if exists joc_isoglosses_vots_consens_octets_bounds;

alter table public.joc_isoglosses_vots_consens
  add constraint joc_isoglosses_vots_consens_octets_bounds
  check (
    octet_length(pregunta_id) <= 320
    and octet_length(variant_clau) <= 320
    and octet_length(paraula_etiqueta) <= 480
    and (poble is null or octet_length(poble) <= 320)
    and (comarca_id is null or octet_length(comarca_id) <= 160)
  ) not valid;

alter table public.joc_isoglosses_vots_consens
  validate constraint joc_isoglosses_vots_consens_octets_bounds;

commit;
