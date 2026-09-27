-- ==============================================================================
-- MIGRACIÓ: Xat v2 (WhatsApp de Poble)
-- ==============================================================================
-- Aquest esquema substitueix l'antic 'chat_threads' i 'chat_messages' per un
-- model de 4 taules preparat per a converses multiusuari, complint amb la
-- visió "Offline-First" i garantint la privadesa absoluta amb RLS.

create table if not exists public.xat_fils (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  titol text,
  creat_per uuid not null references auth.users(id) on delete cascade,
  creat_al timestamptz not null default now(),
  actualitzat_al timestamptz not null default now()
);

create table if not exists public.xat_participants (
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  creat_al timestamptz not null default now(),
  primary key (fil_id, usuari_id)
);

create table if not exists public.xat_missatges (
  id uuid primary key default gen_random_uuid(),
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  creat_al timestamptz not null default now()
);

create table if not exists public.xat_lectures (
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  ultim_llegit_al timestamptz not null default now(),
  primary key (fil_id, usuari_id)
);

-- ==============================================================================
-- FUNCIONS I TRIGGERS
-- ==============================================================================

-- Funció clau de seguretat (RLS): només retorna cert si l'usuari és participant
create or replace function private.es_participant(p_fil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.xat_participants p
    where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid())
  );
$$;

-- Trigger per actualitzar el timestamp del fil en cada nou missatge
create or replace function public.trg_actualitza_xat_fil()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.xat_fils set actualitzat_al = now() where id = new.fil_id;
  return new;
end;
$$;

drop trigger if exists on_nou_missatge on public.xat_missatges;
create trigger on_nou_missatge
after insert on public.xat_missatges
for each row execute function public.trg_actualitza_xat_fil();

-- ==============================================================================
-- POLÍTIQUES DE SEGURETAT (RLS)
-- ==============================================================================

alter table public.xat_fils enable row level security;
alter table public.xat_participants enable row level security;
alter table public.xat_missatges enable row level security;
alter table public.xat_lectures enable row level security;

-- Només els usuaris autenticats poden interactuar amb el xat
revoke all on table public.xat_fils from anon, public;
grant select on table public.xat_fils to authenticated;

revoke all on table public.xat_participants from anon, public;
grant select on table public.xat_participants to authenticated;

revoke all on table public.xat_missatges from anon, public;
grant select on table public.xat_missatges to authenticated;
grant insert (fil_id, usuari_id, text) on table public.xat_missatges to authenticated;

revoke all on table public.xat_lectures from anon, public;
grant select, insert, update on table public.xat_lectures to authenticated;


-- Polítiques per a xat_fils
drop policy if exists "xat_fils_lectura" on public.xat_fils;
create policy "xat_fils_lectura" on public.xat_fils for select to authenticated
using (private.es_participant(id));



-- Polítiques per a xat_participants
drop policy if exists "xat_participants_lectura" on public.xat_participants;
create policy "xat_participants_lectura" on public.xat_participants for select to authenticated
using (private.es_participant(fil_id));




-- Polítiques per a xat_missatges
drop policy if exists "xat_missatges_lectura" on public.xat_missatges;
create policy "xat_missatges_lectura" on public.xat_missatges for select to authenticated
using (private.es_participant(fil_id));

drop policy if exists "xat_missatges_insercio" on public.xat_missatges;
create policy "xat_missatges_insercio" on public.xat_missatges for insert to authenticated
with check (private.es_participant(fil_id) and usuari_id = (select auth.uid()));


-- Polítiques per a xat_lectures
drop policy if exists "xat_lectures_lectura" on public.xat_lectures;
create policy "xat_lectures_lectura" on public.xat_lectures for select to authenticated
using (usuari_id = (select auth.uid()));

drop policy if exists "xat_lectures_insercio" on public.xat_lectures;
create policy "xat_lectures_insercio" on public.xat_lectures for insert to authenticated
with check (usuari_id = (select auth.uid()));

drop policy if exists "xat_lectures_actualitzacio" on public.xat_lectures;
create policy "xat_lectures_actualitzacio" on public.xat_lectures for update to authenticated
using (usuari_id = (select auth.uid()))
with check (usuari_id = (select auth.uid()));
