-- ============================================================================
-- 20261114023000_joc_isoglosses_consens_comarcal.sql
-- Onada R23 (Fase 2 · IDEA-252 i IDEA-257) · Consens lèxic comarcal i camps
-- territorials separats per al joc «D'on parles?»
--
-- Depén de: 20261113233000.
-- Additiva, transaccional i idempotent: es pot tornar a executar sense efectes
-- destructius. NO aplicada a cap base remota: l'aplica el Mestre. El client
-- funciona sense ella amb emmagatzematge local honest (Llei 0).
--
-- Fortificació alineada amb tractor-rls.mjs (R1..R8) i doctrina RGPD:
--   1. Amplia public.aportacions_veu_poble amb columnes primitives separades
--      (poble, comarca_id, abast_comarcal) i CHECK estrictes de longitud i
--      domini tancat.
--   2. Crea public.joc_isoglosses_vots_consens amb RLS activada, zero
--      USING (true) o WITH CHECK (true), restricció d'unicitat per persona i
--      variant, i lectura directa de files restringida exclusivament a la
--      mateixa persona autora (cap exposició d'user_id a tercers).
--   3. Crea la RPC agregada public.resum_consens_isoglosses_poble(text) amb
--      SECURITY DEFINER i search_path buit, que retorna recomptes agregats
--      sense cap identificador personal. Avís (Llei 0): l'etiqueta i la clau
--      d'una variant les escriu qui vota i no passen per moderació; abans
--      d'encendre VITE_SDP_CONSENS_ISOGLOSSES al client cal la decisió del
--      Mestre sobre la moderació de variants noves (D-R24.2, informe R24.2).
--
-- Abans (lectura):
--   select to_regclass('public.aportacions_veu_poble') as te_aportacions_veu,
--          to_regclass('public.joc_isoglosses_vots_consens') as te_vots_consens;
--
-- Verificació posterior (lectura):
--   select column_name
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name = 'aportacions_veu_poble'
--     and column_name in ('poble', 'comarca_id', 'abast_comarcal')
--   order by column_name;
--
--   select to_regclass('public.joc_isoglosses_vots_consens') is not null as te_taula_vots,
--          to_regprocedure('public.resum_consens_isoglosses_poble(text)') is not null as te_rpc_resum;
--
-- Com tornar enrere (Onada R24.2), en una transacció:
--   drop function if exists public.resum_consens_isoglosses_poble(text);
--   drop table if exists public.joc_isoglosses_vots_consens;
--   alter table public.aportacions_veu_poble drop column if exists abast_comarcal,
--     drop column if exists comarca_id, drop column if exists poble;
-- (els CHECK de les tres columnes cauen amb elles).
-- Es perden els vots del joc i el territori de les aportacions.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Columnes territorials separades a aportacions_veu_poble ─────────────
alter table public.aportacions_veu_poble
  add column if not exists poble text;
alter table public.aportacions_veu_poble
  add column if not exists comarca_id text;
alter table public.aportacions_veu_poble
  add column if not exists abast_comarcal text;

alter table public.aportacions_veu_poble
  drop constraint if exists aportacions_veu_poble_poble_valid;
alter table public.aportacions_veu_poble
  add constraint aportacions_veu_poble_poble_valid
  check (poble is null or char_length(poble) <= 80 and char_length(btrim(poble)) between 2 and 80);

alter table public.aportacions_veu_poble
  drop constraint if exists aportacions_veu_poble_comarca_id_valid;
alter table public.aportacions_veu_poble
  add constraint aportacions_veu_poble_comarca_id_valid
  check (comarca_id is null or comarca_id ~ '^[a-z0-9_]{2,40}$');

alter table public.aportacions_veu_poble
  drop constraint if exists aportacions_veu_poble_abast_comarcal_valid;
alter table public.aportacions_veu_poble
  add constraint aportacions_veu_poble_abast_comarcal_valid
  check (abast_comarcal is null or abast_comarcal in (
    'nomes_poble',
    'crec_comarca',
    'alguns_veins',
    'no_ho_se'
  ));


-- ── 2 · Taula de vots de consens comarcal (1 vot per persona i variant) ─────
create table if not exists public.joc_isoglosses_vots_consens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pregunta_id text not null check (pregunta_id ~ '^[a-z0-9_]{3,80}$'),
  variant_clau text not null check (variant_clau ~ '^[a-z0-9_]{2,80}$'),
  paraula_etiqueta text not null check (char_length(paraula_etiqueta) <= 120 and char_length(btrim(paraula_etiqueta)) between 2 and 120),
  poble text check (poble is null or char_length(poble) <= 80 and char_length(btrim(poble)) between 2 and 80),
  comarca_id text check (comarca_id is null or comarca_id ~ '^[a-z0-9_]{2,40}$'),
  abast_comarcal text not null default 'no_ho_se' check (abast_comarcal in (
    'nomes_poble',
    'crec_comarca',
    'alguns_veins',
    'no_ho_se'
  )),
  created_at timestamptz not null default now(),
  constraint joc_isoglosses_vot_unic_usuari_variant unique (user_id, pregunta_id, variant_clau)
);

alter table public.joc_isoglosses_vots_consens enable row level security;

drop policy if exists joc_isoglosses_vots_select_propi on public.joc_isoglosses_vots_consens;
create policy joc_isoglosses_vots_select_propi
  on public.joc_isoglosses_vots_consens
  for select
  using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists joc_isoglosses_vots_insert_propi on public.joc_isoglosses_vots_consens;
create policy joc_isoglosses_vots_insert_propi
  on public.joc_isoglosses_vots_consens
  for insert
  with check (
    auth.uid() is not null
    and auth.uid() = user_id
    and char_length(paraula_etiqueta) <= 120 and char_length(btrim(paraula_etiqueta)) between 2 and 120
  );

drop policy if exists joc_isoglosses_vots_delete_propi on public.joc_isoglosses_vots_consens;
create policy joc_isoglosses_vots_delete_propi
  on public.joc_isoglosses_vots_consens
  for delete
  using (auth.uid() is not null and auth.uid() = user_id);

revoke all on table public.joc_isoglosses_vots_consens from public, anon, authenticated;
grant select, insert, delete on table public.joc_isoglosses_vots_consens to authenticated;

create index if not exists idx_joc_isoglosses_vots_pregunta_variant
  on public.joc_isoglosses_vots_consens (pregunta_id, variant_clau);


-- ── 3 · Resum públic agregat per (pregunta, variant, comarca) coherent (R23-U05) ──
-- CODEX-R24-D1-07 (Onada R24.2) · La comarca es normalitza UNA sola vegada dins
-- del CTE comarca_neta, i SELECT, GROUP BY i ORDER BY referencien exactament
-- eixa mateixa columna: cap expressió diferent entre la projecció i
-- l'agrupació (PostgreSQL 42803). Una comarca buida o «no_ho_se» compta com a
-- «sense comarca» (null).
-- Gauntlet R24.2 (enduriment abans de producció):
--   · l'etiqueta i el poble es retallen al CTE (una fila amb espais o fora de
--     mida no tomba el resum sencer al client);
--   · el poble d'exemple només ix quan almenys DOS vots del mateix grup el
--     comparteixen (el més freqüent; a igualtat, el primer en ordre C): mai el
--     poble que ha escrit una sola persona;
--   · com a molt 20 files per pregunta, i 250 en total: cap pregunta no deixa
--     sense consens les altres;
--   · l'ordre i els desempats van amb la col·lació "C", la mateixa del mirall
--     local (creaConsensIsoglossesMemoria), sigui quina siga la de la base.
create or replace function public.resum_consens_isoglosses_poble(p_pregunta_id text default null)
returns table (
  pregunta_id text,
  variant_clau text,
  paraula_etiqueta text,
  poble_exemple text,
  comarca_id text,
  total_vots bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with comarca_neta as (
    select
      v.pregunta_id,
      v.variant_clau,
      btrim(v.paraula_etiqueta) as paraula_neta,
      nullif(btrim(v.poble), '') as poble_net,
      nullif(nullif(btrim(v.comarca_id), ''), 'no_ho_se') as comarca
    from public.joc_isoglosses_vots_consens v
    where p_pregunta_id is null
       or (p_pregunta_id ~ '^[a-z0-9_]{3,80}$' and v.pregunta_id = p_pregunta_id)
  ),
  pobles as (
    select c.pregunta_id, c.variant_clau, c.comarca, c.poble_net, count(*) as n
    from comarca_neta c
    where c.poble_net is not null
    group by c.pregunta_id, c.variant_clau, c.comarca, c.poble_net
  ),
  grups as (
    select
      c.pregunta_id,
      c.variant_clau,
      c.comarca,
      min(c.paraula_neta collate "C") as paraula_etiqueta,
      count(*)::bigint as total_vots
    from comarca_neta c
    group by c.pregunta_id, c.variant_clau, c.comarca
  ),
  ordenats as (
    select
      g.*,
      (select p.poble_net
         from pobles p
        where p.pregunta_id = g.pregunta_id and p.variant_clau = g.variant_clau
          and p.comarca is not distinct from g.comarca and p.n >= 2
        order by p.n desc, p.poble_net collate "C" asc
        limit 1) as poble_exemple,
      row_number() over (
        partition by g.pregunta_id
        order by g.total_vots desc, g.variant_clau collate "C" asc, g.comarca collate "C" asc nulls last
      ) as posicio
    from grups g
  )
  select o.pregunta_id, o.variant_clau, o.paraula_etiqueta, o.poble_exemple, o.comarca as comarca_id, o.total_vots
  from ordenats o
  where o.posicio <= 20
  order by o.pregunta_id collate "C" asc, o.total_vots desc, o.variant_clau collate "C" asc, o.comarca collate "C" asc nulls last
  limit 250;
$$;

revoke all on function public.resum_consens_isoglosses_poble(text) from public;
grant execute on function public.resum_consens_isoglosses_poble(text) to anon, authenticated;

commit;
