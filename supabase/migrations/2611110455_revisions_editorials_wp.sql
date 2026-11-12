-- P0-111 / IDEA-242 · Persistència i sincronització d'estats de revisió editorial d'importació WordPress.
-- Depén de 2611091500 i 2610061448.
-- Prevol: auth.uid(), private.es_superadmin() i private.pot_curar_cultura().
-- Abans (lectura): select to_regclass('public.revisions_editorials_wp');
begin;

create table if not exists public.revisions_editorials_wp (
  wp_id integer primary key check (wp_id > 0),
  estat text not null check (estat in ('pendent_admin', 'aprovat', 'amb_observacions')),
  nota text not null default '' check (char_length(nota) <= 4000),
  autoria text not null default 'Sóc de Poble' check (char_length(btrim(autoria)) between 1 and 256),
  desti text not null default 'mur' check (char_length(btrim(desti)) between 1 and 64 and desti ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  revisat_per uuid references auth.users(id) on delete set null,
  actualitzat_a timestamptz not null default now()
);

create index if not exists revisions_editorials_wp_revisat_per on public.revisions_editorials_wp(revisat_per);
alter table public.revisions_editorials_wp enable row level security;

revoke all on table public.revisions_editorials_wp from public, anon, authenticated, service_role;

create or replace function private.pot_revisar_importacio_wp()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and (
      coalesce((select private.es_superadmin()), false)
      or coalesce((select private.pot_curar_cultura()), false)
    );
$$;

revoke all on function private.pot_revisar_importacio_wp() from public, anon, authenticated, service_role;

drop policy if exists revisions_editorials_wp_lectura_curadoria on public.revisions_editorials_wp;
create policy revisions_editorials_wp_lectura_curadoria on public.revisions_editorials_wp
  for select to authenticated using (private.pot_revisar_importacio_wp());

drop policy if exists revisions_editorials_wp_escriptura_curadoria on public.revisions_editorials_wp;
create policy revisions_editorials_wp_escriptura_curadoria on public.revisions_editorials_wp
  for all to authenticated
  using (private.pot_revisar_importacio_wp())
  with check (private.pot_revisar_importacio_wp());

create or replace function public.llista_revisions_editorials_wp()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.pot_revisar_importacio_wp() then
    raise exception 'SDP-WP-REV-403: cal sessió de curadoria o superadministració amb segon factor (AAL2).' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'wp_id', r.wp_id,
        'estat', r.estat,
        'nota', r.nota,
        'autoria', r.autoria,
        'desti', r.desti,
        'actualitzat_a', r.actualitzat_a
      )
      order by r.wp_id asc
    )
    from (
      select wp_id, estat, nota, autoria, desti, actualitzat_a
      from public.revisions_editorials_wp
      order by wp_id asc
      limit 1000
    ) r
  ), '[]'::jsonb);
end $$;

revoke all on function public.llista_revisions_editorials_wp() from public, anon, authenticated, service_role;
grant execute on function public.llista_revisions_editorials_wp() to authenticated;

create or replace function public.desa_revisio_editorial_wp(
  p_wp_id integer,
  p_estat text,
  p_nota text default '',
  p_autoria text default 'Sóc de Poble',
  p_desti text default 'mur'
)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_nota text := coalesce(p_nota, '');
  v_autoria text := coalesce(nullif(btrim(p_autoria), ''), 'Sóc de Poble');
  v_desti text := coalesce(nullif(btrim(p_desti), ''), 'mur');
  v_fila public.revisions_editorials_wp;
begin
  if not private.pot_revisar_importacio_wp() then
    raise exception 'SDP-WP-REV-403: cal sessió de curadoria o superadministració amb segon factor (AAL2).' using errcode = '42501';
  end if;
  if p_wp_id is null or p_wp_id <= 0
     or p_estat is null or p_estat not in ('pendent_admin', 'aprovat', 'amb_observacions')
     or char_length(v_nota) > 4000
     or char_length(v_autoria) > 256
     or char_length(v_desti) > 64
     or v_desti !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'SDP-WP-REV-400: paràmetres de revisió editorial invàlids.' using errcode = '22023';
  end if;

  insert into public.revisions_editorials_wp (wp_id, estat, nota, autoria, desti, revisat_per, actualitzat_a)
  values (p_wp_id, p_estat, v_nota, v_autoria, v_desti, (select auth.uid()), now())
  on conflict (wp_id) do update set
    estat = excluded.estat,
    nota = excluded.nota,
    autoria = excluded.autoria,
    desti = excluded.desti,
    revisat_per = excluded.revisat_per,
    actualitzat_a = now()
  returning * into v_fila;

  return jsonb_build_object(
    'wp_id', v_fila.wp_id,
    'estat', v_fila.estat,
    'nota', v_fila.nota,
    'autoria', v_fila.autoria,
    'desti', v_fila.desti,
    'actualitzat_a', v_fila.actualitzat_a
  );
end $$;

revoke all on function public.desa_revisio_editorial_wp(integer, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.desa_revisio_editorial_wp(integer, text, text, text, text) to authenticated;

comment on table public.revisions_editorials_wp is 'Estats de curadoria editorial de les entrades importades de WordPress (P0-111). Lectura i escriptura restringides a curadoria o superadministració AAL2 via RPC.';
notify pgrst, 'reload schema';

-- Verificació posterior (lectura): select relrowsecurity from pg_class where oid = 'public.revisions_editorials_wp'::regclass;
commit;
