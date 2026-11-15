-- ============================================================================
-- 20261115030000_r28_rgpd_exportacio_i_quotes_r23.sql
-- Onada R28 (Carril 1) · Exportació RGPD i quotes d'escriptura per persona de
-- les taules R23 del Refranyer i del joc «D'on parles?». Decisions del Mestre
-- D-R24.2-5 (exportació) i D-R24.2-6 (quotes, model R22.3), aprovades al pla
-- d'implementació R28 v1.1.0. NO aplicada: la revisa i l'aplica el Mestre,
-- mai un agent.
--
-- Depén de: 2611070600 (l'embolcall vigent de public.exporta_les_meues_dades
--   i la base privada private.exporta_les_meues_dades_base_r33), 20261114000100
--   (private.peticio_de_servidor), 20261113233000 i 20261114023000 (les taules
--   R23 i les columnes territorials) i 20261114171500 (sostres d'octets).
--
-- Què fa:
--   0 · Precondicions. Si falta alguna peça avorta neta abans de tocar res
--       (55000): SDP-R28-001 sense private.peticio_de_servidor(), SDP-R28-002
--       sense les taules R23 o les columnes poble, comarca_id i abast_comarcal,
--       i SDP-R28-003 sense la base privada de l'exportació o si qui aplica no
--       és la propietària de la base i de l'RPC (la base només l'executa ella).
--   1 · public.aportacions_veu_poble: disparador BEFORE INSERT
--       aportacions_veu_poble_limita_ritme → private.aportacions_veu_poble_limita_ritme().
--   2 · public.joc_isoglosses_vots_consens: disparador BEFORE INSERT
--       joc_isoglosses_vots_limita_ritme → private.joc_isoglosses_vots_limita_ritme(),
--       i l'índex idx_joc_isoglosses_vots_user_created (user_id, created_at desc)
--       per al recompte (les aportacions ja tenen idx_aportacions_veu_poble_user).
--       Cada disparador, per a la persona de la sessió i en cada taula:
--         · c_per_hora = 60 files vives creades en l'última hora i
--           c_per_dia = 500 files vives creades en les últimes 24 hores
--           (SDP-VEU-429 o SDP-ISOGLOSSES-429, 42900);
--         · c_en_total = 2000 files vives (SDP-VEU-QUOTA o SDP-ISOGLOSSES-QUOTA,
--           53400; el missatge diu quantes en tens ara i el màxim). Es mira
--           abans que les finestres: esperar no hi serviria;
--         · com a R22.3, tots tres compten les files vives, no les escriptures
--           fetes: esborrar-ne una (la RLS d'autoria ho permet a l'API; avui el
--           client no té cap botó d'esborrar aportacions ni vots) torna a fer
--           lloc a les finestres on es va crear i al sostre total;
--         · created_at és l'hora del servidor (now()): una data enviada pel
--           client no trau la fila de la finestra (la mateixa regla de R22.3 al Mur);
--         · un vot repetit (el client l'envia amb ON CONFLICT DO NOTHING i no
--           desa res) no compta ni topa mai amb la quota;
--         · una fila amb una altra autoria no es compta ni es mira: la RLS
--           d'inserció (auth.uid() = user_id) la rebutja després del disparador
--           amb 42501, i el disparador no diu mai si la quota d'una altra persona
--           és plena;
--         · fora: el servidor (service_role) i les sessions sense cap petició de
--           l'API (editor SQL, migracions, moderació i importacions), amb
--           private.peticio_de_servidor() de 20261114000100. Una petició
--           anònima no hi arriba: anon no té INSERT en cap de les tres taules.
--       Un pg_advisory_xact_lock per persona i taula serialitza les insercions
--       simultànies de la mateixa persona, també la d'un vot repetit (el
--       bloqueig es pren abans de mirar si el vot ja hi és). El recompte va per
--       l'índex de (user_id, created_at); amb el sostre total, l'API no fa
--       passar ningú de 2000 files (el servidor, que en queda fora, sí que en
--       pot desar més, i aleshores el recompte en llig més).
--       Carrera residual als vots, sense cap prova de concurrència (PGlite té
--       una sola connexió): un DELETE no passa pel disparador ni pren el
--       bloqueig. Si la mateixa persona esborra un vot mentre torna a enviar
--       eixe mateix vot, el disparador encara el pot veure viu i el tracta com
--       a repetit, sense comptar res; la inserció espera que l'esborrat acabe i
--       el torna a desar amb l'hora del servidor sense haver mirat les
--       finestres. El total no creix (n'ix un i n'entra un) i cada cas demana
--       esborrar abans un vot propi.
--   3 · public.refranys_poble: cap disparador, a posta. No té cap columna
--       d'autoria (no hi ha «les files d'una persona» a comptar) i cap rol de
--       l'API no hi pot escriure: 20261113233000 hi revoca tot i només hi torna
--       SELECT, i la RLS només té la política de lectura dels publicats. El
--       catàleg el cura el servidor. Una quota hi seria codi que no s'executa
--       mai (Llei 0). Si un dia una RPC de curadoria hi escriu des de l'API, la
--       quota va en eixa RPC, que sap qui escriu.
--   4 · public.exporta_les_meues_dades(): el cos de 2611070600 sense canviar
--       res (la base privada, la comprovació del format v1 i seed_revisions)
--       més la clau nova veu_del_poble, amb les files que la persona de la
--       sessió ha escrit (user_id = auth.uid()) i les columnes que són dades
--       seues, sense user_id (és el compte mateix):
--         · aportacions: id, tipus, refrany_id, pregunta_id, text_aportat,
--           poble_comarca, poble, comarca_id, abast_comarcal, audio_storage_path,
--           audio_mime, durada_segons, mida_bytes, consentiment_arxiu_obert,
--           consentiment_versio, consentiment_acceptat_at, estat_moderacio i
--           created_at (també el camí de l'àudi i el moment del consentiment, que
--           la lectura de l'API no torna però són de la persona: RGPD, art. 15);
--         · vots_isoglosses: id, pregunta_id, variant_clau, paraula_etiqueta,
--           poble, comarca_id, abast_comarcal i created_at.
--       Cap fila d'una altra persona, ni les aprovades i públiques. Del
--       refranyer no n'ix res: no hi ha cap fila de ningú. Null vol dir que la
--       taula no hi és (s'ha desfet la seua migració) i {"error": SQLSTATE}, que
--       l'esquema no casa; la resta de l'exportació continua igual. El client
--       (src/data/supabase/compte.js) la deixa passar tal qual.
--
-- Per què estos límits: un veí de veritat no s'hi acosta mai. El joc té una
-- dotzena de preguntes i un vot per persona i variant; una aportació és una
-- variant escrita o un àudio de 15 s com a molt. 60 en una hora és una cada
-- minut seguida; 500 en un dia i 2000 desades, molt més del que fa la persona
-- més entusiasta. Amb els sostres d'octets de 20261114171500, una fila no passa
-- de 4 KB (aportació) o 2 KB (vot): les files vives que una persona ha creat per
-- l'API en les últimes 24 hores no passen d'uns 2 MB per taula, ni les vives en
-- total d'uns 8 MB, i la seua exportació queda acotada. No és un límit del que es
-- pot escriure: esborrar files torna a fer lloc, i el servidor en queda fora.
--
-- Què NO fa: no crea cap GRANT ni cap política, no toca la RLS, ni les CHECK ni
-- cap fila existent, ni la base privada de l'exportació. No posa cap fusible
-- global de mida (private.fusible_mida_bd de R22.3 només és a notes). Qui ja
-- passa algun sostre (vegeu la consulta d'abans) no pot afegir-ne cap fins que
-- n'esborre o passe la finestra; no se li esborra res. Els missatges SDP-* són
-- en valencià: traduir-los al client és feina de la targeta del joc.
--
-- Abans (lectura): les peces de les quals depén.
--   select to_regprocedure('private.exporta_les_meues_dades_base_r33()') is not null as te_base_exportacio, to_regprocedure('private.peticio_de_servidor()') is not null as te_peticio_de_servidor, to_regclass('public.aportacions_veu_poble') is not null as te_aportacions, to_regclass('public.joc_isoglosses_vots_consens') is not null as te_vots;
-- Abans (lectura): qui ja passa el sostre total (2000) en alguna taula.
--   select (select coalesce(max(z.c), 0) from (select count(*) as c from public.aportacions_veu_poble a group by a.user_id) z) as aportacions_max_per_persona, (select coalesce(max(z.c), 0) from (select count(*) as c from public.joc_isoglosses_vots_consens v group by v.user_id) z) as vots_max_per_persona;
--
-- Verificació posterior (lectura):
--   select t.tgname from pg_catalog.pg_trigger t where not t.tgisinternal and t.tgname in ('aportacions_veu_poble_limita_ritme', 'joc_isoglosses_vots_limita_ritme') order by 1;
--   select position('veu_del_poble' in pg_get_functiondef(to_regprocedure('public.exporta_les_meues_dades()'))) > 0 as exporta_r23, has_function_privilege('authenticated', 'private.aportacions_veu_poble_limita_ritme()', 'execute') as authenticated_executa_quota;
--   (dues files i cert, fals).
--
-- Com tornar enrere (en una transacció, només si cal):
--   drop trigger if exists aportacions_veu_poble_limita_ritme on public.aportacions_veu_poble;
--   drop trigger if exists joc_isoglosses_vots_limita_ritme on public.joc_isoglosses_vots_consens;
--   drop function if exists private.aportacions_veu_poble_limita_ritme();
--   drop function if exists private.joc_isoglosses_vots_limita_ritme();
--   drop index if exists public.idx_joc_isoglosses_vots_user_created;
--   i tornar a aplicar la 2611070600, que torna a crear l'embolcall sense
--   veu_del_poble (la base privada no es toca). Si es torna a aplicar la
--   2611070600 o la 2611011800 per un altre motiu, cal tornar a aplicar esta
--   (ordre_desplegament.json, reaplicacio).
--
-- Transaccional i idempotent: la segona aplicació no canvia res.
-- Provat a tests/r28-rgpd-quotes-r23.test.mjs (PGlite, catàleg complet).
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ---------------------------------------------------------------------------
-- 0 · Precondicions: cap canvi si falta alguna peça.
-- ---------------------------------------------------------------------------
do $r28_precondicions$
declare
  v_qui oid := (select r.oid from pg_catalog.pg_roles r where r.rolname = current_user);
begin
  if to_regprocedure('private.peticio_de_servidor()') is null then
    raise exception 'SDP-R28-001: cal la 20261114000100 (private.peticio_de_servidor); no s''ha canviat res.'
      using errcode = '55000';
  end if;
  if to_regclass('public.aportacions_veu_poble') is null
     or to_regclass('public.joc_isoglosses_vots_consens') is null
     or to_regclass('public.refranys_poble') is null
     or (select count(*) from pg_catalog.pg_attribute a
          where a.attrelid = to_regclass('public.aportacions_veu_poble') and not a.attisdropped
            and a.attname in ('poble', 'comarca_id', 'abast_comarcal')) <> 3 then
    raise exception 'SDP-R28-002: cal aplicar abans les taules R23 (20261113233000 i 20261114023000); no s''ha canviat res.'
      using errcode = '55000';
  end if;
  if not exists (select 1 from pg_catalog.pg_proc p
                  where p.oid = to_regprocedure('private.exporta_les_meues_dades_base_r33()') and p.proowner = v_qui)
     or not exists (select 1 from pg_catalog.pg_proc p
                     where p.oid = to_regprocedure('public.exporta_les_meues_dades()') and p.prosecdef and p.proowner = v_qui) then
    raise exception 'SDP-R28-003: cal la 2611070600 (base privada de l''exportació) i que qui aplica en siga la propietària; no s''ha canviat res.'
      using errcode = '55000';
  end if;
end $r28_precondicions$;

-- ---------------------------------------------------------------------------
-- 1 · public.aportacions_veu_poble: ritme i sostre per persona.
-- ---------------------------------------------------------------------------
create or replace function private.aportacions_veu_poble_limita_ritme()
returns trigger language plpgsql security definer set search_path = ''
as $f$
declare
  c_per_hora constant integer := 60;
  c_per_dia  constant integer := 500;
  c_en_total constant integer := 2000;
  v_jo    uuid := (select auth.uid());
  v_hora  integer;
  v_dia   integer;
  v_total integer;
begin
  -- Fora: el servidor i les sessions sense cap petició de l'API.
  if private.peticio_de_servidor() then return new; end if;
  -- Una altra autoria: la rebutja la RLS d'inserció, i ací no es mira la
  -- quota de ningú més.
  if v_jo is null or new.user_id is distinct from v_jo then return new; end if;
  -- L'hora del servidor: una data del client no trau la fila de la finestra.
  new.created_at := now();
  perform pg_advisory_xact_lock(hashtextextended('sdp:r23:aportacions:' || v_jo::text, 0));
  select count(*) filter (where a.created_at > now() - interval '1 hour'),
         count(*) filter (where a.created_at > now() - interval '24 hours'),
         count(*)
    into v_hora, v_dia, v_total
    from public.aportacions_veu_poble a
   where a.user_id = v_jo;
  if v_total >= c_en_total then
    raise exception 'SDP-VEU-QUOTA: ja tens % aportacions desades i el màxim per persona és %.', v_total, c_en_total
      using errcode = '53400';
  end if;
  if v_hora >= c_per_hora or v_dia >= c_per_dia then
    raise exception 'SDP-VEU-429: has enviat moltes aportacions en poc de temps (com a molt % en una hora i % en un dia); torna-ho a provar més tard.', c_per_hora, c_per_dia
      using errcode = '42900';
  end if;
  return new;
end $f$;
revoke all on function private.aportacions_veu_poble_limita_ritme() from public, anon, authenticated, service_role;
drop trigger if exists aportacions_veu_poble_limita_ritme on public.aportacions_veu_poble;
create trigger aportacions_veu_poble_limita_ritme
  before insert on public.aportacions_veu_poble
  for each row execute function private.aportacions_veu_poble_limita_ritme();

-- ---------------------------------------------------------------------------
-- 2 · public.joc_isoglosses_vots_consens: ritme i sostre per persona.
-- ---------------------------------------------------------------------------
create index if not exists idx_joc_isoglosses_vots_user_created
  on public.joc_isoglosses_vots_consens (user_id, created_at desc);

create or replace function private.joc_isoglosses_vots_limita_ritme()
returns trigger language plpgsql security definer set search_path = ''
as $f$
declare
  c_per_hora constant integer := 60;
  c_per_dia  constant integer := 500;
  c_en_total constant integer := 2000;
  v_jo    uuid := (select auth.uid());
  v_hora  integer;
  v_dia   integer;
  v_total integer;
begin
  -- Fora: el servidor i les sessions sense cap petició de l'API.
  if private.peticio_de_servidor() then return new; end if;
  -- Una altra autoria: la rebutja la RLS d'inserció, i ací no es mira la
  -- quota de ningú més.
  if v_jo is null or new.user_id is distinct from v_jo then return new; end if;
  -- L'hora del servidor: una data del client no trau la fila de la finestra.
  new.created_at := now();
  perform pg_advisory_xact_lock(hashtextextended('sdp:r23:vots:' || v_jo::text, 0));
  -- Un vot repetit no desa res (ON CONFLICT DO NOTHING, o 23505 sense): no compta.
  if exists (select 1 from public.joc_isoglosses_vots_consens v
              where v.user_id = v_jo and v.pregunta_id = new.pregunta_id and v.variant_clau = new.variant_clau) then
    return new;
  end if;
  select count(*) filter (where v.created_at > now() - interval '1 hour'),
         count(*) filter (where v.created_at > now() - interval '24 hours'),
         count(*)
    into v_hora, v_dia, v_total
    from public.joc_isoglosses_vots_consens v
   where v.user_id = v_jo;
  if v_total >= c_en_total then
    raise exception 'SDP-ISOGLOSSES-QUOTA: ja tens % vots desats i el màxim per persona és %.', v_total, c_en_total
      using errcode = '53400';
  end if;
  if v_hora >= c_per_hora or v_dia >= c_per_dia then
    raise exception 'SDP-ISOGLOSSES-429: has votat moltes variants en poc de temps (com a molt % en una hora i % en un dia); torna-ho a provar més tard.', c_per_hora, c_per_dia
      using errcode = '42900';
  end if;
  return new;
end $f$;
revoke all on function private.joc_isoglosses_vots_limita_ritme() from public, anon, authenticated, service_role;
drop trigger if exists joc_isoglosses_vots_limita_ritme on public.joc_isoglosses_vots_consens;
create trigger joc_isoglosses_vots_limita_ritme
  before insert on public.joc_isoglosses_vots_consens
  for each row execute function private.joc_isoglosses_vots_limita_ritme();

-- ---------------------------------------------------------------------------
-- 3 · public.refranys_poble: cap disparador (vegeu la capçalera).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4 · Exportació RGPD: el cos de 2611070600 i les files pròpies de R23.
-- ---------------------------------------------------------------------------
create or replace function public.exporta_les_meues_dades()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); base jsonb; revisions jsonb;
  -- R28 (D-R24.2-5) · Null: la taula no hi és. {"error": SQLSTATE}: l'esquema no casa.
  aportacions jsonb; vots jsonb;
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
  -- R28 (D-R24.2-5) · Només les files que la persona ha escrit i només les
  -- columnes que són dades seues; mai cap fila d'una altra persona.
  if to_regclass('public.aportacions_veu_poble') is not null then
    begin
      select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'tipus',a.tipus,'refrany_id',a.refrany_id,
        'pregunta_id',a.pregunta_id,'text_aportat',a.text_aportat,'poble_comarca',a.poble_comarca,'poble',a.poble,
        'comarca_id',a.comarca_id,'abast_comarcal',a.abast_comarcal,'audio_storage_path',a.audio_storage_path,
        'audio_mime',a.audio_mime,'durada_segons',a.durada_segons,'mida_bytes',a.mida_bytes,
        'consentiment_arxiu_obert',a.consentiment_arxiu_obert,'consentiment_versio',a.consentiment_versio,
        'consentiment_acceptat_at',a.consentiment_acceptat_at,'estat_moderacio',a.estat_moderacio,
        'created_at',a.created_at) order by a.created_at,a.id),'[]'::jsonb)
        into aportacions from public.aportacions_veu_poble a where a.user_id=actor;
    exception when undefined_table or undefined_column or datatype_mismatch then
      aportacions:=jsonb_build_object('error',sqlstate);
    end;
  end if;
  if to_regclass('public.joc_isoglosses_vots_consens') is not null then
    begin
      select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'pregunta_id',v.pregunta_id,'variant_clau',v.variant_clau,
        'paraula_etiqueta',v.paraula_etiqueta,'poble',v.poble,'comarca_id',v.comarca_id,
        'abast_comarcal',v.abast_comarcal,'created_at',v.created_at) order by v.created_at,v.id),'[]'::jsonb)
        into vots from public.joc_isoglosses_vots_consens v where v.user_id=actor;
    exception when undefined_table or undefined_column or datatype_mismatch then
      vots:=jsonb_build_object('error',sqlstate);
    end;
  end if;
  return base||jsonb_build_object('seed_revisions',revisions,
    'veu_del_poble',jsonb_build_object('aportacions',aportacions,'vots_isoglosses',vots));
end;
$$;
revoke all on function public.exporta_les_meues_dades() from public,anon,authenticated,service_role;
grant execute on function public.exporta_les_meues_dades() to authenticated;

notify pgrst, 'reload schema';
commit;
