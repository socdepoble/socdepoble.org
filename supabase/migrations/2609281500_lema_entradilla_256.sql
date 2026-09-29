-- ============================================================================
-- 260928_1500 · T49 · Entradilla (lema) de 120 a 256 caràcters
-- Ordre del Mestre (260928): l'entradilla admet 256 caràcters a tots els
-- nivells. El client en té la font única a src/data/limitsText.js
-- (MAXIM_LEMA), i src/data/limitsText.test.js llig este fitxer per vigilar
-- que tots dos diguen el mateix.
--
--   1. CHECK de public.profiles i public.organizations: char_length(lema) <= 256.
--      El d'organitzacions naix sense nom (260908_0000) i el de perfils es diu
--      profiles_lema_llargaria (260926_1500): es busquen per definició, no pel
--      nom, i es deixa un de sol per taula, <taula>_lema_llargaria.
--   2. public.create_organization: còpia literal de la definició vigent
--      (260916_0600) amb una sola línia canviada, el retall del lema a 256.
--      Mateixa signatura i mateixos revoke/grant.
--
-- Només amplia un límit: cap fila vella el pot trencar. Additiva i idempotent:
-- es pot tornar a executar. Les migracions històriques no es toquen (les
-- proves de 260926_1500 hi fixen el 120 d'aquell moment). Cap taula, política
-- ni permís de taula nous. Revisada i NO aplicada a cap base de dades:
-- s'ha d'aplicar ABANS de publicar el client, o un lema de 121 a 256 caràcters
-- rebria l'avís genèric del servidor en lloc de desar-se.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · CHECK de la llargària del lema ──────────────────────────────────────
-- Sense la columna (la F1 no aplicada als perfils), la taula es deixa com està
-- i ho avisa SDP-LEMA-001: la migració no falla.
do $$
declare
  v_taula text;
  v_restriccio record;
  v_ja_hi_es boolean;
begin
  foreach v_taula in array array['profiles', 'organizations'] loop
    if not exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = v_taula and column_name = 'lema') then
      raise notice 'SDP-LEMA-001: public.% no té la columna lema; es deixa sense CHECK.', v_taula;
      continue;
    end if;

    v_ja_hi_es := false;
    for v_restriccio in
      select c.conname, pg_catalog.pg_get_constraintdef(c.oid) as definicio
      from pg_catalog.pg_constraint c
      where c.conrelid = format('public.%I', v_taula)::regclass
        and c.contype = 'c'
        and pg_catalog.pg_get_constraintdef(c.oid) ~* 'char_length\(\s*lema\s*\)'
    loop
      -- Una segona execució troba la seua pròpia restricció: es conserva.
      if v_restriccio.conname = v_taula || '_lema_llargaria'
        and v_restriccio.definicio ~ '<=\s*256\M' then
        v_ja_hi_es := true;
      else
        execute format('alter table public.%I drop constraint %I', v_taula, v_restriccio.conname);
      end if;
    end loop;

    if not v_ja_hi_es then
      execute format('alter table public.%I add constraint %I check (char_length(lema) <= 256)',
                     v_taula, v_taula || '_lema_llargaria');
    end if;
  end loop;
end
$$;

-- ── 2 · create_organization ─────────────────────────────────────────────────
-- Còpia literal de 2609160600_politiques_superadmin_organitzacions.sql (P2).
-- Única diferència: v_lema es retalla a 256 (abans, 120).
create or replace function public.create_organization(
  p_tenant_id uuid,
  p_kind text,
  p_name text,
  p_slug text,
  p_lema text default '',
  p_description text default '',
  p_parent_organization_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := left(btrim(coalesce(p_name, '')), 120);
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_lema text := left(btrim(coalesce(p_lema, '')), 256);
  v_description text := left(btrim(coalesce(p_description, '')), 500);
  v_organization record;
begin
  if p_kind in ('entity', 'city_hall') then
    raise exception 'Les entitats i els ajuntaments no es creen: es reclamen.' using errcode = '42501';
  end if;

  if v_user_id is null then
    raise exception 'Cal iniciar sessió per crear una organització.' using errcode = '42501';
  end if;

  if p_kind is null or p_kind not in ('company', 'group', 'entity', 'city_hall') then
    raise exception 'El tipus d’organització no és vàlid.' using errcode = '22023';
  end if;

  if char_length(v_name) < 2 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'El nom o l’identificador de l’organització no és vàlid.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.towns town where town.id = p_tenant_id) then
    raise exception 'El poble indicat no existeix.' using errcode = '22023';
  end if;

  if p_kind in ('company', 'entity', 'city_hall') and p_parent_organization_id is not null then
    raise exception 'Aquesta organització no pot tindre una organització mare.' using errcode = '22023';
  end if;

  if p_kind = 'group'
    and not (select private.can_create_group(p_parent_organization_id, p_tenant_id))
  then
    raise exception 'El grup necessita una empresa mare que pugues administrar.' using errcode = '42501';
  end if;

  insert into public.profiles (id, full_name, visibility)
  values (
    v_user_id,
    coalesce(
      nullif(left(btrim((select auth.jwt()) -> 'user_metadata' ->> 'name'), 120), ''),
      'Persona'
    ),
    'private'
  )
  on conflict (id) do nothing;


  select
    organization.id,
    organization.tenant_id,
    organization.slug,
    organization.name,
    organization.kind,
    organization.parent_organization_id,
    organization.lema,
    organization.description,
    organization.visibility,
    organization.created_at,
    organization.updated_at
  into v_organization
  from public.organizations organization
  where organization.tenant_id = p_tenant_id
    and organization.slug = v_slug;

  if found then
    if v_organization.kind <> p_kind
      or v_organization.parent_organization_id is distinct from p_parent_organization_id
      or not (select private.can_manage_organization(v_organization.id))
    then
      raise exception 'L’identificador ja pertany a una altra organització.' using errcode = '23505';
    end if;
    return to_jsonb(v_organization);
  end if;

  insert into public.organizations (
    tenant_id,
    slug,
    name,
    kind,
    parent_organization_id,
    lema,
    description,
    visibility,
    created_by
  ) values (
    p_tenant_id,
    v_slug,
    v_name,
    p_kind,
    p_parent_organization_id,
    v_lema,
    v_description,
    'public',
    v_user_id
  )
  returning
    id,
    tenant_id,
    slug,
    name,
    kind,
    parent_organization_id,
    lema,
    description,
    visibility,
    created_at,
    updated_at
  into v_organization;

  return to_jsonb(v_organization);
end;
$$;

revoke execute on function public.create_organization(uuid, text, text, text, text, text, uuid) from public;
revoke execute on function public.create_organization(uuid, text, text, text, text, text, uuid) from anon;
grant execute on function public.create_organization(uuid, text, text, text, text, text, uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
