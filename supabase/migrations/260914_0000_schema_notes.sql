-- Aquest fitxer conté l'especificació d'infraestructura (taula notes i RLS) 
-- dictaminada per l'auditoria de Codex per resoldre la fugida de privacitat
-- i garantir l'integritat de les dades amb un sistema basat en files individuals.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  owner_user_id uuid not null,
  folder_id text not null default 'general',
  title text not null default 'Nova Nota',
  subtitle text,
  lead text,
  content text,
  categories jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  hero_image text,
  logo_image text,
  is_published boolean not null default false,
  published_submission_id uuid references public.section_submissions(id) on delete set null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índex per agilitzar la càrrega de les notes d'un usuari
create index if not exists idx_notes_tenant_owner
  on public.notes(tenant_id, owner_user_id, updated_at desc);

-- Trigger per auto-incrementar la revisió i actualitzar la data
create or replace function public.touch_notes_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;

drop trigger if exists trg_notes_touch on public.notes;
create trigger trg_notes_touch
before update on public.notes
for each row execute function public.touch_notes_updated_at();

-- Seguretat a nivell de fila (RLS)
alter table public.notes enable row level security;

revoke all on table public.notes from public;
grant select on table public.notes to anon;
grant select, insert, update, delete on table public.notes to authenticated;

-- Només el propietari pot llegir les seues notes
drop policy if exists "private read notes" on public.notes;
create policy "private read notes" on public.notes for select to authenticated
using (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
);

-- Només el propietari pot inserir noves notes
drop policy if exists "private insert notes" on public.notes;
create policy "private insert notes" on public.notes for insert to authenticated
with check (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
);

-- Només el propietari pot actualitzar les seues notes
drop policy if exists "private update notes" on public.notes;
create policy "private update notes" on public.notes for update to authenticated
using (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
)
with check (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
);

-- Només el propietari pot esborrar les seues notes
drop policy if exists "private delete notes" on public.notes;
create policy "private delete notes" on public.notes for delete to authenticated
using (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
);
