-- PROPOSTA: aplicar després de les migracions locals existents, en staging.
-- No migra ni elimina objectes; les URL públiques ja difoses no es revoquen ací.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

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
revoke execute on function private.es_ruta_mitjans_propia(text) from public, anon;
grant execute on function private.es_ruta_mitjans_propia(text) to authenticated;

-- Desapareix la lectura dels adjunts de qualsevol veí del mateix poble.
drop policy if exists "mitjans_privats llegir propis o tenant" on storage.objects;
create policy "mitjans_privats llegir propis o tenant" on storage.objects
for select to authenticated
using (bucket_id = 'mitjans_privats' and private.es_ruta_mitjans_propia(name));

-- Restrictiva: una política permissiva addicional no pot tornar a obrir el bucket.
drop policy if exists "sdp mitjans privats frontera" on storage.objects;
create policy "sdp mitjans privats frontera" on storage.objects
as restrictive for all to authenticated
using (bucket_id <> 'mitjans_privats' or private.es_ruta_mitjans_propia(name))
with check (bucket_id <> 'mitjans_privats' or private.es_ruta_mitjans_propia(name));
drop policy if exists "sdp mitjans privats anon" on storage.objects;
create policy "sdp mitjans privats anon" on storage.objects
as restrictive for all to anon
using (bucket_id <> 'mitjans_privats') with check (bucket_id <> 'mitjans_privats');

-- Manté lectura pública del bucket públic. Admet format nou i objectes antics propis.
create or replace function private.es_ruta_mitjans_publics_propia(p_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_ruta_mitjans_propia(p_name)
    or (cardinality(storage.foldername(p_name)) = 2
      and (storage.foldername(p_name))[1] = (select auth.uid())::text);
$$;
revoke execute on function private.es_ruta_mitjans_publics_propia(text) from public, anon;
grant execute on function private.es_ruta_mitjans_publics_propia(text) to authenticated;

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

-- Defesa contra altres polítiques permissives d'escriptura del bucket públic.
drop policy if exists "sdp mitjans insercio frontera" on storage.objects;
create policy "sdp mitjans insercio frontera" on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'mitjans' or private.es_ruta_mitjans_publics_propia(name));
drop policy if exists "sdp mitjans canvi frontera" on storage.objects;
create policy "sdp mitjans canvi frontera" on storage.objects as restrictive for update to authenticated
using (bucket_id <> 'mitjans' or private.es_ruta_mitjans_publics_propia(name))
with check (bucket_id <> 'mitjans' or private.es_ruta_mitjans_publics_propia(name));
drop policy if exists "sdp mitjans baixa frontera" on storage.objects;
create policy "sdp mitjans baixa frontera" on storage.objects as restrictive for delete to authenticated
using (bucket_id <> 'mitjans' or private.es_ruta_mitjans_publics_propia(name));

-- app_content és contingut editorial públic; les notes personals viuen a public.notes.
-- La llista és explícita: un key nou requerix decidir-ne la visibilitat.
drop policy if exists "app_content lectura publica" on public.app_content;
create policy "app_content lectura publica" on public.app_content for select to anon, authenticated
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding'));
drop policy if exists "sdp app_content anon frontera" on public.app_content;
create policy "sdp app_content anon frontera" on public.app_content as restrictive for select to anon
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding'));
drop policy if exists "sdp app_content auth frontera" on public.app_content;
create policy "sdp app_content auth frontera" on public.app_content as restrictive for select to authenticated
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding')
  or (select private.es_superadmin()));

-- Reducció de superfície: les notes anònimes ja eren denegades per RLS.
revoke all on table public.notes from anon;
-- L'RPC manté auth.uid(), però no necessita EXECUTE públic.
revoke execute on function public.registra_consentiment(text, text) from public, anon;
grant execute on function public.registra_consentiment(text, text) to authenticated;
-- Tanca l'overload sense paginació, sense eliminar-lo ni perdre dades.
revoke execute on function public.admin_list_users() from public, anon, authenticated;
grant execute on function public.admin_list_users(integer, integer) to authenticated;

-- Detectar buckets absents: no convertir una actualització de zero files en èxit.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'mitjans_privats') then
    raise exception 'Falta la migració del bucket privat';
  end if;
  if not exists (select 1 from storage.buckets where id = 'mitjans') then
    raise exception 'Falta la migració del bucket públic';
  end if;
end $$;
update storage.buckets set public = false where id = 'mitjans_privats';
commit;