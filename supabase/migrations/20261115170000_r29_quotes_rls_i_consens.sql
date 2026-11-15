-- ============================================================================
-- 20261115170000_r29_quotes_rls_i_consens.sql
-- Onada R29 · Correccions SQL de la revisió adversarial R29 (pla aprovat pel
-- Mestre, DECISIÓ-R29-02): SQL-R29-01, SQL-R29-02, SQL-R29-03, SQL-R29-04 i
-- SQL-R29-06. NO aplicada: la revisa i l'aplica el Mestre, mai un agent
-- (DECISIÓ-R29-03).
--
-- Depén de: 2610241400 (private.ha_acceptat_normes), 20261114000100
--   (private.peticio_de_servidor), 20261113233000 i 20261114023000 (les taules
--   R23 i la RPC del resum), 2611091500 (public.aportacions_culturals),
--   2611110110 (public.revisions_patrimoni) i 20261114060000 (les dues taules
--   privades de la reconciliació del xat).
-- Va darrere de tot el catàleg, també de la R28 (20261115030000), però no la
-- necessita: els disparadors d'esta i els de la R28 no es toquen entre ells.
--
-- Què fa:
--   0 · Precondicions. Si falta alguna peça avorta neta abans de tocar res
--       (55000): SDP-R29-001 sense private.peticio_de_servidor() o sense
--       private.ha_acceptat_normes(uuid), i SDP-R29-002 sense les taules R23
--       o sense public.resum_consens_isoglosses_poble(text).
--   1 · SQL-R29-06 · ENABLE ROW LEVEL SECURITY a private.xat_fils_fusionats i
--       a private.xat_fusions_pendents, sense cap política: cap rol de l'API
--       no hi té cap privilegi i, si algun dia un GRANT hi arriba per error, la
--       RLS ho continua tancant tot. La propietària (la reconciliació de la
--       20261114060000) no hi queda subjecta. Si no hi són (la 20261114060000
--       no s'ha aplicat), un avís SDP-R29-010 i res més.
--   2 · SQL-R29-03 · Normes de convivència a les taules R23: disparador
--       BEFORE INSERT aportacions_veu_poble_exigix_normes i
--       joc_isoglosses_vots_exigix_normes → private.veu_del_poble_exigix_normes().
--       Qui escriu per l'API sense haver acceptat la versió vigent rep
--       SDP-MOD-428 (42501), la mateixa porta que les aportacions culturals i
--       les revisions de patrimoni; també un vot repetit (ON CONFLICT DO
--       NOTHING). Pel nom, es dispara abans que les quotes de la R28: qui no
--       té les normes no compta ni topa amb cap quota. Una fila amb una altra
--       autoria passa sense mirar-la i la rebutja la RLS (42501); el servidor
--       i les sessions sense petició de l'API en queden fora
--       (private.peticio_de_servidor()). La pertinença a un poble no s'hi
--       exigix: les taules R23 no tenen tenant_id.
--   3 · SQL-R29-01 · Sostres per compte a public.aportacions_culturals
--       (disparador aportacions_culturals_limita_ritme →
--       private.aportacions_culturals_limita_ritme(); l'única via d'escriptura
--       és l'RPC envia_aportacio_cultural, que no es toca):
--         · 20 aportacions en l'última hora i 100 en les últimes 24 hores
--           (SDP-CULTURA-429, 42900);
--         · 500 aportacions desades i 8 MiB entre títol, autoria, poble i
--           contingut (SDP-CULTURA-QUOTA, 53400). Es mira abans que les
--           finestres. Cap persona no pot esborrar-ne cap des de l'API: per a
--           fer-hi lloc cal l'administració;
--         · creat_a és l'hora del servidor; pel nom, es dispara després de la
--           porta de normes de la 2611091500.
--       I a public.revisions_patrimoni (escriptura directa per l'API, també
--       en lot; disparador revisions_patrimoni_quota →
--       private.revisions_patrimoni_limita_volum(), després de
--       revisions_patrimoni_prepara pel nom):
--         · 1000 revisions desades per persona (creat_per) i 8 MiB entre
--           l'identificador, l'estat, les mesures i les observacions
--           (SDP-PATRIMONI-QUOTA, 53400). La taula no té cap data d'alta: no
--           hi ha finestres per hora ni per dia, i no s'hi afig cap columna;
--         · una edició pròpia que fa créixer la fila també mira els 8 MiB; una
--           que no la fa créixer, i les de curadoria o administració sobre una
--           revisió d'una altra persona, no miren res;
--         · esborrar-ne una (la RLS ho permet a l'autoria) torna a fer lloc.
--       Totes dues: un pg_advisory_xact_lock per persona serialitza les altes
--       simultànies; un lot que passa el sostre cau sencer; una fila amb una
--       altra autoria la rebutja la RLS sense mirar cap quota; el servidor i
--       les sessions sense petició de l'API en queden fora. Si la taula no hi
--       és (la 2611091500 o la 2611110110 no s'han aplicat), un avís
--       SDP-R29-011 o SDP-R29-012 i cap disparador.
--   4 · SQL-R29-02 i SQL-R29-04 · public.resum_consens_isoglosses_poble(text),
--       mateixa signatura, SECURITY DEFINER, search_path buit i permisos:
--         · només les dotze preguntes del joc (PREGUNTES_ISOGLOSSES de
--           src/components/patrimoni/isoglossesComarcals.js): 12 × 20 = 240
--           files, dins del límit de 250. Un compte que vota preguntes
--           inventades ja no expulsa el consens real, i demanar-ne una torna
--           buit. Una pregunta nova al joc vol dir una migració nova;
--         · l'etiqueta d'una variant és la més petita en col·lació "C" entre
--           les que tenen el mot de la clau (la regla de clauDeMot del client:
--           NFD, sense marques combinants, minúscules i cada tram que no és
--           [a-z0-9] fet «_»). Un vot amb un altre text ja no la reetiqueta;
--           si cap etiqueta no hi casa, ix la clau mateixa, mai text lliure;
--         · la resta, igual que la 20261114023000.
--
-- Per què estos límits: un veí de veritat no s'hi acosta mai. Una aportació
-- cultural és un text revisat a mà (com a molt 20.000 caràcters); 20 en una
-- hora ja és una ràfega, i 500 desades o 8 MiB, molt més del que farà la persona
-- més entusiasta. Una revisió de patrimoni és una campanya anual per peça i
-- poble: 1000 cobrixen un banc de llavors sencer durant anys. Amb els sostres,
-- un sol compte no passa de 8 MiB en cada taula. Són orientatius: els tria el
-- Mestre.
--
-- Què NO fa: no crea cap GRANT ni cap política, no toca cap fila, cap CHECK ni
-- cap altra funció (envia_aportacio_cultural conserva el cos que fixa
-- scripts/supabase/verifica_migracions_r15.sql). No posa el fusible global de
-- mida (private.fusible_mida_bd de R22.3 només és a notes, com a la R28):
-- penjar-lo d'estes taules és decisió del Mestre. No modera l'etiqueta ni la
-- clau d'una variant nova (D-R24.2): una variant inventada sota una pregunta
-- real continua eixint al resum amb el seu mot. Els missatges SDP-* són en
-- valencià; traduir-los és feina del client.
--
-- Abans (lectura): les peces de les quals depén.
--   select to_regprocedure('private.peticio_de_servidor()') is not null as te_peticio_de_servidor, to_regprocedure('private.ha_acceptat_normes(uuid)') is not null as te_normes, to_regclass('public.joc_isoglosses_vots_consens') is not null as te_vots, to_regclass('public.aportacions_culturals') is not null as te_cultura, to_regclass('public.revisions_patrimoni') is not null as te_patrimoni, to_regclass('private.xat_fils_fusionats') is not null as te_fusionats;
-- Abans (lectura): quants vots tenen preguntes de fora del joc (el resum deixarà de mostrar-los).
--   select count(*) filter (where v.pregunta_id <> all (array['q01_creilla', 'q02_espencat', 'q03_bresquilla', 'q04_granera', 'q05_poal', 'q06_tomaca', 'q07_pimento', 'q08_rabosa', 'q09_bajoques', 'q10_espill', 'q11_hui_eixir', 'q12_comboi'])) as vots_fora_del_joc, count(*) as vots from public.joc_isoglosses_vots_consens v;
--
-- Verificació posterior (lectura):
--   select t.tgrelid::regclass::text as taula, t.tgname from pg_catalog.pg_trigger t where not t.tgisinternal and t.tgname in ('aportacions_veu_poble_exigix_normes', 'joc_isoglosses_vots_exigix_normes', 'aportacions_culturals_limita_ritme', 'revisions_patrimoni_quota') order by 1, 2;
--   select c.relname, c.relrowsecurity from pg_catalog.pg_class c where c.oid in (to_regclass('private.xat_fils_fusionats'), to_regclass('private.xat_fusions_pendents')) order by 1;
--   select position('q12_comboi' in pg_get_functiondef(to_regprocedure('public.resum_consens_isoglosses_poble(text)'))) > 0 as resum_amb_llista_tancada;
--   (quatre files si hi són les dues taules de cultura, dues files certes i cert).
--
-- Com tornar enrere (en una transacció, només si cal):
--   drop trigger if exists aportacions_veu_poble_exigix_normes on public.aportacions_veu_poble;
--   drop trigger if exists joc_isoglosses_vots_exigix_normes on public.joc_isoglosses_vots_consens;
--   drop function if exists private.veu_del_poble_exigix_normes();
--   drop trigger if exists aportacions_culturals_limita_ritme on public.aportacions_culturals;
--   drop function if exists private.aportacions_culturals_limita_ritme();
--   drop trigger if exists revisions_patrimoni_quota on public.revisions_patrimoni;
--   drop function if exists private.revisions_patrimoni_limita_volum();
--   i tornar a aplicar la 20261114023000, que torna a crear el resum sense la
--   llista tancada ni el filtre de l'etiqueta. La RLS de les dues taules
--   privades es pot deixar: sense cap privilegi de l'API no canvia res. Si es
--   torna a aplicar la 20261114023000 per un altre motiu, cal tornar a aplicar
--   esta (ordre_desplegament.json, reaplicacio).
--
-- Transaccional i idempotent: la segona aplicació no canvia res.
-- Provat a tests/r29-quotes-rls-i-consens.test.mjs (PGlite, catàleg complet).
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ---------------------------------------------------------------------------
-- 0 · Precondicions: cap canvi si falta alguna peça.
-- ---------------------------------------------------------------------------
do $r29_precondicions$
begin
  if to_regprocedure('private.peticio_de_servidor()') is null
     or to_regprocedure('private.ha_acceptat_normes(uuid)') is null then
    raise exception 'SDP-R29-001: cal la 20261114000100 (private.peticio_de_servidor) i la 2610241400 (private.ha_acceptat_normes); no s''ha canviat res.'
      using errcode = '55000';
  end if;
  if to_regclass('public.aportacions_veu_poble') is null
     or to_regclass('public.joc_isoglosses_vots_consens') is null
     or to_regprocedure('public.resum_consens_isoglosses_poble(text)') is null then
    raise exception 'SDP-R29-002: cal aplicar abans les taules R23 i el resum del consens (20261113233000 i 20261114023000); no s''ha canviat res.'
      using errcode = '55000';
  end if;
end $r29_precondicions$;

-- ---------------------------------------------------------------------------
-- 1 · SQL-R29-06 · RLS a les taules privades de la reconciliació del xat.
-- ---------------------------------------------------------------------------
do $r29_rls_privades$
begin
  if to_regclass('private.xat_fils_fusionats') is not null then
    alter table private.xat_fils_fusionats enable row level security;
  else
    raise notice 'SDP-R29-010: private.xat_fils_fusionats no hi és (20261114060000 sense aplicar); no hi ha res a tancar.';
  end if;
  if to_regclass('private.xat_fusions_pendents') is not null then
    alter table private.xat_fusions_pendents enable row level security;
  else
    raise notice 'SDP-R29-010: private.xat_fusions_pendents no hi és (20261114060000 sense aplicar); no hi ha res a tancar.';
  end if;
end $r29_rls_privades$;

-- ---------------------------------------------------------------------------
-- 2 · SQL-R29-03 · Normes de convivència a les escriptures R23 de l'API.
-- ---------------------------------------------------------------------------
create or replace function private.veu_del_poble_exigix_normes()
returns trigger language plpgsql security definer set search_path = ''
as $f$
declare
  v_jo uuid := (select auth.uid());
begin
  -- Fora: el servidor i les sessions sense cap petició de l'API.
  if private.peticio_de_servidor() then return new; end if;
  -- Una altra autoria: la rebutja la RLS d'inserció.
  if v_jo is null or new.user_id is distinct from v_jo then return new; end if;
  if not private.ha_acceptat_normes(v_jo) then
    raise exception 'SDP-MOD-428: cal acceptar les normes de convivència.' using errcode = '42501';
  end if;
  return new;
end $f$;
revoke all on function private.veu_del_poble_exigix_normes() from public, anon, authenticated, service_role;
drop trigger if exists aportacions_veu_poble_exigix_normes on public.aportacions_veu_poble;
create trigger aportacions_veu_poble_exigix_normes
  before insert on public.aportacions_veu_poble
  for each row execute function private.veu_del_poble_exigix_normes();
drop trigger if exists joc_isoglosses_vots_exigix_normes on public.joc_isoglosses_vots_consens;
create trigger joc_isoglosses_vots_exigix_normes
  before insert on public.joc_isoglosses_vots_consens
  for each row execute function private.veu_del_poble_exigix_normes();

-- ---------------------------------------------------------------------------
-- 3 · SQL-R29-01 · Sostres per compte: aportacions culturals i revisions de
--     patrimoni.
-- ---------------------------------------------------------------------------
create or replace function private.aportacions_culturals_limita_ritme()
returns trigger language plpgsql security definer set search_path = ''
as $f$
declare
  c_per_hora constant integer := 20;
  c_per_dia  constant integer := 100;
  c_en_total constant integer := 500;
  c_octets   constant bigint  := 8388608;
  v_jo     uuid := (select auth.uid());
  v_hora   integer;
  v_dia    integer;
  v_total  integer;
  v_octets bigint;
  v_nova   bigint;
begin
  -- Fora: el servidor i les sessions sense cap petició de l'API.
  if private.peticio_de_servidor() then return new; end if;
  -- L'RPC sempre hi posa la persona de la sessió; qualsevol altra cosa no es mira.
  if v_jo is null or new.usuari_id is distinct from v_jo then return new; end if;
  -- L'hora del servidor: una data de fora no trau la fila de la finestra.
  new.creat_a := now();
  perform pg_advisory_xact_lock(hashtextextended('sdp:r29:cultura:' || v_jo::text, 0));
  select count(*) filter (where a.creat_a > now() - interval '1 hour'),
         count(*) filter (where a.creat_a > now() - interval '24 hours'),
         count(*),
         coalesce(sum(octet_length(a.titol) + octet_length(a.autoria) + octet_length(a.poble) + octet_length(a.contingut)), 0)
    into v_hora, v_dia, v_total, v_octets
    from public.aportacions_culturals a
   where a.usuari_id = v_jo;
  v_nova := octet_length(new.titol) + octet_length(new.autoria) + octet_length(new.poble) + octet_length(new.contingut);
  if v_total >= c_en_total then
    raise exception 'SDP-CULTURA-QUOTA: ja tens % aportacions culturals desades i el màxim per persona és %.', v_total, c_en_total
      using errcode = '53400';
  end if;
  if v_octets + v_nova > c_octets then
    raise exception 'SDP-CULTURA-QUOTA: les teues aportacions culturals ocuparien % octets i el màxim per persona és %.', v_octets + v_nova, c_octets
      using errcode = '53400';
  end if;
  if v_hora >= c_per_hora or v_dia >= c_per_dia then
    raise exception 'SDP-CULTURA-429: has enviat moltes aportacions culturals en poc de temps (com a molt % en una hora i % en un dia); torna-ho a provar més tard.', c_per_hora, c_per_dia
      using errcode = '42900';
  end if;
  return new;
end $f$;
revoke all on function private.aportacions_culturals_limita_ritme() from public, anon, authenticated, service_role;

create or replace function private.revisions_patrimoni_limita_volum()
returns trigger language plpgsql security definer set search_path = ''
as $f$
declare
  c_en_total constant integer := 1000;
  c_octets   constant bigint  := 8388608;
  v_jo     uuid := (select auth.uid());
  v_total  integer;
  v_octets bigint;
  v_nova   bigint;
begin
  -- Fora: el servidor i les sessions sense cap petició de l'API.
  if private.peticio_de_servidor() then return new; end if;
  -- Una altra autoria: a l'alta la rebutja la RLS; en una edició és curadoria o
  -- administració sobre la revisió d'una altra persona, i no es mira.
  if v_jo is null or new.creat_per is distinct from v_jo then return new; end if;
  v_nova := octet_length(new.entitat_slug) + octet_length(new.estat_conservacio)
    + octet_length(new.mesures_jsonb::text) + octet_length(new.observacions);
  -- Una edició que no fa créixer la fila sempre passa: qui és al sostre pot encongir.
  if tg_op = 'UPDATE' and v_nova <= octet_length(old.entitat_slug) + octet_length(old.estat_conservacio)
       + octet_length(old.mesures_jsonb::text) + octet_length(old.observacions) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp:r29:patrimoni:' || v_jo::text, 0));
  select count(*),
         coalesce(sum(octet_length(r.entitat_slug) + octet_length(r.estat_conservacio)
           + octet_length(r.mesures_jsonb::text) + octet_length(r.observacions)), 0)
    into v_total, v_octets
    from public.revisions_patrimoni r
   where r.creat_per = v_jo and (tg_op = 'INSERT' or r.id <> old.id);
  if tg_op = 'INSERT' and v_total >= c_en_total then
    raise exception 'SDP-PATRIMONI-QUOTA: ja tens % revisions de patrimoni desades i el màxim per persona és %.', v_total, c_en_total
      using errcode = '53400';
  end if;
  if v_octets + v_nova > c_octets then
    raise exception 'SDP-PATRIMONI-QUOTA: les teues revisions de patrimoni ocuparien % octets i el màxim per persona és %.', v_octets + v_nova, c_octets
      using errcode = '53400';
  end if;
  return new;
end $f$;
revoke all on function private.revisions_patrimoni_limita_volum() from public, anon, authenticated, service_role;

do $r29_quotes_cultura$
begin
  if to_regclass('public.aportacions_culturals') is not null then
    drop trigger if exists aportacions_culturals_limita_ritme on public.aportacions_culturals;
    create trigger aportacions_culturals_limita_ritme
      before insert on public.aportacions_culturals
      for each row execute function private.aportacions_culturals_limita_ritme();
  else
    raise notice 'SDP-R29-011: public.aportacions_culturals no hi és (2611091500 sense aplicar); cap sostre. Si s''aplica després, cal tornar a aplicar esta.';
  end if;
  if to_regclass('public.revisions_patrimoni') is not null then
    drop trigger if exists revisions_patrimoni_quota on public.revisions_patrimoni;
    create trigger revisions_patrimoni_quota
      before insert or update of estat_conservacio, mesures_jsonb, observacions on public.revisions_patrimoni
      for each row execute function private.revisions_patrimoni_limita_volum();
  else
    raise notice 'SDP-R29-012: public.revisions_patrimoni no hi és (2611110110 sense aplicar); cap sostre. Si s''aplica després, cal tornar a aplicar esta.';
  end if;
end $r29_quotes_cultura$;

-- ---------------------------------------------------------------------------
-- 4 · SQL-R29-02 i SQL-R29-04 · Resum públic: les preguntes del joc i
--     l'etiqueta amb el mot de la clau.
-- ---------------------------------------------------------------------------
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
      -- Onada R29 · La clau del mot, com clauDeMot (src/data/consensIsoglosses.js).
      btrim(regexp_replace(lower(regexp_replace(normalize(v.paraula_etiqueta, nfd), '[̀-ͯ]', '', 'g')),
        '[^a-z0-9]+', '_', 'g'), '_') as clau_etiqueta,
      nullif(btrim(v.poble), '') as poble_net,
      nullif(nullif(btrim(v.comarca_id), ''), 'no_ho_se') as comarca
    from public.joc_isoglosses_vots_consens v
    -- Onada R29 · Només les preguntes del joc (PREGUNTES_ISOGLOSSES): 12 × 20 <= 250.
    where v.pregunta_id = any (array['q01_creilla', 'q02_espencat', 'q03_bresquilla', 'q04_granera', 'q05_poal', 'q06_tomaca',
                                     'q07_pimento', 'q08_rabosa', 'q09_bajoques', 'q10_espill', 'q11_hui_eixir', 'q12_comboi'])
      and (p_pregunta_id is null
       or (p_pregunta_id ~ '^[a-z0-9_]{3,80}$' and v.pregunta_id = p_pregunta_id))
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
      -- Onada R29 · Només una etiqueta amb el mot de la clau; si no n'hi ha cap, la clau.
      coalesce(min(c.paraula_neta collate "C") filter (where c.clau_etiqueta = c.variant_clau),
        c.variant_clau collate "C") as paraula_etiqueta,
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

notify pgrst, 'reload schema';
commit;
