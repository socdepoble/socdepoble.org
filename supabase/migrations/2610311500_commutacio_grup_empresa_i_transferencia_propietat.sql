-- Lot 5 Codex · candidat reconciliat; NO executat remotament.
-- Base: 58 migracions versionades fins 2610281730; propietat en memberships.role.
-- El trigger diferit sdp_una_propietaria queda actiu. No es crea cap índex
-- immediat global: el seu nom citat al kit Gemini no existeix en R1 i la
-- purga històrica promou abans d'eliminar. Es prova separadament com variant.
-- Cap perfil personal es fa públic i no es redefineix cap guarda no versionada.
-- ============================================================================
-- 261031_1500 · P1-59 (c) i IDEA-24 · Commutació bidireccional Grup ↔ Empresa i
-- Transferència de Propietat d'Organització
--
-- QUÈ CORREGIX:
--   1. P1-59 (c) · Quan una organització commuta de 'group' a 'company' (o es crea
--      com a 'company', 'entity' o 'city_hall'), la visibilitat ha de quedar
--      sempre en 'public' i parent_organization_id en null (per complir la
--      restricció check (kind = 'group' or parent_organization_id is null) de
--      2609080000). A més, només la propietària ('owner' a
--      public.organization_memberships) pot commutar el tipus d'organització, i
--      només entre 'group' i 'company'.
--   2. IDEA-24 · La propietària ('owner') d'una organització no podia cedir la
--      titularitat a una altra persona membre ('admin' o 'member') sense
--      intervenció manual a la base de dades, perquè desa_membre_organitzacio
--      (2610181915 i 2610281730) bloqueja el rol 'owner' (SDP-ORGMEM-005) i el
--      disparador diferit sdp_una_propietaria (2609080000) exigix mantindre
--      una sola propietària al final de la transacció.
--
-- QUÈ FA:
--   1. Crea private.forca_visibilitat_publica_empresa() i el disparador
--      trg_forca_visibilitat_publica_empresa BEFORE INSERT OR UPDATE OF kind,
--      visibility, parent_organization_id ON public.organizations: valida que el canvi de kind siga
--      entre 'group' i 'company' i fet per l'owner, i força visibility = 'public'
--      i parent_organization_id = null quan kind és 'company', 'entity' o
--      'city_hall'.
--      Decisió del Mestre (xat 261031, RGPD): les empreses, les entitats i els
--      ajuntaments són figures públiques del directori. La regla només actua en
--      el BEFORE INSERT OR UPDATE de cada fila d'eixos tipus; no hi ha cap UPDATE
--      massiu de les files existents, i els grups conserven la visibilitat que
--      trien.
--   2. Concedeix el permís d'UPDATE de kind i parent_organization_id sobre
--      public.organizations a authenticated (sota la política «gestores
--      actualitzen l'organització» de 2609080000 i el filtre del disparador).
--   3. Crea public.transfereix_propietat_organitzacio(p_organization_id uuid,
--      p_nou_owner_id uuid) SECURITY DEFINER amb search_path buit: sota pany
--      consultiu de transacció i FOR UPDATE a public.organizations i
--      public.organization_memberships, verifica que qui crida és l'owner i que
--      la persona destinatària és membre actiu de l'organització i del poble
--      (public.profiles sense baixa_demanada_at i public.town_memberships),
--      degrada l'antiga owner a 'admin' i promou la destinatària a 'owner'.
--      El disparador sdp_titular_public_nomes_owner (2610250300) neteja
--      automàticament titular_public = false en la fila degradada, i
--      public.contacte_organitzacio (2610242320) deixa d'exposar el correu
--      d'accés de l'antiga titular perquè llig en viu m.role = 'owner'.
--   4. Torna a crear la política «orgs_read_auth» (2609160600) sense la branca
--      created_by: després d'una transferència, la creadora que ja no és
--      membre no llig una fitxa «members» (revisió R3, SQL-02).
--
-- QUÈ NO FA:
--   · No crea cap taula ni vista nova.
--   · No permet commutar cap 'entity' ni 'city_hall' des del client.
--   · No permet transferir la titularitat d'una 'entity' ni d'un 'city_hall':
--     eixa titularitat només s'obté per reclamació revisada
--     (public.resol_reclamacio, superadmin amb aal2). La RPC només accepta
--     'group' i 'company' (revisió R3, SQL-01).
--   · No permet transferir la propietat a una organització membre (només a una
--     persona de public.organization_memberships del mateix poble).
--
-- CODIS: reutilitza el catàleg SDP-ORGMEM-000..006 de 2610181915:
--   SDP-ORGMEM-000 cal la sessió iniciada (42501)
--   SDP-ORGMEM-001 paràmetres o tipus no vàlids, també una transferència
--                  d'una entitat o d'un ajuntament (22023)
--   SDP-ORGMEM-002 l'organització no existix o no s'administra (42501)
--   SDP-ORGMEM-003 la persona destinatària no és membre actiu del poble (22023)
--   SDP-ORGMEM-004 no pots transferir-te la propietat a tu mateix (42501)
--   SDP-ORGMEM-006 només la propietària commuta el tipus o transfereix (42501)
--
-- Depén de: 2609080000 (public.organizations, public.organization_memberships i
-- sdp_una_propietaria), 2609272200 (xat_alta_gestor_entitat), 2610181915
-- (membres_organitzacio), 2610242320 (contacte_organitzacio), 2610250300
-- (sdp_titular_public_nomes_owner) i 2610281730 (desa_membre_organitzacio).
--
-- ABANS D'APLICAR-LA (lectura; el resultat s'ha de guardar):
--   select kind, visibility, count(*) from public.organizations group by 1, 2;
--
-- DESPRÉS D'APLICAR-LA (lectura):
--   select tgname from pg_trigger where tgname = 'trg_forca_visibilitat_publica_empresa';
--   select proname from pg_proc where proname = 'transfereix_propietat_organitzacio';
--
-- Idempotent i en una sola transacció.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · P1-59 (c) · Disparador de commutació i visibilitat pública d'empresa ────
create or replace function private.forca_visibilitat_publica_empresa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
begin
  -- La fila de l'organització ja està bloquejada per l'UPDATE. Una
  -- transferència també la bloqueja abans de canviar les pertinences.
  if TG_OP = 'UPDATE' and (new.kind is distinct from old.kind
       or new.parent_organization_id is distinct from old.parent_organization_id) then
    if v_jo is not null and not exists (
      select 1 from public.organization_memberships m
       where m.organization_id = old.id and m.user_id = v_jo and m.role = 'owner'
    ) then
      raise exception 'SDP-ORGMEM-006: només la propietària canvia el tipus o la mare.' using errcode = '42501';
    end if;
    if new.kind is distinct from old.kind then
      if old.kind not in ('group','company') or new.kind not in ('group','company') then
        raise exception 'SDP-ORGMEM-001: només es pot commutar entre grup i empresa.' using errcode = '22023';
      end if;
      if new.kind = 'group' and exists (
        select 1 from public.organizations f where f.parent_organization_id = old.id
      ) then
        raise exception 'SDP-ORGMEM-001: una empresa amb grups fills no es pot convertir en grup.' using errcode = '22023';
      end if;
    end if;
  end if;

  if new.kind in ('company','entity','city_hall') then
    new.visibility := 'public';
    new.parent_organization_id := null;
  elsif new.kind = 'group' and (TG_OP = 'INSERT' or new.kind is distinct from old.kind
       or new.parent_organization_id is distinct from old.parent_organization_id) then
    if new.parent_organization_id = new.id then
      raise exception 'SDP-ORGMEM-001: el grup necessita una mare vàlida.' using errcode = '22023';
    end if;
    if new.parent_organization_id is not null then
    -- SHARE, no KEY SHARE: també serialitza canvis de kind de la mare.
    perform 1 from public.organizations p
      where p.id = new.parent_organization_id and p.tenant_id = new.tenant_id
        and p.kind in ('company','entity','city_hall') for share;
    if not found or (v_jo is not null and not private.can_create_group(new.parent_organization_id,new.tenant_id)) then
      raise exception 'SDP-ORGMEM-001: la mare ha de ser del poble i estar administrada per qui crea el grup.' using errcode = '22023';
    end if;
    end if;
  end if;

  return new;
end;
$$;
revoke all on function private.forca_visibilitat_publica_empresa() from public, anon, authenticated, service_role;

drop trigger if exists trg_forca_visibilitat_publica_empresa on public.organizations;
create trigger trg_forca_visibilitat_publica_empresa
  before insert or update of kind, visibility, parent_organization_id on public.organizations
  for each row execute function private.forca_visibilitat_publica_empresa();

grant update (kind, parent_organization_id) on table public.organizations to authenticated;

-- Revisió R3 (SQL-02) · Amb la transferència, created_by ja no vol dir
-- pertinença: una creadora degradada i expulsada no ha de continuar llegint
-- una fitxa «members». Es torna a crear la política de 2609160600 igual, sense
-- la branca created_by: la fila pública, qui hi és membre (owner, admin o
-- member a public.organization_memberships) i superadmin. create_organization
-- inserix només files públiques (WITH CHECK) i la creadora hi entra com a owner.
drop policy if exists "orgs_read_auth" on public.organizations;
create policy "orgs_read_auth" on public.organizations
for select to authenticated
using (
  visibility = 'public'
  or exists (
    select 1 from public.organization_memberships m
    where m.organization_id = organizations.id
      and m.user_id = (select auth.uid())
  )
  or (select private.es_superadmin())
);

-- ── 2 · IDEA-24 · Transferència atòmica de propietat d'organització ─────────
create or replace function public.transfereix_propietat_organitzacio(
  p_organization_id uuid,
  p_nou_owner_id uuid
)
returns table (
  organization_id uuid,
  antic_owner_id uuid,
  nou_owner_id uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo          uuid := (select auth.uid());
  v_tenant      uuid;
  v_kind        text;
  v_rol_actual  text;
  v_rol_desti   text;
begin
  if v_jo is null then
    raise exception 'SDP-ORGMEM-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_organization_id is null or p_nou_owner_id is null then
    raise exception 'SDP-ORGMEM-001: el tipus de membre o el rol no és vàlid.' using errcode = '22023';
  end if;
  if p_nou_owner_id = v_jo then
    raise exception 'SDP-ORGMEM-004: no pots canviar el teu propi rol.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('sdp-orgowner:' || p_organization_id::text, 0));

  select o.tenant_id, o.kind into v_tenant, v_kind
    from public.organizations o
   where o.id = p_organization_id
     for update;
  if not found then
    raise exception 'SDP-ORGMEM-002: només qui administra l''organització en gestiona els membres.' using errcode = '42501';
  end if;

  select m.role into v_rol_actual
    from public.organization_memberships m
   where m.organization_id = p_organization_id
     and m.user_id = v_jo
     for update;
  if v_rol_actual is distinct from 'owner' then
    raise exception 'SDP-ORGMEM-006: només la propietària pot transferir la titularitat de l''organització.' using errcode = '42501';
  end if;
  -- Revisió R3 (SQL-01) · La titularitat d'una entitat o d'un ajuntament només
  -- s'obté per reclamació revisada (resol_reclamacio) mentre no té propietària;
  -- amb propietària no es transferix. Ací, només grups i empreses.
  if v_kind not in ('group','company') then
    raise exception 'SDP-ORGMEM-001: la titularitat d''una entitat o d''un ajuntament no es transferix: només s''obté per reclamació revisada mentre no té propietària.' using errcode = '22023';
  end if;

  select m.role into v_rol_desti
    from public.organization_memberships m
   where m.organization_id = p_organization_id
     and m.user_id = p_nou_owner_id
     for update;
  if not found or not exists (
    select 1
      from public.profiles pr
      join public.town_memberships tm on tm.user_id = pr.id and tm.town_id = v_tenant
     where pr.id = p_nou_owner_id
       and pr.baixa_demanada_at is null
  ) then
    raise exception 'SDP-ORGMEM-003: la persona destinatària ha de ser membre actiu de l''organització en este poble.' using errcode = '22023';
  end if;

  update public.organization_memberships
     set role = 'admin'
   where organization_id = p_organization_id
     and user_id = v_jo
     and role = 'owner';

  update public.organization_memberships
     set role = 'owner'
   where organization_id = p_organization_id
     and user_id = p_nou_owner_id;

  return query
  select p_organization_id, v_jo, p_nou_owner_id;
end;
$$;
revoke all on function public.transfereix_propietat_organitzacio(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.transfereix_propietat_organitzacio(uuid, uuid) to authenticated;


-- Pany compartit amb transferència: evita prendre decisions amb un rol anterior.

create or replace function public.desa_membre_organitzacio(
  p_organization_id uuid,
  p_membre_id uuid,
  p_tipus text,
  p_role text default 'member'
)
returns table (tipus text, membre_id uuid, nom text, avatar_url text, role text, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo      uuid := (select auth.uid());
  v_tipus   text := lower(btrim(coalesce(p_tipus, '')));
  v_role    text := lower(btrim(coalesce(nullif(btrim(p_role), ''), 'member')));
  v_tenant  uuid;
  v_meu     text;
  v_actual  text;
  v_n       integer := 0;
begin
  if v_jo is null then
    raise exception 'SDP-ORGMEM-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_organization_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('sdp-orgowner:' || p_organization_id::text, 0));
  end if;
  if p_membre_id is null
    or v_tipus not in ('persona', 'organitzacio')
    or v_role not in ('member', 'admin')
    or (v_tipus = 'organitzacio' and v_role <> 'member') then
    raise exception 'SDP-ORGMEM-001: el tipus de membre o el rol no és vàlid.' using errcode = '22023';
  end if;
  if p_organization_id is null or not private.can_manage_organization(p_organization_id) then
    raise exception 'SDP-ORGMEM-002: només qui administra l''organització en gestiona els membres.' using errcode = '42501';
  end if;
  select o.tenant_id into v_tenant from public.organizations o where o.id = p_organization_id;
  select m.role into v_meu from public.organization_memberships m
   where m.organization_id = p_organization_id and m.user_id = v_jo;

  if v_tipus = 'persona' then
    if p_membre_id = v_jo then
      raise exception 'SDP-ORGMEM-004: no pots canviar el teu propi rol.' using errcode = '42501';
    end if;
    if not exists (
      select 1
      from public.profiles pr
      join public.town_memberships tm on tm.user_id = pr.id and tm.town_id = v_tenant
      where pr.id = p_membre_id and pr.baixa_demanada_at is null
    ) then
      raise exception 'SDP-ORGMEM-003: la persona no és del poble de l''organització o ha demanat la baixa.' using errcode = '22023';
    end if;
    -- C11-03 · Una crida darrere l'altra per a cada parell: la fila absent no es pot bloquejar.
    perform pg_advisory_xact_lock(hashtextextended('sdp-orgmem:' || p_organization_id::text || ':' || p_membre_id::text, 0));
    select m.role into v_actual from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = p_membre_id
     for update;
    if v_actual = 'owner' then
      raise exception 'SDP-ORGMEM-005: la propietària no es canvia ni es lleva.' using errcode = '42501';
    end if;
    if v_actual is distinct from v_role then
      if (v_role = 'admin' or v_actual = 'admin') and v_meu is distinct from 'owner' then
        raise exception 'SDP-ORGMEM-006: només la propietària nomena, degrada o lleva administradores.' using errcode = '42501';
      end if;
      -- C11-03 · Defensa en profunditat: mai sobre una owner, ni sobre o cap a admin si no ho fa la propietària.
      insert into public.organization_memberships as actual (organization_id, tenant_id, user_id, role)
      values (p_organization_id, v_tenant, p_membre_id, v_role)
      on conflict (organization_id, user_id) do update set role = excluded.role
      where actual.role <> 'owner'
        and (v_meu = 'owner' or (actual.role <> 'admin' and excluded.role <> 'admin'));
      get diagnostics v_n = row_count;
      if v_n = 0 then
        raise exception 'SDP-ORGMEM-006: només la propietària nomena, degrada o lleva administradores.' using errcode = '42501';
      end if;
    end if;
  else
    if p_membre_id = p_organization_id or not exists (
      select 1 from public.organizations o where o.id = p_membre_id and o.tenant_id = v_tenant
    ) then
      raise exception 'SDP-ORGMEM-007: una organització no pot ser membre d''ella mateixa ni d''una d''un altre poble.' using errcode = '22023';
    end if;
    if not private.can_manage_organization(p_membre_id) then
      raise exception 'SDP-ORGMEM-008: per a afegir una organització com a membre, cal que també l''administres.' using errcode = '42501';
    end if;
    insert into public.organization_member_organizations (organization_id, member_organization_id, tenant_id, created_by)
    values (p_organization_id, p_membre_id, v_tenant, v_jo)
    on conflict (organization_id, member_organization_id) do nothing;
  end if;

  return query
  select d.tipus, d.membre_id, d.nom, d.avatar_url, d.role, d.created_at
  from public.membres_organitzacio(p_organization_id) d
  where d.tipus = v_tipus and d.membre_id = p_membre_id;
end;
$$;
revoke all on function public.desa_membre_organitzacio(uuid, uuid, text, text) from public,anon;
grant execute on function public.desa_membre_organitzacio(uuid, uuid, text, text) to authenticated;

create or replace function public.lleva_membre_organitzacio(
  p_organization_id uuid,
  p_membre_id uuid,
  p_tipus text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo     uuid := (select auth.uid());
  v_tipus  text := lower(btrim(coalesce(p_tipus, '')));
  v_meu    text;
  v_actual text;
  v_n      integer := 0;
begin
  if v_jo is null then
    raise exception 'SDP-ORGMEM-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_organization_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('sdp-orgowner:' || p_organization_id::text, 0));
  end if;
  if p_membre_id is null or v_tipus not in ('persona', 'organitzacio') then
    raise exception 'SDP-ORGMEM-001: el tipus de membre o el rol no és vàlid.' using errcode = '22023';
  end if;

  -- Eixida pròpia: qualsevol membre que no siga la propietària
  if v_tipus = 'persona' and p_membre_id = v_jo then
    select m.role into v_actual from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = v_jo
     for update;
    if not found then
      return false;
    end if;
    if v_actual = 'owner' then
      raise exception 'SDP-ORGMEM-005: la propietària no es canvia ni es lleva.' using errcode = '42501';
    end if;
    delete from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = v_jo;
    get diagnostics v_n = row_count;
    return v_n > 0;
  end if;

  if p_organization_id is null or not private.can_manage_organization(p_organization_id) then
    raise exception 'SDP-ORGMEM-002: només qui administra l''organització en gestiona els membres.' using errcode = '42501';
  end if;

  if v_tipus = 'persona' then
    select m.role into v_meu from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = v_jo;
    select m.role into v_actual from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = p_membre_id
     for update;
    if not found then
      return false;
    end if;
    if v_actual = 'owner' then
      raise exception 'SDP-ORGMEM-005: la propietària no es canvia ni es lleva.' using errcode = '42501';
    end if;
    if v_actual = 'admin' and v_meu is distinct from 'owner' then
      raise exception 'SDP-ORGMEM-006: només la propietària nomena, degrada o lleva administradores.' using errcode = '42501';
    end if;
    delete from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = p_membre_id;
  else
    delete from public.organization_member_organizations mo
     where mo.organization_id = p_organization_id and mo.member_organization_id = p_membre_id;
  end if;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;
revoke all on function public.lleva_membre_organitzacio(uuid, uuid, text) from public,anon;
grant execute on function public.lleva_membre_organitzacio(uuid, uuid, text) to authenticated;

notify pgrst, 'reload schema';
commit;
