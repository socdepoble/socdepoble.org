-- ============================================================================
-- 261008_1400 · Organitzacions (grup C) · Un grup no necessita empresa mare
-- Ordre del Mestre (261008, prompt 261008_1201_prompt_claude.md, tasca 3):
-- «Elimina d'una vegada el camp "Empresa mare (obligatori)" del modal de nova
-- organització. Un grup no té per què pertànyer a cap empresa.»
--
-- 2609272201_grups_mare.sql va fer obligatòria la mare a les dues capes del
-- servidor que la vigilen, i no n'hi ha prou de llevar el camp de la
-- interfície: un grup sense mare rebia un 42501. Esta migració obri les dues
-- capes a un grup sense mare i deixa intacte el cas amb mare:
--   1. private.can_create_group: «p_parent_organization_id is null or
--      exists (...)», la forma de 2609080000. Amb mare, la frontera de
--      sempre: la mare és del mateix poble, és de tipus company, entity o
--      city_hall, i qui crida l'administra (owner o admin). Sense sessió, mai.
--      src/data/organizations.js (TIPUS_MARE) en vigila els tipus.
--   2. La política «members create organizations» de public.organizations,
--      tornada a crear sense «parent_organization_id is not null» per al
--      grup. L'empresa continua sense mare, i created_by = auth.uid(),
--      visibility = 'public' i is_town_member es conserven.
-- No redefinix public.create_organization (src/data/limitsText.test.js en
-- vigila el retall del lema): la funció ja pregunta a can_create_group i, amb
-- la mare opcional, un grup sense mare hi passa.
--
-- No amplia cap altre permís: un grup sense mare és una organització com una
-- empresa, amb qui el crea com a propietària (private.add_organization_owner)
-- i dins del seu poble. Additiva i idempotent: es pot tornar a executar.
-- Revisada i NO aplicada a cap base de dades: l'aplica el Mestre. Va després
-- de 2610072230 i ABANS de publicar el client: sense ella, un grup creat sense
-- mare rep «El grup necessita una empresa mare que pugues administrar».
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · La mare d'un grup passa a ser opcional ──────────────────────────────
-- Mateix cos que 2609272201, amb una sola condició canviada: sense mare, n'hi
-- ha prou amb la sessió. Amb mare, la comprovació és la mateixa lletra a lletra.
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
  select (select auth.uid()) is not null and (
    p_parent_organization_id is null or exists (
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
    )
  );
$$;

revoke execute on function private.can_create_group(uuid, uuid) from public, anon;
grant execute on function private.can_create_group(uuid, uuid) to authenticated;

-- ── 2 · La política d'INSERT de public.organizations ────────────────────────
-- La de 2609080000 sense «parent_organization_id is not null» al grup. Una
-- empresa amb mare continua rebutjada aquí i pel CHECK de la taula.
drop policy if exists "members create organizations" on public.organizations;
create policy "members create organizations" on public.organizations for insert to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
  and visibility = 'public'
  and (select private.is_town_member(tenant_id))
  and (
    (kind = 'company' and parent_organization_id is null)
    or (
      kind = 'group'
      and (select private.can_create_group(parent_organization_id, tenant_id))
    )
  )
);

notify pgrst, 'reload schema';
commit;
