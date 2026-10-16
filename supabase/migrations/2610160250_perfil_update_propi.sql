-- ============================================================================
-- 261016_0250 · Onada 1.1 · Bloc 3.5.3 · El 403 del PATCH de profiles:
-- permisos de columna de la fitxa i una sola política d'UPDATE propi
-- Ordre del Mestre (261016, Gauntlet nocturn; pla
-- 261016_0015_pla_implementacio_gauntlet_autonom.md, Onada 1.1 §3; prompt
-- 261016_0015, Bloc 3.5.3). Error real a producció (gentdelatorre.net) en
-- publicar la fitxa o desar-ne un camp:
--   PATCH /rest/v1/profiles?id=eq.<uid> → 403, code 42501,
--   «permission denied for table profiles».
--
-- PER QUÈ ÉS DE PRIVILEGIS I NO DE RLS (auditoria Codex 261016_0021, relleus
-- 02:28 i 02:32):
--   · Postgres comprova els permisos de taula i de columna ABANS de mirar cap
--     política. Si un sol camp del cos del PATCH no té permís d'UPDATE de
--     columna per a authenticated, cau la sentència sencera amb «permission
--     denied for table profiles»: el missatge nomena la taula, no la columna.
--     El client només envia camps de CAMPS_PERFIL (src/data/supabase/auth.js),
--     amb Prefer: return=representation: també cal llegir les columnes que
--     torna, i això ja ho dona el SELECT de taula d'authenticated (2609080000).
--   · Un rebuig de RLS no dona eixe missatge. El WITH CHECK diu «new row
--     violates row-level security policy for table "profiles"», i el USING
--     (o l'absència de cap política d'UPDATE) filtra la fila: el PATCH torna
--     200 amb zero files, sense error.
--   · PostgREST respon 403 a un 42501 quan el JWT és vàlid (401 si és
--     anònim): la petició anava amb sessió.
--   Per això la política sola de l'ordre («CREATE POLICY "Users can update
--   own profile" … FOR UPDATE TO authenticated») no cura este error: el que
--   falta és el permís de columna. 2609110600 i 2610042350 ja el donen, però
--   la base de producció està desfasada respecte d'este directori (2610042350
--   ho documenta) i cap de les dues es torna a executar a cegues: 2609110600
--   obri la lectura del padró sencer (using (true) per a anon), i 2610042350
--   esborra sobrecàrregues de create_organization, fora d'esta reparació.
--
-- QUÈ FA (només public.profiles):
--   0. Guarda: si la taula no hi és o no té RLS activa, avorta sencera
--      (SDP-PERFIL-020) i la base es queda com estava. Un permís d'UPDATE
--      sense RLS deixaria qualsevol sessió escriure la fitxa d'una altra.
--   1. Permís d'UPDATE, per a authenticated, de cada columna de CAMPS_PERFIL
--      que existix, en el mateix ordre que el client. La que falta l'avisa
--      SDP-PERFIL-021 i continua: la crea la seua migració, que també en dona
--      el permís. Cap altra columna: ni id, ni baixa_demanada_at, ni
--      consentiment_rgpd_at, ni res de rols.
--   2. Una sola política permissiva d'UPDATE propi, «profiles update own», el
--      nom de 2609080000 i 2609110600, amb la condició de l'ordre:
--      auth.uid() = id al USING i al WITH CHECK, en la forma (select
--      auth.uid()) de 2609160600 (s'avalua una vegada per sentència, no per
--      fila). Es torna a crear sencera (drop if exists i create) i, si algú ja
--      ha executat a mà la de l'ordre amb el nom «Users can update own
--      profile», també s'esborra: dues permissives equivalents s'unixen amb
--      OR, i un canvi futur en una no tancaria l'altra. La restrictiva
--      «profiles sense baixa» (2609261500) no es toca i continua congelant la
--      fitxa en quarantena.
--   3. Diagnòstic, sense cap canvi: SDP-PERFIL-022 si authenticated no pot
--      llegir alguna columna (el RETURNING del PATCH continuaria caient amb
--      42501: es revisa a part, sense obrir el padró) i SDP-PERFIL-023 si
--      queda una altra política permissiva d'UPDATE o ALL (s'uniria amb OR a
--      la pròpia).
--
-- Fora d'abast: cap lectura (ni el SELECT de taula, ni «profiles read own»,
-- ni anon), cap dada, columna, restricció, funció, vista, rol ni
-- create_organization; cap permís retirat. Idempotent: una segona execució no
-- canvia res.
--
-- Revisada i NO aplicada a cap base de dades. L'aplica el Mestre, mai un
-- agent, DESPRÉS de les pendents del supabase/README.md, en ordre alfabètic.
-- No espera cap client nou: el publicat ja envia estos camps.
-- Abans d'aplicar-la, executeu a l'editor SQL estes quatre consultes de només
-- lectura i guardeu-ne el resultat (és el que permet desfer-la):
--   1. La RLS de la taula:
--      select relrowsecurity, relforcerowsecurity from pg_catalog.pg_class
--       where oid = 'public.profiles'::regclass;
--   2. Les polítiques de profiles, amb la definició:
--      select policyname, permissive, roles, cmd, qual, with_check from pg_catalog.pg_policies
--       where schemaname = 'public' and tablename = 'profiles' order by policyname;
--   3. Els permisos de columna d'authenticated sobre profiles:
--      select column_name, privilege_type from information_schema.column_privileges
--       where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated';
--   4. Les migracions registrades, si la taula existix:
--      select version from supabase_migrations.schema_migrations order by 1;
-- Per a desfer-la: el permís d'UPDATE es retira només de les columnes que la
-- consulta 3 no tenia, i les polítiques es tornen a crear amb la definició
-- que mostrava la consulta 2. Mai cap retirada de la taula sencera.
-- Després, la prova que val és una sessió real: la fitxa pròpia es publica i
-- el PATCH torna una fila; la d'una altra persona no canvia; una baixa
-- pendent continua sense poder-se editar.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · Guarda: la taula i la RLS ───────────────────────────────────────────
do $$
begin
  if pg_catalog.to_regclass('public.profiles') is null then
    raise exception 'SDP-PERFIL-020: falta public.profiles; no es concedix cap permís.';
  end if;
  if not exists (select 1 from pg_catalog.pg_class
                 where oid = pg_catalog.to_regclass('public.profiles') and relrowsecurity) then
    raise exception 'SDP-PERFIL-020: public.profiles no té la RLS activa; no es concedix cap permís.';
  end if;
end
$$;

-- ── 1 · Permisos de columna de la fitxa ─────────────────────────────────────
-- La mateixa llista, en el mateix ordre, que CAMPS_PERFIL (auth.js):
-- src/data/supabase/perfilUpdatePropi.migracio.test.js les contrasta.
do $$
declare
  v_columna text;
begin
  foreach v_columna in array array['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public',
                                   'lema', 'presentacio_html', 'hero_url', 'copyright', 'icon'] loop
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'profiles' and column_name = v_columna) then
      execute format('grant update (%I) on table public.profiles to authenticated', v_columna);
    else
      raise notice 'SDP-PERFIL-021: public.profiles no té la columna %; es deixa sense permís.', v_columna;
    end if;
  end loop;
end
$$;

-- ── 2 · Una sola política d'UPDATE propi ────────────────────────────────────
-- Primer el nom de l'ordre, per si s'ha executat a mà; després la canònica,
-- sencera. Dins de la transacció: no hi ha cap instant sense política.
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- ── 3 · Diagnòstic, sense cap canvi ─────────────────────────────────────────
do $$
declare
  v_sense_lectura text;
  v_altres text;
begin
  select pg_catalog.string_agg(a.attname, ', ' order by a.attnum) into v_sense_lectura
  from pg_catalog.pg_attribute a
  where a.attrelid = pg_catalog.to_regclass('public.profiles') and a.attnum > 0 and not a.attisdropped
    and not pg_catalog.has_column_privilege('authenticated', a.attrelid, a.attnum, 'SELECT');
  if v_sense_lectura is not null then
    raise warning 'SDP-PERFIL-022: authenticated no pot llegir % de public.profiles; el PATCH amb return=representation continuarà caient amb 42501. Es revisa a part, sense obrir el padró.', v_sense_lectura;
  end if;

  select pg_catalog.string_agg(p.polname, ', ' order by p.polname) into v_altres
  from pg_catalog.pg_policy p
  where p.polrelid = pg_catalog.to_regclass('public.profiles') and p.polpermissive
    and p.polcmd in ('w', '*') and p.polname <> 'profiles update own';
  if v_altres is not null then
    raise notice 'SDP-PERFIL-023: altres polítiques permissives d''UPDATE o ALL a public.profiles (%): s''unixen amb OR a la pròpia; reviseu-les.', v_altres;
  end if;
end
$$;

notify pgrst, 'reload schema';
commit;
