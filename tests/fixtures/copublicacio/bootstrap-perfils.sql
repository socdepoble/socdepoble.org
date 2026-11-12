-- Modela les columnes necessàries de 2609261500, 2610042350 i 2610081401
-- en el PostgreSQL de prova buit. El padró, les RLS originals i la funció
-- d'administració es carreguen de les migracions reals.
alter table public.profiles
  add column avatar_url text,
  add column town_name text,
  add column is_public boolean default false,
  add column baixa_demanada_at timestamptz;
alter table public.organizations
  add column logo_url text,
  add column town_name text;
