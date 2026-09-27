-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: PERMISOS I CAMPS DE PROFILES (AVATAR I IDENTITAT)
-- Data: 2026-09-11
-- Motiu: Permetre a l'usuari actualitzar el seu avatar, nom i poble
--        des de /jo/el-meu-perfil sense rebre error 403 (42501).
-- ═════════════════════════════════════════════════════════════════════

-- 1. Assegurar columnes necessàries a public.profiles
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists town_name text default 'La Torre de les Maçanes';
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists is_public boolean default false;

-- 2. Concedir permisos DML a authenticated i anon sobre public.profiles
grant select on table public.profiles to authenticated, anon;
grant insert (id, full_name, visibility, avatar_url, town_name, bio, is_public) on table public.profiles to authenticated;
grant update (full_name, visibility, avatar_url, town_name, bio, is_public) on table public.profiles to authenticated;

-- 3. Assegurar política RLS per a update propi
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Assegurar política RLS per a select
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated, anon
  using (true);

-- 5. Trigger d'actualització de timestamps
drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();
