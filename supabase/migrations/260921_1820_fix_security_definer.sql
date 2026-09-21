-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ: FIX SECURITY DEFINER VIEW
-- Data: 2026-09-21
-- Motiu: Supabase Security Advisor llança un avís de "Security Definer View"
--        per a public.organization_directory. Encara que el codi inicial ho 
--        contemplava, assegurem-nos de forçar-ho explícitament a l'entorn remot.
-- ═════════════════════════════════════════════════════════════════════

alter view public.organization_directory set (security_invoker = true, security_barrier = true);
