-- R32.42 · L1R2-01. Dada mínima pública per a la projecció del Mur.
-- Depén de: 2611122200 (llig_mur_public RPC6).
-- RPC7 opt-in: primer paràmetre boolean OBLIGATORI diferencia RPC6.
-- Els defaults només són als sis paràmetres posteriors, mai al discriminador.
-- El resultat públic original filtra files, permisos i paginació abans del JOIN.
-- El flag és editorial, no retira la fitxa del Mercat ni del Calendari.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create or replace function public.llig_mur_public(
  p_inclou_visibilitat boolean,p_tenant_id uuid default null,p_section_id text default null,p_limit integer default 200,
  p_before_created_at timestamptz default null,p_before_id uuid default null,p_nomes_projeccions boolean default false
) returns setof jsonb language sql stable security definer set search_path = '' as $$
  select pg_catalog.to_jsonb(p) || case when p_inclou_visibilitat then
    pg_catalog.jsonb_build_object('mostrar_al_mur',case
      when not (s.payload ? 'mostrarAlMur') and not (s.payload ? 'ocultarDelMur') then true
      when (s.payload ? 'mostrarAlMur') and pg_catalog.jsonb_typeof(s.payload->'mostrarAlMur') <> 'boolean' then false
      when (s.payload ? 'ocultarDelMur') and pg_catalog.jsonb_typeof(s.payload->'ocultarDelMur') <> 'boolean' then false
      when (s.payload ? 'mostrarAlMur') and (s.payload ? 'ocultarDelMur') and (s.payload->'mostrarAlMur') = (s.payload->'ocultarDelMur') then false
      when s.payload ? 'mostrarAlMur' then (s.payload->>'mostrarAlMur')::boolean
      else not (s.payload->>'ocultarDelMur')::boolean end)
    else '{}'::jsonb end
  from public.llig_mur_public(p_tenant_id,p_section_id,p_limit,p_before_created_at,p_before_id,p_nomes_projeccions) p
    join public.section_submissions s on s.id=p.id and s.tenant_id=p.tenant_id and s.section_id=p.section_id
  order by p.created_at desc,p.id desc;
$$;
revoke all on function public.llig_mur_public(boolean,uuid,text,integer,timestamptz,uuid,boolean) from public,anon,authenticated,service_role;
grant execute on function public.llig_mur_public(boolean,uuid,text,integer,timestamptz,uuid,boolean) to anon,authenticated;
commit;
