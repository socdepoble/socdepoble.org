-- ==============================================================================
-- MIGRACIÓ: Vistes i accions del Panell d'Administració (Sóc de Poble)
-- ==============================================================================
-- Aquestes funcions usen SECURITY DEFINER per a saltar-se les polítiques RLS 
-- i operar sobre les taules subjacents (auth.users, organization_claims, etc.) 
-- SEMPRE I QUAN l'usuari que fa la crida siga superadmin local.
-- ==============================================================================

-- 1. admin_list_users()
-- Retorna la llista d'usuaris per al gestor d'usuaris.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT COALESCE((SELECT private.es_superadmin()), FALSE) THEN
    RAISE EXCEPTION 'SDP-ADMIN-001: cal rol de superadmin.' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at
      )
    ), '[]'::json)
    FROM auth.users u
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- 2. admin_list_organizations()
-- Retorna la llista d'empreses/grups per al gestor.
CREATE OR REPLACE FUNCTION public.admin_list_organizations()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT COALESCE((SELECT private.es_superadmin()), FALSE) THEN
    RAISE EXCEPTION 'SDP-ADMIN-002: cal rol de superadmin.' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'kind', o.kind,
        'description', o.description,
        'created_at', o.created_at
      )
    ), '[]'::json)
    FROM public.organizations o
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_organizations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_organizations() TO authenticated;
