-- ============================================================================
-- 261004_2350 · F1 · Convergència: profiles.is_public, permisos de columna de
-- la fitxa i una sola public.create_organization
-- Ordre del Mestre, 261004 (pla 2045, Marató 2230; front F1). Tres errors
-- reals que el Mestre ha vist contra la seua base de dades:
--   · Visibilitat de la fitxa: PGRST204, «Could not find the 'is_public'
--     column of 'profiles'».
--   · Avatar i Subtítol: «no tens permís per a canviar este camp», la frase
--     amb què el client traduïa qualsevol 403 o 42501. Que siga un 42501 de
--     PostgREST (el PATCH de profiles sense el permís d'UPDATE de la columna)
--     és una INFERÈNCIA: també podria ser un 403 de GoTrue al PUT de
--     /auth/v1/user, que va just després del PATCH quan es desa la foto o la
--     bio. Es confirma a la pestanya Xarxa del navegador, amb la ruta de la
--     petició rebutjada i el cos de la resposta. Si és el PUT de GoTrue, esta
--     migració no el cura.
--   · Nova organització: PGRST203 (HTTP 300), «Could not choose the best
--     candidate function».
-- Per què: la base està desfasada respecte d'este directori. Va nàixer d'un
-- esquema anterior (l'antic supabase/schema.sql, ja retirat) i només s'hi han
-- aplicat algunes migracions numerades. La columna is_public i el permís
-- d'UPDATE d'avatar_url, town_name, bio i is_public només els dona
-- 2609110600; la segona create_organization (molt probablement la de 6
-- arguments, sense p_lema) no l'ha creada cap fitxer d'este directori, que
-- sempre definix la mateixa signatura de 7. És una INFERÈNCIA ben fonamentada:
-- el repositori no registra l'estat de cap base.
--
--   1. public.profiles.is_public: boolean default false, idèntica a
--      2609110600. Si ja existix, no es toca.
--   2. Permís d'UPDATE, per a authenticated, de cada columna que el client
--      escriu a la fitxa (CAMPS_PERFIL de src/data/supabase/auth.js), només
--      si la columna existix (information_schema). Si en falta alguna, ho
--      avisa SDP-CONV-001 i continua: la crea la seua migració pendent, que
--      també en dona el permís. És exactament la unió dels permisos de
--      columna que ja donen 2609080000, 2609110600, 2609261500, 2609262232 i
--      2609282035: cap altra columna no en rep.
--   3. Una sola public.create_organization. Es conserva la canònica,
--      (uuid, text, text, text, text, text, uuid), la de 2609080000,
--      2609160600 i 2609281500, i s'esborra qualsevol altra sobrecàrrega,
--      sense CASCADE (SDP-CONV-003 en diu la signatura). Si la canònica no hi
--      és, la migració avorta sencera amb SDP-CONV-002 i la base es queda com
--      estava. La funció no es redefinix: la vigent és la de 2609281500, i
--      src/data/limitsText.test.js en vigila el retall del lema.
--
-- Cap política, vista, taula ni funció nova; cap permís retirat. No repetix
-- 2609110600: la seua política de lectura de profiles obria el padró sencer,
-- i 2609121500, 2609150000 i 2609160600 la tornen a tancar. Idempotent: una
-- segona execució no canvia res.
--
-- Revisada i NO aplicada a cap base de dades. L'aplica el Mestre o Sollutia,
-- mai un agent. S'aplica DESPRÉS de les pendents del supabase/README.md, en
-- ordre alfabètic, i ABANS de publicar el client. No en substituïx cap.
-- Abans d'aplicar-la, executeu a l'editor SQL estes quatre consultes de només
-- lectura i guardeu-ne el resultat (el drop del pas 3 depén de la primera):
--   1. Les versions de create_organization (n'hi hauria d'haver una):
--      select oid::regprocedure from pg_catalog.pg_proc
--       where proname = 'create_organization' and pronamespace = 'public'::regnamespace;
--   2. Les columnes de profiles:
--      select column_name from information_schema.columns
--       where table_schema = 'public' and table_name = 'profiles' order by ordinal_position;
--   3. Els permisos de columna d'authenticated sobre profiles:
--      select column_name, privilege_type from information_schema.column_privileges
--       where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated';
--   4. Les migracions registrades, si la taula existix:
--      select version from supabase_migrations.schema_migrations order by 1;
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Columna ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_public boolean default false;

-- ── 2 · Permisos de columna de la fitxa ─────────────────────────────────────
-- La mateixa llista, en el mateix ordre, que CAMPS_PERFIL (auth.js):
-- tests/migracio-convergencia-perfil.test.mjs les contrasta.
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
      raise notice 'SDP-CONV-001: public.profiles no té la columna %; es deixa sense permís.', v_columna;
    end if;
  end loop;
end
$$;

-- ── 3 · Una sola create_organization ────────────────────────────────────────
-- Es busca pel catàleg perquè no en sabem la signatura estrangera: el
-- missatge PGRST203 arriba tallat. Només funcions (prokind = 'f'): drop
-- function no esborra un procediment ('p') ni un agregat ('a') amb el mateix
-- nom, i l'intent faria fallar la migració sencera. Sense CASCADE: si algun
-- objecte en depén, el drop falla i la transacció sencera es desfà.
do $$
declare
  v_canonica regprocedure := to_regprocedure('public.create_organization(uuid, text, text, text, text, text, uuid)');
  v_sobrecarrega record;
begin
  if v_canonica is null then
    raise exception 'SDP-CONV-002: falta public.create_organization(uuid, text, text, text, text, text, uuid); cal aplicar abans 2609160600 i 2609281500.';
  end if;
  for v_sobrecarrega in
    select p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'create_organization' and p.prokind = 'f'
      and p.oid <> v_canonica::oid
  loop
    raise notice 'SDP-CONV-003: public.create_organization(%) no és la canònica i s''esborra.', v_sobrecarrega.arguments;
    execute format('drop function public.%I(%s)', v_sobrecarrega.proname, v_sobrecarrega.arguments);
  end loop;
end
$$;

notify pgrst, 'reload schema';
commit;
