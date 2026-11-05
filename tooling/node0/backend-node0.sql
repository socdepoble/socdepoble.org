-- Node 0 canonical backend grants. Run only as the dedicated database owner.
-- Supabase's default table grants are not part of the copied application SQL.
-- Add only the explicitly needed town ID SELECT; retain canonical RLS.
BEGIN;
DO $node0_backend_guard$ BEGIN
  IF current_database() NOT IN ('socdepoble_node0','node0_gauntlet_r4') OR
     to_regclass('node0.schema_migrations') IS NULL OR
     (SELECT count(*) FROM node0.schema_migrations)<75 OR
     NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relname='towns' AND c.relrowsecurity) OR
     NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relname='section_submissions' AND c.relrowsecurity) THEN
    RAISE EXCEPTION 'node0_backend_dedicated_database_required';
  END IF;
END $node0_backend_guard$;
GRANT SELECT(id) ON public.towns TO authenticated;
GRANT SELECT(id,tenant_id,owner_user_id,author_org_id,section_id,title,description,payload,created_at,updated_at)
  ON public.section_submissions TO authenticated;
GRANT INSERT(id,tenant_id,owner_user_id,author_org_id,section_id,title,description,payload)
  ON public.section_submissions TO authenticated;
GRANT UPDATE(author_org_id,section_id,title,description,payload)
  ON public.section_submissions TO authenticated;
COMMIT;
