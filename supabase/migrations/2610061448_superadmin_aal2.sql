-- Enforce AAL2 (2FA) for superadmin privileges
create or replace function private.es_superadmin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_platform_roles r
    where r.user_id = (select auth.uid()) 
      and r.role = 'superadmin'
      and (select auth.jwt() ->> 'aal') = 'aal2'
  );
$$;
