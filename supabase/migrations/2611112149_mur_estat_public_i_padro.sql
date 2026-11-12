-- R20 · Frontera pública del Mur i del padró de publicadors.
-- Dependències: 2611111735 i 2611112005.
-- Les files antigues sense marcadors explícits continuen sent públiques.
-- Un marcador privat o d’esborrany en qualsevol contenidor de metadades domina.
-- Les notes del seu propietari mantenen la política privada existent.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function private.publicacio_mur_es_publica(p_payload jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  pendents jsonb[] := array[p_payload];
  capa jsonb;
  n integer;
  visitades integer := 0;
  contenidor text;
begin
  while coalesce(array_length(pendents, 1), 0) > 0 loop
    n := array_length(pendents, 1);
    capa := pendents[n];
    pendents := pendents[1:n-1];
    visitades := visitades + 1;
    if visitades > 64 or jsonb_typeof(capa) is distinct from 'object' then return false; end if;
    if (capa ? 'visibility' and coalesce(capa->>'visibility' not in ('public', 'publica'), true))
      or (capa ? 'status' and coalesce(capa->>'status' not in ('approved', 'published', 'public', 'publicat', 'aprovat'), true))
      or (capa ? 'isPublished' and capa->'isPublished' is distinct from 'true'::jsonb)
      or (capa ? 'is_published' and capa->'is_published' is distinct from 'true'::jsonb) then
      return false;
    end if;
    foreach contenidor in array array['attributes', 'payload'] loop
      if capa ? contenidor and capa->contenidor is distinct from 'null'::jsonb then
        pendents := array_append(pendents, capa->contenidor);
      end if;
    end loop;
  end loop;
  return true;
end;
$$;
revoke all on function private.publicacio_mur_es_publica(jsonb) from public, anon, authenticated, service_role;
grant execute on function private.publicacio_mur_es_publica(jsonb) to anon, authenticated;

drop policy if exists "public read section_submissions" on public.section_submissions;
create policy "public read section_submissions" on public.section_submissions for select
to anon, authenticated
using (
  (section_id in ('mur', 'mercat', 'events', 'multimedia')
    and private.publicacio_mur_es_publica(payload)
    and exists (select 1 from public.towns t where t.id = section_submissions.tenant_id))
  or (section_id = 'notes' and owner_user_id = (select auth.uid())
    and (select private.is_town_member(tenant_id)))
);

create or replace function private.copub_recurs(p_tenant_id uuid, p_tipus text, p_recurs_id text)
returns table (origen_id uuid, article_id uuid) language plpgsql stable set search_path = '' as $$
declare
  id_article uuid := private.copub_text_uuid(p_recurs_id);
  fila record;
  origen_paquet text;
  element jsonb;
  quantes integer;
begin
  if not exists (select 1 from public.towns t where t.id = p_tenant_id) then return; end if;

  if p_tipus = 'article' and id_article is not null then
    select s.author_org_id, s.owner_user_id, s.payload into fila
    from public.section_submissions s
    where s.id = id_article and s.tenant_id = p_tenant_id and s.section_id = 'mur';
    if found then
      if private.publicacio_mur_es_publica(fila.payload) then
        return query select coalesce(fila.author_org_id, fila.owner_user_id), id_article;
      end if;
      return;
    end if;
  end if;

  if p_tipus in ('article', 'pagina') then
    select c.payload into element from public.app_content c
    where c.tenant_id = p_tenant_id and c.key = case p_tipus when 'article' then 'feedPosts' else 'pages' end;
    if jsonb_typeof(element) = 'array' then
      select count(*), (jsonb_agg(e.value)->0) into quantes, element
      from jsonb_array_elements(element) e where e.value->>'id' = p_recurs_id;
      if quantes > 1 then return; end if;
    end if;
  end if;

  select r.origen_clau into origen_paquet from private.recursos_copublicacio_paquet r
  where r.tipus = p_tipus and r.recurs_id = p_recurs_id;
  if found or quantes = 1 then
    return query select coalesce(
      private.copub_text_uuid(element->>'author_org_id'),
      private.copub_text_uuid(element->>'author_id'),
      private.copub_text_uuid(element->>'authorId'),
      private.copub_actor_oficial(origen_paquet),
      private.copub_actor_oficial(case coalesce(element->>'authorId', element->>'author_id')
        when 'rentonar' then 'rentonar'
        when 'socdepoble' then 'socdepoble'
        when 'soc-de-poble_official' then 'socdepoble'
      end)
    ), null::uuid;
  end if;
end;
$$;

-- El padró SECDEF comparteix la frontera de les publicacions públiques.
revoke all on function private.copub_recurs(uuid,text,text) from public, anon, authenticated, service_role;
commit;
