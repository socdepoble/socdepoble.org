-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: FIX RLS PROFILES
-- Data: 2026-09-15
-- Motiu: Supressió de using(true) detectada a l'auditoria V3
-- ═════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
