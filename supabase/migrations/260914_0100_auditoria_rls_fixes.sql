-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: AUDITORIA RLS FIXES (EL CONSELL)
-- Data: 2026-09-14
-- Motiu: Correccions d'auditoria (Deepseek, Perplexity, Dola, Claude)
-- ═════════════════════════════════════════════════════════════════════

-- 1. Evitar spoofing de tenant al registre (Deepseek - P0)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_tenant uuid;
  v_rgpd   boolean;
begin
  -- Assignació segura del poble per defecte ignorant el metadata falsificat del client
  select valor::uuid into v_tenant
    from private.ajustos where clau = 'poble_per_defecte';

  if v_tenant is null then
    raise exception 'SDP-REG-001: Poble no resolt. Impossible crear usuari.' using errcode = '23502';
  end if;

  v_rgpd := coalesce((new.raw_user_meta_data ->> 'accepta_rgpd')::boolean, false);

  insert into public.profiles (
    id, full_name, avatar_url, consentiment_rgpd_at
  )
  values (
    new.id,
    coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 120), ''), coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'name'), 120), ''), 'Veí/na')),
    new.raw_user_meta_data ->> 'avatar_url',
    case when v_rgpd then now() else null end
  );

  insert into public.town_memberships (town_id, user_id, role)
  values (v_tenant, new.id, 'member')
  on conflict (town_id, user_id) do nothing;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- 2. Eliminar fuita d'agents a app_content i revocar accessos preventivament
revoke all on public.app_content from authenticated;
grant select, insert, update, delete on public.app_content to authenticated;
drop policy if exists "public read app_content" on public.app_content;
create policy "public read app_content" on public.app_content for select using (
  key != 'agents' or (select private.es_superadmin())
);

-- 3. Neteja preventiva a profiles (per si de cas quedava algun permís penjat)
revoke all on public.profiles from anon;

-- 4. Protegir el bucket 'mitjans' de lectura anònima per SQL, delegar a Storage
drop policy if exists "Lectura lliure mitjans" on storage.objects;
update storage.buckets set public = true where id = 'mitjans';

-- 5. Trigger fantasma `tg_touch` corregit
drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

-- 6. Filtre RGPD a membres_del_poble (Dola)
drop function if exists public.membres_del_poble(uuid, text);
create or replace function public.membres_del_poble(
  p_tenant_id uuid,
  p_cerca     text default null,
  p_limit     integer default 100
)
returns table (
  usuari_id uuid,
  nom       text,
  fil_id    uuid
)
language sql stable security definer set search_path = ''
as $$
  select
    pr.id as usuari_id,
    coalesce(pr.full_name, 'Veí')::text as nom,
    (
      select f.id
      from public.xat_fils f
      where f.tenant_id = p_tenant_id
        and (select count(*) from public.xat_participants xp where xp.fil_id = f.id) = 2
        and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = auth.uid())
        and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = pr.id)
      order by f.creat_al asc
      limit 1
    ) as fil_id
  from public.town_memberships tm
  join public.profiles pr on pr.id = tm.user_id
  where tm.town_id = p_tenant_id
    and pr.consentiment_rgpd_at is not null
    and tm.user_id <> auth.uid()
    and (
        p_cerca is null
        or btrim(p_cerca) = ''
        or pr.full_name ilike '%' || btrim(p_cerca) || '%'
    )
  order by pr.full_name asc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;
revoke execute on function public.membres_del_poble(uuid, text, integer) from public, anon;
grant execute on function public.membres_del_poble(uuid, text, integer) to authenticated;

-- 7. Signatura security definer a touch_notes_updated_at (Dola)
create or replace function public.touch_notes_updated_at()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;
