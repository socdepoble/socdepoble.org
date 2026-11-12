-- P1-75 · Campanyes de patrimoni viu.
-- Depén de 2611091500 i 2610241400.
-- Prevol: auth.uid(), private.is_town_member(uuid) i private.pot_curar_cultura().
begin;

create or replace function private.mesures_revisio_patrimoni_valides(valor jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  mesura record;
  quantes integer := 0;
begin
  if valor is null or jsonb_typeof(valor) <> 'object' or octet_length(valor::text) > 40000 then
    return false;
  end if;
  for mesura in select key, value from jsonb_each(valor) loop
    quantes := quantes + 1;
    if quantes > 32 or mesura.key !~ '^[A-Za-z][A-Za-z0-9_]{0,47}$'
       or mesura.key in ('constructor', 'prototype') then
      return false;
    end if;
    case jsonb_typeof(mesura.value)
      when 'string' then
        if char_length(mesura.value #>> '{}') > 160 then return false; end if;
      when 'number' then
        if abs((mesura.value #>> '{}')::numeric) > 9007199254740991 then return false; end if;
      when 'boolean', 'null' then null;
      else return false;
    end case;
  end loop;
  return true;
end $$;

revoke all on function private.mesures_revisio_patrimoni_valides(jsonb) from public, anon, authenticated;
grant execute on function private.mesures_revisio_patrimoni_valides(jsonb) to authenticated;

create table if not exists public.revisions_patrimoni (
  id uuid not null unique default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  entitat_tipus text not null check (entitat_tipus in ('llavor', 'arbre', 'recepta')),
  entitat_slug text not null check (char_length(entitat_slug) between 1 and 128 and entitat_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  campanya_any integer not null check (campanya_any between 1 and 9999),
  estat_conservacio text not null check (
    char_length(estat_conservacio) between 1 and 80
    and estat_conservacio = btrim(estat_conservacio,
      E' \t\n\r\f\u000B\U000000A0\U00001680\U00002000\U00002001\U00002002\U00002003\U00002004\U00002005\U00002006\U00002007\U00002008\U00002009\U0000200A\U00002028\U00002029\U0000202F\U0000205F\U00003000\U0000FEFF')
  ),
  mesures_jsonb jsonb not null default '{}' check (private.mesures_revisio_patrimoni_valides(mesures_jsonb)),
  observacions text not null default '' check (char_length(observacions) <= 4000),
  creat_per uuid not null default auth.uid() references auth.users(id) on delete cascade,
  versio integer not null default 1 check (versio > 0),
  primary key (tenant_id, entitat_tipus, entitat_slug, campanya_any)
);
create index if not exists revisions_patrimoni_creat_per on public.revisions_patrimoni(creat_per);
alter table public.revisions_patrimoni enable row level security;

-- La UI llig les campanyes i les mesures. El UUID del compte és intern.
revoke all on table public.revisions_patrimoni from public, anon, authenticated, service_role;
grant select (id, tenant_id, entitat_tipus, entitat_slug, campanya_any, estat_conservacio, mesures_jsonb, observacions, versio)
  on table public.revisions_patrimoni to anon, authenticated;
grant insert (tenant_id, entitat_tipus, entitat_slug, campanya_any, estat_conservacio, mesures_jsonb, observacions)
  on table public.revisions_patrimoni to authenticated;
grant update (estat_conservacio, mesures_jsonb, observacions)
  on table public.revisions_patrimoni to authenticated;
grant delete on table public.revisions_patrimoni to authenticated;

create or replace function private.pot_editar_revisio_patrimoni(p_tenant_id uuid, p_creat_per uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select (select auth.uid()) is not null and (
    coalesce((select private.es_superadmin()), false)
    or (
      private.is_town_member(p_tenant_id)
      and (
        p_creat_per = (select auth.uid())
        or (
          (select auth.jwt()->>'aal') = 'aal2'
          and (coalesce((select private.pot_curar_cultura()), false) or exists (
            select 1 from public.town_memberships m
            where m.town_id = p_tenant_id and m.user_id = (select auth.uid()) and m.role = 'admin'
          ))
        )
      )
    )
  );
$$;

revoke all on function private.pot_editar_revisio_patrimoni(uuid, uuid) from public, anon, authenticated;
grant execute on function private.pot_editar_revisio_patrimoni(uuid, uuid) to authenticated;

drop policy if exists revisions_patrimoni_lectura on public.revisions_patrimoni;
create policy revisions_patrimoni_lectura on public.revisions_patrimoni
  for select to anon, authenticated using (entitat_tipus in ('llavor', 'arbre', 'recepta'));

drop policy if exists revisions_patrimoni_alta on public.revisions_patrimoni;
create policy revisions_patrimoni_alta on public.revisions_patrimoni
  for insert to authenticated with check (
    creat_per = (select auth.uid()) and private.pot_editar_revisio_patrimoni(tenant_id, creat_per)
  );

drop policy if exists revisions_patrimoni_edicio on public.revisions_patrimoni;
create policy revisions_patrimoni_edicio on public.revisions_patrimoni
  for update to authenticated using (private.pot_editar_revisio_patrimoni(tenant_id, creat_per))
  with check (private.pot_editar_revisio_patrimoni(tenant_id, creat_per));

drop policy if exists revisions_patrimoni_baixa on public.revisions_patrimoni;
create policy revisions_patrimoni_baixa on public.revisions_patrimoni
  for delete to authenticated using (private.pot_editar_revisio_patrimoni(tenant_id, creat_per));

-- L’identificador de la fila i la versió permeten que el port compare i actualitze en una sola operació.
-- L'acceptació de les normes és exigible en publicar/editar contingut públic.
-- Fora, com a exigix_normes_publicacio (2610241400): service_role, els seeds i
-- el sistema (sense persona). Dos if, i no un sol «and»: la crida a
-- he_acceptat_normes() (revocada a service_role) només es prepara per a una persona.
create or replace function private.prepara_revisio_patrimoni()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is not null and coalesce((select auth.role()), '') <> 'service_role' then
    if not coalesce(private.he_acceptat_normes(), false) then
      raise exception 'SDP-MOD-428: cal acceptar les normes de convivència.' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    new.versio := old.versio + 1;
  end if;
  return new;
end $$;

revoke all on function private.prepara_revisio_patrimoni() from public, anon, authenticated, service_role;
drop trigger if exists revisions_patrimoni_prepara on public.revisions_patrimoni;
create trigger revisions_patrimoni_prepara before insert or update on public.revisions_patrimoni
  for each row execute function private.prepara_revisio_patrimoni();

comment on table public.revisions_patrimoni is 'Una campanya pública per peça de patrimoni i poble. Autoria privada, baixa en cascada i versió de l’edició.';
notify pgrst, 'reload schema';

-- Postvol: select relrowsecurity from pg_class where oid = 'public.revisions_patrimoni'::regclass;
commit;
