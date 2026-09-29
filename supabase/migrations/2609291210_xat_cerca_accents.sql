-- Cerca coherent amb el client: accents, majúscules i diverses paraules.
-- Mateixa pertinença, visibilitat, límit i exclusió de baixes; cap extensió.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create or replace function private.xat_plega_cerca(p_text text)
returns text language sql immutable strict set search_path = '' as $$
  select translate(lower(normalize(p_text, NFC)), 'àáâäãåèéêëìíîïòóôöõùúûüçñ', 'aaaaaaeeeeiiiiooooouuuucn');
$$;
revoke execute on function private.xat_plega_cerca(text) from public, anon, authenticated;

create or replace function public.membres_del_poble(p_tenant_id uuid, p_cerca text default null, p_limit integer default 100)
returns table (usuari_id uuid, nom text, fil_id uuid, tipus text, avatar_url text)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  return query
  select d.id, d.nom, d.fil_id, d.tipus, d.avatar_url from (
    select pr.id, coalesce(pr.full_name, 'Veí') as nom, 'persona'::text as tipus, pr.avatar_url,
      (select f.id from public.xat_fils f
       where f.tenant_id = p_tenant_id and f.tipus = 'directe'
         and f.org_id is null and f.interlocutor_id is null
         and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
         and private.es_participant(f.id)
         and exists (select 1 from public.xat_participants p where p.fil_id = f.id
           and p.usuari_id = pr.id and p.visible_fins_seq is null)
       order by f.creat_al, f.id limit 1) as fil_id
    from public.town_memberships tm join public.profiles pr on pr.id = tm.user_id
    where tm.town_id = p_tenant_id and pr.id <> v_jo and pr.baixa_demanada_at is null
    union all
    select o.id, o.name, 'entitat'::text, o.logo_url,
      (select f.id from public.xat_fils f where f.tenant_id = p_tenant_id
        and f.org_id = o.id and f.interlocutor_id = v_jo and private.es_participant(f.id)
       order by f.creat_al, f.id limit 1)
    from public.organizations o
    where o.tenant_id = p_tenant_id
      and (o.visibility = 'public' or private.is_organization_member(o.id))
      and not private.can_manage_organization(o.id)
  ) d
  where nullif(btrim(p_cerca), '') is null or not exists (select 1 from regexp_split_to_table(private.xat_plega_cerca(btrim(p_cerca)), '\s+') mot
    where strpos(private.xat_plega_cerca(d.nom), mot) = 0)
  order by d.nom, d.id limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;
revoke execute on function public.membres_del_poble(uuid, text, integer) from public, anon;
grant execute on function public.membres_del_poble(uuid, text, integer) to authenticated;

notify pgrst, 'reload schema';
commit;
