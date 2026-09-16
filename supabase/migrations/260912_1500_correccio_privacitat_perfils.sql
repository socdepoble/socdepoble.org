-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: CORRECCIÓ DE PRIVACITAT DE PERFILS I ORGANITZACIONS
-- Data: 2026-09-12
-- Motiu: Supressió d'accés anon a dades sensibles i habilitació RLS estricte
-- ═════════════════════════════════════════════════════════════════════

-- 1. Habilitar RLS explícitament (Perplexity / Qwen Audit)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Revocar permisos de lectura globals a anon
REVOKE SELECT ON TABLE public.profiles FROM anon;

-- 3. Arreglar política de lectura per a profiles (només el propi usuari)
DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

-- 4. Supressió de polítiques perilloses d'inserció lliure (Evita bypass OR)
DROP POLICY IF EXISTS "orgs_insert_auth" ON public.organizations;

-- La columna `visibility` existix des de l'esquema inicial. USING (true) la ignorava.
DROP POLICY IF EXISTS "orgs_read_auth" ON public.organizations;
CREATE POLICY "orgs_read_auth" ON public.organizations FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_memberships m
      WHERE m.organization_id = organizations.id
        AND m.user_id = (select auth.uid())
    )
    OR (select private.es_superadmin())
  );
