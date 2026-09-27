-- ============================================================================
-- 260926_1200 · Publicacions amb autoria dual (persona o entitat)
-- Pla: _wiki_de_poble/04_escriptori/260926_0130_pla_implementacio_auditoria_extrema.md · E.5 pas 2
--
-- Additiva i idempotent. No reescriu cap política existent; només afig:
--   1. section_submissions.author_org_id  → l'organització que signa (o NULL = la persona).
--   2. section_submissions.updated_at     → data d'edició, separada de created_at.
--   3. Trigger que, en UPDATE, conserva created_at (REG-06) i escriu updated_at.
--   4. organizations.logo_url             → la foto/logotip que el perfil ja ofereix (REG-03).
--   5. Política: qui publica com a entitat ha de ser owner/admin d'eixa entitat.
-- ============================================================================

-- 1 · Autoria: persona (NULL) o organització.
alter table public.section_submissions
  add column if not exists author_org_id uuid
  references public.organizations (id) on delete set null;

create index if not exists section_submissions_author_org_idx
  on public.section_submissions (tenant_id, author_org_id)
  where author_org_id is not null;

-- 2 · Data d'edició.
alter table public.section_submissions
  add column if not exists updated_at timestamptz not null default now();

-- 3 · En republicar (upsert pel mateix id), created_at no es mou: la data del
--     Mur és la de la primera publicació; updated_at diu quan s'ha tocat.
create or replace function public.section_submissions_conserva_creacio()
returns trigger
language plpgsql
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists section_submissions_conserva_creacio on public.section_submissions;
create trigger section_submissions_conserva_creacio
  before update on public.section_submissions
  for each row
  execute function public.section_submissions_conserva_creacio();

-- 4 · Logotip de l'organització (el client ja el llig i l'escriu com a logo_url).
alter table public.organizations
  add column if not exists logo_url text;

-- 5 · Publicar com a entitat només si es mana en eixa entitat.
--     La comprovació és una funció perquè la puguen reutilitzar altres taules
--     (agenda, mercat) quan també admeten autoria dual.
create or replace function public.pot_signar_com_organitzacio(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_org_id is null
    or exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = p_org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    );
$$;

revoke all on function public.pot_signar_com_organitzacio(uuid) from public;
grant execute on function public.pot_signar_com_organitzacio(uuid) to authenticated;

-- La restricció viu com a CHECK amb funció perquè s'aplique tant a INSERT com a
-- UPDATE (upsert de republicació) sense tocar les polítiques RLS existents.
alter table public.section_submissions
  drop constraint if exists section_submissions_autoria_org_valida;
alter table public.section_submissions
  add constraint section_submissions_autoria_org_valida
  check (public.pot_signar_com_organitzacio(author_org_id)) not valid;
-- `not valid`: les files antigues (author_org_id NULL) no es revaliden; les
-- noves i les modificades sí. Si es vol validar-ho tot:
--   alter table public.section_submissions validate constraint section_submissions_autoria_org_valida;

comment on column public.section_submissions.author_org_id is
  'Organització que signa la publicació. NULL = la persona (owner_user_id).';
comment on column public.section_submissions.updated_at is
  'Última edició. created_at es conserva en republicar (trigger).';
comment on column public.organizations.logo_url is
  'Logotip o foto de l''organització; el perfil el puja a Storage i desa ací la URL.';
