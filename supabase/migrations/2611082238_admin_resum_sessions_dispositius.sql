-- R13-C7 · Ordre del Mestre (08-11-2026): «👥 Usuaris, Dispositius i Botigues» de l'Administració del sistema.
-- Quantes persones distintes tenen una sessió activa per camí (app d'iPhone i iPad, Safari i navegadors d'iOS,
-- app d'Android, navegador d'Android, escriptori i altres) en 24 hores, 7 dies i 14 dies, llegit d'auth.sessions.
-- Només recomptes: cap identificador, nom, correu, IP ni user_agent ix de la funció.
-- Depén de 2610061448 (private.es_superadmin() amb aal2) i de les columnes user_agent, updated_at i
-- refreshed_at d'auth.sessions (GoTrue).
-- Idempotent i transaccional. NO aplicada: l'aplica el Mestre; cap agent no la pot aplicar.
-- Regles del camí (les de la consulta del Mestre del 7-11-2026): Android amb «; wv)» és l'app d'Android i sense,
-- el navegador; iPhone, iPad o iPod sense «Safari/» és l'app d'iOS i amb, el navegador; un user_agent buit és
-- «altres»; la resta, l'escriptori. Un iPad amb iPadOS 13 o posterior en mode escriptori (el de fàbrica) es
-- presenta com a Mac i compta a l'escriptori: la funció no ho pot distingir.
-- Abans (lectura): les tres columnes de GoTrue han d'existir (ha de tornar 3):
--   select count(*) as columnes from information_schema.columns where table_schema = 'auth' and table_name = 'sessions' and column_name in ('user_agent', 'updated_at', 'refreshed_at');
-- Verificació posterior (lectura): la funció existix i anon no la pot executar (ha de tornar true i false):
--   select to_regprocedure('public.admin_resum_sessions_dispositius()') is not null as existix, has_function_privilege('anon', 'public.admin_resum_sessions_dispositius()', 'EXECUTE') as anon_executa;
begin;

create or replace function public.admin_resum_sessions_dispositius()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'SDP-ADMIN-003: cal superadmin amb el segon factor confirmat (aal2).' using errcode = '42501';
  end if;
  return (
    with actives as (
      select s.user_id,
        greatest(s.created_at, s.updated_at, s.refreshed_at at time zone 'UTC') as activitat,
        case
          when nullif(btrim(s.user_agent), '') is null then 'altres'
          when s.user_agent ilike '%android%' then
            case when position('; wv)' in s.user_agent) > 0 then 'app_android' else 'web_android' end
          when s.user_agent ~* '(iphone|ipad|ipod)' then
            case when position('Safari/' in s.user_agent) > 0 then 'web_ios' else 'app_ios' end
          else 'escriptori'
        end as cami
      from auth.sessions s
      where s.user_id is not null
        and greatest(s.created_at, s.updated_at, s.refreshed_at at time zone 'UTC') >= now() - interval '14 days'
    )
    select jsonb_build_object(
      'consultat_a', now(),
      'camins', (
        select jsonb_agg(jsonb_build_object(
            'cami', c.cami,
            'persones_24h', (select count(distinct a.user_id) from actives a where a.cami = c.cami and a.activitat >= now() - interval '24 hours'),
            'persones_7d', (select count(distinct a.user_id) from actives a where a.cami = c.cami and a.activitat >= now() - interval '7 days'),
            'persones_14d', (select count(distinct a.user_id) from actives a where a.cami = c.cami)
          ) order by c.ordre)
        from (values ('app_ios', 1), ('web_ios', 2), ('app_android', 3), ('web_android', 4), ('escriptori', 5), ('altres', 6)) as c(cami, ordre)
      ),
      'total', jsonb_build_object(
        'persones_24h', (select count(distinct a.user_id) from actives a where a.activitat >= now() - interval '24 hours'),
        'persones_7d', (select count(distinct a.user_id) from actives a where a.activitat >= now() - interval '7 days'),
        'persones_14d', (select count(distinct a.user_id) from actives a)
      )
    )
  );
end;
$$;

comment on function public.admin_resum_sessions_dispositius() is
  'R13-C7 · Persones distintes amb sessió activa per camí (24 h, 7 dies i 14 dies). Només superadmin amb aal2; només recomptes.';

revoke execute on function public.admin_resum_sessions_dispositius() from public, anon;
grant execute on function public.admin_resum_sessions_dispositius() to authenticated;

notify pgrst, 'reload schema';
commit;
