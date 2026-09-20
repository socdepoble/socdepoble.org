-- Migració per corregir el límit dur de xat i retornar els més recents
-- Evita el problema d'Rendiment/N+1 reportat amb fils de +1600 missatges

create or replace function public.xat_missatges_del_fil(
  p_fil_id uuid,
  p_limit  integer default 50
)
returns table (
  id         uuid,
  usuari_id  uuid,
  autor_nom  text,
  cos        text,
  es_ia      boolean,
  creat_al   timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-005: no eres participant d''aquest fil.' using errcode = '42501';
  end if;

  return query
    select * from (
      select
        m.id,
        m.usuari_id,
        coalesce(pr.full_name, 'Veí')::text,
        m.text,
        m.es_ia,
        m.creat_al
      from public.xat_missatges m
      left join public.profiles pr on pr.id = m.usuari_id
      where m.fil_id = p_fil_id
      order by m.creat_al desc
      limit greatest(1, least(coalesce(p_limit, 50), 50))
    ) sub
    order by sub.creat_al asc;
end;
$$;
