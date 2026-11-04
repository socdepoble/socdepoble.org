-- FEDI-04 · Lectures d'administració multipoble. Additiva; no aplicada per este torn.
-- No deduïx autoritat de town_memberships ni del directori públic.
begin;

create or replace function public.admin_llista_pobles()
returns table (id uuid, slug text, nom text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'SDP-ADMIN-003: cal superadmin amb el segon factor confirmat (aal2).' using errcode = '42501';
  end if;
  return query select t.id, t.slug, t.name from public.towns t order by t.name, t.id;
end;
$$;
revoke execute on function public.admin_llista_pobles() from public, anon;
grant execute on function public.admin_llista_pobles() to authenticated;

create or replace function public.admin_llegix_personalitzacio(p_tenant_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'SDP-ADMIN-003: cal superadmin amb el segon factor confirmat (aal2).' using errcode = '42501';
  end if;
  if p_tenant_id is null or not exists (select 1 from public.towns t where t.id = p_tenant_id) then
    raise exception 'SDP-ADMIN-004: el poble seleccionat no existix.' using errcode = '22023';
  end if;
  return jsonb_build_object('tenantId', p_tenant_id, 'files', coalesce((
    select jsonb_agg(jsonb_build_object('key', c.key, 'payload', c.payload, 'version', c.version) order by c.key)
    from public.app_content c
    where c.tenant_id = p_tenant_id and c.key in ('taxonomia', 'estil')
  ), '[]'::jsonb));
end;
$$;
revoke execute on function public.admin_llegix_personalitzacio(uuid) from public, anon;
grant execute on function public.admin_llegix_personalitzacio(uuid) to authenticated;

commit;
