-- =============================================================================
-- SÓC DE POBLE · IDEA-339 · RADIOGRAFIA FORENSE I ADVERSARIAL EN VIU (SUPABASE PRODUCCIÓ)
-- Execució 100 % READ-ONLY i ZERO EXPOSICIÓ DE PII (cap email, telèfon, token ni missatge privat).
-- Dissenyat per executar-se al SQL Editor de Producció immediatament després de les migracions 127→131.
-- Retorna un únic document JSON estructurat amb els 7 ràdars complets per a l'auditoria creuada
-- entre Claude Opus 5.5 + IAIA MarIA + Codex GPT-6.1 + les 8 Escoles del Node 0.
-- =============================================================================

BEGIN READ ONLY;
SET LOCAL statement_timeout = '30s';

WITH
-- 1. Inventari complet de taules i vistes exposades: mides, files vives/mortes, RLS i security_invoker
r1_taules_i_vistes AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS object_name,
    c.relkind AS kind, -- 'r'=table, 'p'=partitioned, 'v'=view, 'm'=matview
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    COALESCE(c.reloptions, ARRAY[]::text[]) AS reloptions,
    pg_total_relation_size(c.oid) AS total_bytes,
    COALESCE(st.n_live_tup, c.reltuples::bigint) AS approx_live_rows,
    COALESCE(st.n_dead_tup, 0) AS dead_tuples,
    COALESCE(st.seq_scan, 0) AS seq_scans,
    COALESCE(st.idx_scan, 0) AS idx_scans,
    st.last_autovacuum,
    has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
    has_table_privilege('anon', c.oid, 'INSERT') AS anon_insert,
    has_table_privilege('anon', c.oid, 'UPDATE') AS anon_update,
    has_table_privilege('anon', c.oid, 'DELETE') AS anon_delete,
    has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select,
    has_table_privilege('authenticated', c.oid, 'INSERT') AS auth_insert,
    has_table_privilege('authenticated', c.oid, 'UPDATE') AS auth_update,
    has_table_privilege('authenticated', c.oid, 'DELETE') AS auth_delete
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_user_tables st ON st.relid = c.oid
  WHERE n.nspname IN ('public', 'private', 'storage')
    AND c.relkind IN ('r', 'p', 'v', 'm')
  ORDER BY n.nspname, c.relname
),

-- 2. Auditoria adversarial de polítiques RLS (antipatrons Supabase: auth.role(), user_metadata, UPDATE sense WITH CHECK, SELECT true)
r2_politiques_rls_sospitoses AS (
  SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN COALESCE(qual, '') ILIKE '%auth.role()%' OR COALESCE(with_check, '') ILIKE '%auth.role()%' THEN 'deprecated_auth_role' END,
      CASE WHEN COALESCE(qual, '') ILIKE '%user_metadata%' OR COALESCE(with_check, '') ILIKE '%user_metadata%'
             OR COALESCE(qual, '') ILIKE '%raw_user_meta_data%' OR COALESCE(with_check, '') ILIKE '%raw_user_meta_data%' THEN 'unsafe_user_metadata_claim' END,
      CASE WHEN cmd = 'UPDATE' AND (with_check IS NULL OR btrim(with_check) = '') THEN 'update_missing_with_check' END,
      CASE WHEN cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE') AND COALESCE(qual, '') = 'true' THEN 'unrestricted_write_qual_true' END,
      CASE WHEN schemaname = 'storage' AND tablename = 'objects' AND cmd = 'SELECT' AND ('anon' = ANY(roles) OR 'public' = ANY(roles)) THEN 'storage_anon_enumeration_risk' END
    ], NULL) AS alertes
  FROM pg_policies
  WHERE schemaname IN ('public', 'private', 'storage')
),

-- 3. Funcions SECURITY DEFINER: exposició a PUBLIC/anon i absència de search_path fixat
r3_security_definers AS (
  SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS args,
    p.prosecdef AS is_security_definer,
    p.provolatile AS volatility,
    COALESCE(p.proconfig, ARRAY[]::text[]) AS proconfig,
    NOT EXISTS (
      SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
      WHERE cfg LIKE 'search_path=%'
    ) AS missing_search_path,
    has_function_privilege('public', p.oid, 'EXECUTE') AS public_execute,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_execute
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private')
    AND p.prosecdef = true
  ORDER BY n.nspname, p.proname
),

-- 4. Privilegis de columna per a 'anon' en taules sensibles (verificació de privacitat per columna)
r4_columnes_exposades_anon AS (
  SELECT
    table_schema,
    table_name,
    column_name,
    string_agg(privilege_type, ',' ORDER BY privilege_type) AS anon_privileges
  FROM information_schema.column_privileges
  WHERE grantee IN ('anon', 'PUBLIC')
    AND table_schema = 'public'
    AND table_name IN ('profiles', 'organizations', 'notes', 'consentiments', 'xat_fils', 'xat_missatges', 'xat_participants')
  GROUP BY table_schema, table_name, column_name
  ORDER BY table_name, column_name
),

-- 5. Claus foranes (FOREIGN KEY) sense índex de suport en les columnes origen (risc de bloquejos i lentitud RLS)
r5_fk_sense_index AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    con.conname AS constraint_name,
    ARRAY(
      SELECT a.attname
      FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
      ORDER BY k.ord
    ) AS fk_columns,
    confrelid::regclass::text AS referenced_table
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE con.contype = 'f'
    AND n.nspname IN ('public', 'private')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_index i
      WHERE i.indrelid = con.conrelid
        AND i.indisvalid
        AND (i.indkey::smallint[])[0:cardinality(con.conkey)-1] = con.conkey
    )
  ORDER BY n.nspname, c.relname, con.conname
),

-- 6. Triggers desactivats i estat de pg_cron (si l'extensió existeix)
r6_triggers_desactivats AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    t.tgname AS trigger_name,
    t.tgenabled AS enabled_flag
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND n.nspname IN ('public', 'private', 'auth', 'storage')
    AND t.tgenabled = 'D'
),

-- 7. Salut de Storage i agregats d'integritat estructural sobre dades reals (ZERO PII!)
r7_storage_resum AS (
  SELECT
    b.id AS bucket_id,
    b.public AS is_public,
    b.file_size_limit,
    b.allowed_mime_types,
    COUNT(o.id) AS total_objects,
    COALESCE(SUM(NULLIF(o.metadata->>'size', '')::bigint), 0) AS total_metadata_bytes,
    COUNT(*) FILTER (WHERE o.owner_id IS NULL AND o.owner IS NULL) AS orphan_ownerless_objects
  FROM storage.buckets b
  LEFT JOIN storage.objects o ON o.bucket_id = b.id
  GROUP BY b.id, b.public, b.file_size_limit, b.allowed_mime_types
  ORDER BY b.id
),

r8_integritat_dades_agregada AS (
  SELECT jsonb_build_object(
    'auth_users_total', (SELECT COUNT(*) FROM auth.users),
    'profiles_total', (SELECT COUNT(*) FROM public.profiles),
    'auth_sense_profile', (
      SELECT COUNT(*) FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      WHERE p.id IS NULL
    ),
    'profiles_sense_auth', (
      SELECT COUNT(*) FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE u.id IS NULL
    ),
    'organizations_total', (SELECT COUNT(*) FROM public.organizations),
    'notes_total', (SELECT COUNT(*) FROM public.notes),
    'xat_fils_total', (SELECT COUNT(*) FROM public.xat_fils),
    'xat_missatges_total', (SELECT COUNT(*) FROM public.xat_missatges),
    'xat_fils_sense_participants', (
      SELECT COUNT(*) FROM public.xat_fils f
      LEFT JOIN public.xat_participants xp ON xp.fil_id = f.id
      WHERE xp.fil_id IS NULL
    )
  ) AS resum
)

SELECT jsonb_pretty(jsonb_build_object(
  'generated_at_utc', now(),
  'postgres_version', version(),
  'r1_taules_sense_rls_en_public', (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM r1_taules_i_vistes t
    WHERE t.schema_name = 'public' AND t.kind IN ('r', 'p') AND NOT t.rls_enabled
  ),
  'r1_vistes_sense_security_invoker', (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM r1_taules_i_vistes t
    WHERE t.schema_name = 'public' AND t.kind = 'v'
      AND NOT ('security_invoker=true' = ANY(t.reloptions) OR 'security_invoker=on' = ANY(t.reloptions))
  ),
  'r1_inventari_taules_mides_i_files', (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM r1_taules_i_vistes t
  ),
  'r2_alertes_politiques_rls', (
    SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]'::jsonb)
    FROM r2_politiques_rls_sospitoses p
    WHERE cardinality(p.alertes) > 0
  ),
  'r2_total_politiques_auditades', (SELECT COUNT(*) FROM r2_politiques_rls_sospitoses),
  'r3_security_definers_amb_alerta', (
    SELECT COALESCE(jsonb_agg(row_to_json(f)), '[]'::jsonb)
    FROM r3_security_definers f
    WHERE f.missing_search_path OR f.anon_execute OR f.public_execute
  ),
  'r3_total_security_definers', (SELECT COUNT(*) FROM r3_security_definers),
  'r4_columnes_exposades_anon', (
    SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb) FROM r4_columnes_exposades_anon c
  ),
  'r5_fk_sense_index', (
    SELECT COALESCE(jsonb_agg(row_to_json(fk)), '[]'::jsonb) FROM r5_fk_sense_index fk
  ),
  'r6_triggers_desactivats', (
    SELECT COALESCE(jsonb_agg(row_to_json(tg)), '[]'::jsonb) FROM r6_triggers_desactivats tg
  ),
  'r7_storage_buckets_salut', (
    SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb) FROM r7_storage_resum s
  ),
  'r8_integritat_dades_agregada', (SELECT resum FROM r8_integritat_dades_agregada)
)) AS radiografia_adversarial_produccio;

ROLLBACK;
