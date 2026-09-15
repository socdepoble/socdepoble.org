-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: SEGURETAT PROFUNDA DEEPSEEK P0
-- Data: 2026-09-15
-- Motiu: Paginació admin, RGPD auditable, XSS RLS, validació town.is_open
-- ═════════════════════════════════════════════════════════════════════

-- 1. Taula de consentiments RGPD auditable i independent del payload inicial
create table if not exists public.consentiments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tipus        text not null check (tipus in ('rgpd_acepta','marketing_butlleti','analitica')),
  versio_politica text not null,      -- sha256 o data de la versió del text legal
  ip_hash      text,                  -- hash d'IP, no IP crua (minimització)
  user_agent   text,
  creat_al     timestamptz not null default now()
);
alter table public.consentiments enable row level security;
revoke all on public.consentiments from anon, public;
grant select, insert on public.consentiments to authenticated;
create policy "usuari llig els seus consentiments" on public.consentiments
  for select to authenticated using (user_id = auth.uid());

create or replace function public.registra_consentiment(p_tipus text, p_versio text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Requereix sessió' using errcode = '42501';
  end if;
  insert into public.consentiments (user_id, tipus, versio_politica)
  values (auth.uid(), p_tipus, p_versio);
  
  if p_tipus = 'rgpd_acepta' then
    update public.profiles set consentiment_rgpd_at = now() where id = auth.uid();
  end if;
end;
$$;
grant execute on function public.registra_consentiment(text, text) to authenticated;

-- 2. `handle_new_user`: Evitar spoofing i exigir que el poble existisca i estiga obert. No llig `accepta_rgpd` de raw_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_tenant uuid;
begin
  -- Assignació segura del poble per defecte ignorant el metadata falsificat del client
  select valor::uuid into v_tenant
    from private.ajustos where clau = 'poble_per_defecte';

  if v_tenant is null then
    raise exception 'SDP-REG-001: Poble no resolt. Impossible crear usuari.' using errcode = '23502';
  end if;

  if not exists (
    select 1 from public.towns t where t.id = v_tenant and t.is_open = true
  ) then
    raise exception 'SDP-REG-003: el poble per defecte no existix o no està obert.'
      using errcode = '23503';
  end if;

  insert into public.profiles (
    id, full_name, avatar_url, consentiment_rgpd_at
  )
  values (
    new.id,
    coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 120), ''), coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'name'), 120), ''), 'Veí/na')),
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ->> 'accepta_rgpd' = 'true' then now() else null end
  );

  insert into public.town_memberships (town_id, user_id, role)
  values (v_tenant, new.id, 'member')
  on conflict (town_id, user_id) do nothing;

  -- Si ha acceptat RGPD al formulari, inserim el registre d'auditoria ací mateix
  if new.raw_user_meta_data ->> 'accepta_rgpd' = 'true' then
    insert into public.consentiments (user_id, tipus, versio_politica)
    values (new.id, 'rgpd_acepta', 'v1');
  end if;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- 3. Protecció extrema de profile contra `anon`
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles'
      and 'anon' = any(roles)
  ) then
    raise exception 'SDP-RLS-001: cap política de profiles pot incloure anon. Revisa les migracions.';
  end if;
end $$;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated
  using (auth.uid() = id);

-- 4. Paginació d'admin_list_users (P0-5)
create or replace function public.admin_list_users(
  p_limit  integer default 100,
  p_offset integer default 0
)
returns json
language plpgsql security definer set search_path = ''
as $$
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'SDP-ADMIN-001: cal rol de superadmin.' using errcode = '42501';
  end if;
  return (
    select coalesce(json_agg(t), '[]'::json) from (
      select u.id, u.email, u.created_at, u.last_sign_in_at
      from auth.users u
      order by u.created_at desc
      limit greatest(1, least(coalesce(p_limit, 100), 500))
      offset greatest(0, coalesce(p_offset, 0))
    ) t
  );
end;
$$;

revoke execute on function public.admin_list_users(integer, integer) from public, anon;
grant execute on function public.admin_list_users(integer, integer) to authenticated;
