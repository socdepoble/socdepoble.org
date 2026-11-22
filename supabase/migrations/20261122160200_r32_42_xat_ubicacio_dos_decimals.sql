-- R32.42 · DOL-55 / L1-03. Ubicació consentida aproximada també per a clients antics.
-- Depén de: 20261117193000 (RPC4 d'adjunts amb ubicació).
-- No canvia RLS, ACL ni signatures: totes les escriptures passen pel trigger.
-- Es saneja el passat en la mateixa transacció abans de validar el CHECK.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function private.xat_ubicacio_dos_decimals()
returns trigger language plpgsql security definer set search_path = '' as $$
declare lloc jsonb;
begin
  if new.metadades ? 'ubicacio' then
    lloc := new.metadades->'ubicacio';
    if lloc = 'null'::jsonb then
      new.metadades := new.metadades - 'ubicacio';
    else
      if pg_catalog.jsonb_typeof(lloc) <> 'object'
        or not lloc ?& array['lat','lng'] or (lloc-array['lat','lng']) <> '{}'::jsonb
        or pg_catalog.jsonb_typeof(lloc->'lat') <> 'number'
        or pg_catalog.jsonb_typeof(lloc->'lng') <> 'number' then
        raise exception 'SDP-XAT-009: ubicació invàlida.' using errcode = '22023';
      end if;
      if (lloc->>'lat')::numeric not between -90 and 90
        or (lloc->>'lng')::numeric not between -180 and 180 then
        raise exception 'SDP-XAT-009: ubicació invàlida.' using errcode = '22023';
      end if;
      new.metadades := pg_catalog.jsonb_set(new.metadades, array['ubicacio'],
        pg_catalog.jsonb_build_object('lat',pg_catalog.round((lloc->>'lat')::numeric,2),
          'lng',pg_catalog.round((lloc->>'lng')::numeric,2)));
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.xat_ubicacio_dos_decimals() from public,anon,authenticated,service_role;
drop trigger if exists aa_xat_ubicacio_dos_decimals on public.xat_missatges;
create trigger aa_xat_ubicacio_dos_decimals before insert or update on public.xat_missatges
  for each row execute function private.xat_ubicacio_dos_decimals();

update public.xat_missatges set metadades = metadades where metadades ? 'ubicacio'
  and (metadades->'ubicacio' = 'null'::jsonb
    or metadades->'ubicacio' is distinct from pg_catalog.jsonb_build_object(
      'lat',pg_catalog.round((metadades->'ubicacio'->>'lat')::numeric,2),
      'lng',pg_catalog.round((metadades->'ubicacio'->>'lng')::numeric,2)));

alter table public.xat_missatges drop constraint if exists xat_ubicacio_dos_decimals;
alter table public.xat_missatges add constraint xat_ubicacio_dos_decimals check (
  case when not (metadades ? 'ubicacio') then true
    when pg_catalog.jsonb_typeof(metadades->'ubicacio') = 'object'
      and pg_catalog.jsonb_typeof(metadades->'ubicacio'->'lat') = 'number'
      and pg_catalog.jsonb_typeof(metadades->'ubicacio'->'lng') = 'number'
    then metadades->'ubicacio' = pg_catalog.jsonb_build_object(
      'lat',pg_catalog.round((metadades->'ubicacio'->>'lat')::numeric,2),
      'lng',pg_catalog.round((metadades->'ubicacio'->>'lng')::numeric,2))
      and (metadades->'ubicacio'->>'lat')::numeric between -90 and 90
      and (metadades->'ubicacio'->>'lng')::numeric between -180 and 180
    else false end
);
commit;
