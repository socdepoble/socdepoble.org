-- La RPC i la RLS han d'exigir la mateixa empresa mare per a un grup.
-- Abans el helper acceptava NULL, però l'INSERT el rebutjava amb un 403 opac.
-- No s'amplien permisos: es conserva la frontera de poble, tipus i owner/admin.
begin;

create or replace function private.can_create_group(
  p_parent_organization_id uuid,
  p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and p_parent_organization_id is not null
    and exists (
      select 1
      from public.organizations parent
      join public.organization_memberships membership
        on membership.organization_id = parent.id
       and membership.tenant_id = parent.tenant_id
      where parent.id = p_parent_organization_id
        and parent.tenant_id = p_tenant_id
        and parent.kind in ('company', 'entity', 'city_hall')
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'admin')
    );
$$;

revoke execute on function private.can_create_group(uuid, uuid) from public, anon;
grant execute on function private.can_create_group(uuid, uuid) to authenticated;

commit;
