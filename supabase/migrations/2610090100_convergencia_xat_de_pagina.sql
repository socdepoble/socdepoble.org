-- ============================================================================
-- 261009_0100 · F6 (Onada 5) · Convergència del xat de pàgina
-- Error real vist pel Mestre al node remot: POST /rest/v1/rpc/obri_fil_de_pagina
-- → 404 (PGRST202). El client envia p_tenant_id, p_tipus, p_id i p_titol
-- (src/data/supabase/xat.js), els noms de l'única signatura que ha definit
-- mai este directori: public.obri_fil_de_pagina(uuid, text, text, text default
-- null), de 2609282100. Per què: el node no té la cadena 2609270200 (F0) →
-- 2609272200 (xat_entitats) → 2609282100 (xat de pàgina) → 2610042330
-- (/iaia), totes declarades NO aplicades. És una INFERÈNCIA ben fonamentada:
-- el repositori no registra l'estat de cap base, i el lot
-- wordpress-plugin/builds/migracions_pendents.sql pot haver quedat a mitges.
--
-- No crea ni redefinix la funció: la vigent és la de 2609282100, i
-- private.xat_subjecte la de 2610042330. Una còpia ací en faria dues fonts, i
-- sobre una base sense F0 es crearia igual i petaria a cada crida en lloc de
-- l'avís honest 'sense-capacitat' del client.
--   1. Si falta alguna dependència de la RPC (columnes i funcions de
--      2609080000, 2609261200, 2609270200, 2609272200 i 2609282100), avorta
--      sencera amb SDP-CONV-004 i la llista del que falta, amb la migració
--      que ho crea.
--   2. Si falta la canònica, o no és security definer amb search_path buit,
--      avorta amb SDP-CONV-005: cal aplicar 2609282100.
--   3. Si falta el CHECK xat_fils_pagina_iaia_canonica, avorta amb
--      SDP-CONV-007: cal aplicar 2610042330. Van juntes: el client envia
--      '/iaia' i 2609282100 sola només coneix '/ia' (la fila de la IAIA
--      passaria del 404 a SDP-XAT-013).
--   4. Esborra, sense CASCADE, tota altra sobrecàrrega de
--      public.obri_fil_de_pagina (prokind = 'f'), i ho avisa SDP-CONV-006: dos
--      candidats serien PGRST203. Si algun objecte en depén, el drop falla i
--      la transacció sencera es desfà.
--   5. Torna a donar els permisos de 2609282100 (revoke de public i anon,
--      grant a authenticated) i recarrega l'esquema de PostgREST.
--
-- Cap taula, columna, política ni funció nova; cap permís retirat fora dels
-- de 2609282100. Idempotent: una segona execució no canvia res.
--
-- Revisada i NO aplicada a cap base de dades. L'aplica el Mestre, mai un
-- agent. S'aplica DESPRÉS de les pendents del supabase/README.md, en ordre
-- alfabètic (com a mínim la cadena 2609270200 → 2610042330), i no en
-- substituïx cap. MODERACIÓ: aplicar eixa cadena obri els fils de pàgina a
-- tot el poble sense la moderació que 2609282100 posa com a condició prèvia;
-- és una decisió del Mestre.
-- Abans d'aplicar-la, executeu a l'editor SQL estes cinc consultes de només
-- lectura i guardeu-ne el resultat:
--   1. Les versions de la RPC (buit confirma la inferència; una de cinc
--      arguments, amb p_ruta, és l'esborrany que el pas 4 esborra):
--      select oid::regprocedure, prosecdef, proconfig from pg_catalog.pg_proc
--       where proname = 'obri_fil_de_pagina' and pronamespace = 'public'::regnamespace;
--   2. Les migracions registrades, si la taula existix:
--      select version from supabase_migrations.schema_migrations order by 1;
--   3. Les columnes de xat_fils (ultim_seq, comunitat_id, interlocutor_id i
--      subjecte_tipus diuen quines de la cadena hi són):
--      select column_name from information_schema.columns
--       where table_schema = 'public' and table_name = 'xat_fils' order by ordinal_position;
--   4. Si authenticated pot executar les RPC del xat:
--      select p.oid::regprocedure, has_function_privilege('authenticated', p.oid, 'execute')
--        from pg_catalog.pg_proc p
--       where p.proname in ('obri_fil_de_pagina', 'xat_historial', 'xat_envia', 'xat_fils_meus');
--   5. Si 2610042330 hi és:
--      select conname from pg_catalog.pg_constraint where conname = 'xat_fils_pagina_iaia_canonica';
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Dependències de la RPC ──────────────────────────────────────────────
-- Les columnes i funcions que obri_fil_de_pagina i les seues privades usen,
-- amb la primera migració que les crea. Una funció plpgsql es crea encara que
-- li falten, i cada crida petaria en temps d'execució: per això es comproven.
do $$
declare
  v_falta text[] := '{}';
  c record;
begin
  for c in
    select * from (values
      ('towns', 'slug', '2609080000'),
      ('organizations', 'logo_url', '2609261200'),
      ('xat_fils', 'ultim_seq', '2609270200'),
      ('xat_fils', 'comunitat_id', '2609270200'),
      ('xat_fils', 'org_id', '2609270200'),
      ('xat_participants', 'rol', '2609270200'),
      ('xat_participants', 'visible_fins_seq', '2609270200'),
      ('xat_participants', 'com_org_id', '2609270200'),
      ('xat_fils', 'interlocutor_id', '2609272200'),
      ('xat_fils', 'subjecte_tipus', '2609282100')
    ) as t (taula, columna, migracio)
  loop
    if not exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = c.taula and column_name = c.columna) then
      v_falta := v_falta || format('public.%s.%s (%s)', c.taula, c.columna, c.migracio);
    end if;
  end loop;
  if to_regclass('private.ajustos') is null then
    v_falta := v_falta || 'private.ajustos (2609080000)'::text;
  end if;
  if to_regprocedure('private.is_town_member(uuid)') is null then
    v_falta := v_falta || 'private.is_town_member (2609080000)'::text;
  end if;
  if to_regprocedure('private.is_organization_member(uuid)') is null then
    v_falta := v_falta || 'private.is_organization_member (2609080000)'::text;
  end if;
  if to_regprocedure('private.xat_participant_vigent(uuid, uuid)') is null then
    v_falta := v_falta || 'private.xat_participant_vigent (2609272200)'::text;
  end if;
  if to_regprocedure('private.xat_subjecte(uuid, text, text)') is null then
    v_falta := v_falta || 'private.xat_subjecte (2609282100)'::text;
  end if;
  if to_regprocedure('private.xat_fil_del_subjecte(uuid, text, uuid, text, uuid, text, text, text, text, text)') is null then
    v_falta := v_falta || 'private.xat_fil_del_subjecte (2609282100)'::text;
  end if;
  if cardinality(v_falta) > 0 then
    raise exception 'SDP-CONV-004: falten dependències del xat de pàgina: %. Apliqueu abans les pendents en ordre alfabètic.',
      array_to_string(v_falta, ', ');
  end if;
end
$$;

-- ── 2, 3 i 4 · La canònica, la correcció /iaia i una sola obri_fil_de_pagina ─
-- La canònica es busca per la signatura exacta. search_path buit es guarda a
-- proconfig com a search_path="". Només funcions (prokind = 'f'): drop
-- function no esborra un procediment ni un agregat amb el mateix nom.
do $$
declare
  v_canonica regprocedure := to_regprocedure('public.obri_fil_de_pagina(uuid, text, text, text)');
  v_sobrecarrega record;
begin
  if v_canonica is null or not exists (
      select 1 from pg_catalog.pg_proc p
      where p.oid = v_canonica::oid and p.prosecdef
        and 'search_path=""' = any (coalesce(p.proconfig, '{}'::text[]))) then
    raise exception 'SDP-CONV-005: falta public.obri_fil_de_pagina(uuid, text, text, text) de 2609282100 (security definer, search_path buit); cal aplicar 2609282100.';
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint
                 where conrelid = 'public.xat_fils'::regclass and conname = 'xat_fils_pagina_iaia_canonica') then
    raise exception 'SDP-CONV-007: falta el CHECK xat_fils_pagina_iaia_canonica: private.xat_subjecte encara no coneix /iaia; cal aplicar 2610042330.';
  end if;
  for v_sobrecarrega in
    select p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'obri_fil_de_pagina' and p.prokind = 'f'
      and p.oid <> v_canonica::oid
  loop
    raise notice 'SDP-CONV-006: public.obri_fil_de_pagina(%) no és la canònica i s''esborra.', v_sobrecarrega.arguments;
    execute format('drop function public.%I(%s)', v_sobrecarrega.proname, v_sobrecarrega.arguments);
  end loop;
end
$$;

-- ── 5 · Els permisos de 2609282100 ──────────────────────────────────────────
revoke execute on function public.obri_fil_de_pagina(uuid, text, text, text) from public, anon;
grant execute on function public.obri_fil_de_pagina(uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
