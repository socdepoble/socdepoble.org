-- ============================================================================
-- 261021_1715 · P0-01 · Revocació cap avant del correu privat de les organitzacions
-- Sóc de Poble (P0-01 del Llibre Mestre; auditoria de Claude 261021_1645)
--
-- QUÈ FA:
--   Repetix, en una migració nova, el REVOKE que 2610181915 porta des del
--   20-10-2026: cap SELECT de `contact_email` per a public, anon ni
--   authenticated. La primera versió de 2610181915 el donava a anon i
--   authenticated, i el REVOKE s'hi va afegir dins del mateix fitxer. Si eixa
--   versió ja consta a supabase_migrations.schema_migrations, l'eina de
--   migracions no la torna a executar i el correu continuaria obert a anon;
--   esta, amb versió nova, sí que s'executa. No dona cap permís.
--
-- ORDRE: va després de 2610181915 (necessita la columna; sense la columna,
--   falla i no canvia res). Idempotent: on el REVOKE ja hi és, no canvia res.
--   NO aplicada: l'aplica el Mestre, mai un agent.
--
-- CONSULTA DE LECTURA PRÈVIA (el resultat s'ha de guardar):
--   select r.rolname, has_column_privilege(r.rolname, 'public.organizations', 'contact_email', 'select')
--     from (values ('anon'), ('authenticated')) as r(rolname);
--   Després d'aplicar-la, les dues files han de tornar false.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke select (contact_email) on table public.organizations from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
