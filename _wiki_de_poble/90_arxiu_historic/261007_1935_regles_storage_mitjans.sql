-- 1. Funcions de seguretat (RLS) per a comprovar si la ruta és correcta
create or replace function private.es_ruta_mitjans_propia(p_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case
    when cardinality(storage.foldername(p_name)) = 3
      and (storage.foldername(p_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (storage.foldername(p_name))[2] = (select auth.uid())::text
    then private.is_town_member(((storage.foldername(p_name))[1])::uuid)
    else false
  end;
$$;
grant execute on function private.es_ruta_mitjans_propia(text) to authenticated;

create or replace function private.es_ruta_mitjans_publics_propia(p_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_ruta_mitjans_propia(p_name)
    or (cardinality(storage.foldername(p_name)) = 2
      and (storage.foldername(p_name))[1] = (select auth.uid())::text);
$$;
grant execute on function private.es_ruta_mitjans_publics_propia(text) to authenticated;


-- 2. Regles d'accés per al bucket 'mitjans'
drop policy if exists "mitjans llegir" on storage.objects;
create policy "mitjans llegir" on storage.objects for select to anon, authenticated
  using (bucket_id = 'mitjans');

drop policy if exists "mitjans pujar propis" on storage.objects;
create policy "mitjans pujar propis" on storage.objects for insert to authenticated
  with check (bucket_id = 'mitjans' and private.es_ruta_mitjans_publics_propia(name));

drop policy if exists "mitjans actualitzar propis" on storage.objects;
create policy "mitjans actualitzar propis" on storage.objects for update to authenticated
  using (bucket_id = 'mitjans' and private.es_ruta_mitjans_publics_propia(name))
  with check (bucket_id = 'mitjans' and private.es_ruta_mitjans_publics_propia(name));

drop policy if exists "mitjans esborrar propis" on storage.objects;
create policy "mitjans esborrar propis" on storage.objects for delete to authenticated
  using (bucket_id = 'mitjans' and private.es_ruta_mitjans_publics_propia(name));
