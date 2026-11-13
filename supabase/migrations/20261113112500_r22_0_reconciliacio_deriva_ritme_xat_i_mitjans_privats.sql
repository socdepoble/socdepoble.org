-- ============================================================================
-- 20261113112500 · R22.0 · Reconciliació de la deriva de producció (T2 del
-- COMMIT 5, 13-11-2026). Decisió del Mestre del 13-11-2026: remeis R1, R2 i R3.
--
-- El Pas 0 del T2 (empremtes, sonda i sonda de deriva, només lectura) va
-- trobar a producció tres migracions antigues incompletes:
--   2609200300 (2/6): falten les polítiques «sdp mitjans …» i la lectura de
--     mitjans_privats és la de 2609191650 (propis o qualsevol veí del mateix poble).
--   2609080200 (4/6): falten trg_rate_limit_xat i private.trigger_rate_limit_xat().
--   2609121600 (1/2): falta public.admin_list_users() sense arguments.
-- 2609200300 i 2609080200 avorten si es tornen a aplicar senceres: 42883 en
-- revocar admin_list_users() i 42P13 en redefinir xat_fils_meus. 2609121600
-- s'aplicaria, però tornaria la sobrecàrrega ambigua (42725) i l'EXECUTE a
-- authenticated.
--
-- Còpia literal de migracions del catàleg, sense cap objecte nou:
--   R2 · 2609200300_blindatge_storage_i_contingut.sql:4-5, :7-70 i :94-103
--        (Storage dels mitjans). No es copien :72-92 (app_content: ho fa
--        2611121830; notes i registra_consentiment: 2611121830 i 2609261500;
--        admin_list_users(): R3) ni :104 (el bucket ja és privat).
--   R1 · 2609080200_xat_v2_correccions.sql:382-383, :387-410 i :412-416
--        (15 missatges cada 5 s per persona). No es copien :385 (esborra amb
--        CASCADE private.passa_rate_limit_xat(uuid), que no existix ni al
--        catàleg posterior ni a producció) ni :418-424 (la política
--        xat_missatges_insercio la retira 2609270200:279 i l'INSERT directe
--        el revoca 2609272200:118-119).
--   R3 · Retirada formal de public.admin_list_users() sense arguments, que la
--        versió paginada de 2609150000 substituïx i que 2609200300 revocava.
--        Recrear-la faria ambigua la crida sense arguments (42725).
--
-- Depén de 2609080100, 2609130500, 2609150000 i 2609191650.
-- Independent de la cadena del Mur R21: cap migració de la cadena crea, esborra
-- ni usa estos objectes. Transaccional i repetible.
--
-- Efectes que cal saber (Gauntlet del COMMIT 7):
--   · El límit de ritme compta per usuari_id i qualsevol rol: també la IAIA
--     (cada principal de bot) i les insercions en lot fetes pel servidor.
--   · La frontera de mitjans_privats exigix ser membre del poble de la ruta:
--     qui ix del poble deixa de llegir i d'esborrar els seus fitxers privats
--     (la purga de la baixa va per service_role).
--   · Un mitjà privat que quede dins d'un payload del Mur, des d'ara, només
--     el resol l'autora.
--
-- Abans (lectura):
-- select p.proname, p.prosrc as cos from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and p.proname in ('es_ruta_mitjans_propia', 'es_ruta_mitjans_publics_propia') order by 1;
-- select count(*) as disparador_ritme from pg_catalog.pg_trigger t where t.tgrelid = 'public.xat_missatges'::regclass and t.tgname = 'trg_rate_limit_xat' and not t.tgisinternal;
-- select count(*) as politiques_frontera from pg_catalog.pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects' and p.policyname like 'sdp mitjans%';
-- Verificació posterior (lectura):
-- select p.policyname, p.permissive, p.cmd from pg_catalog.pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects' and (p.policyname like 'sdp mitjans%' or p.policyname like 'mitjans%') order by 1;
-- select p.oid::regprocedure::text as funcio from pg_catalog.pg_proc p where p.proname in ('admin_list_users', 'trigger_rate_limit_xat') order by 1;
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- ---------------------------------------------------------------------------
-- R2 · 2609200300:7-19
-- ---------------------------------------------------------------------------
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

-- R2 · 2609200300:21-25 · Desapareix la lectura dels adjunts de qualsevol veí del mateix poble.
-- (El nom «propis o tenant» es conserva per idempotència i paritat amb 2609200300; la lectura ja és només dels propis.)
drop policy if exists "mitjans_privats llegir propis o tenant" on storage.objects;
create policy "mitjans_privats llegir propis o tenant" on storage.objects
for select to authenticated
using (bucket_id = 'mitjans_privats' and private.es_ruta_mitjans_propia(name));

-- R2 · 2609200300:27-36 · Restrictiva: una política permissiva addicional no pot tornar a obrir el bucket.
drop policy if exists "sdp mitjans privats frontera" on storage.objects;
create policy "sdp mitjans privats frontera" on storage.objects
as restrictive for all to authenticated
using (bucket_id <> 'mitjans_privats' or private.es_ruta_mitjans_propia(name))
with check (bucket_id <> 'mitjans_privats' or private.es_ruta_mitjans_propia(name));
drop policy if exists "sdp mitjans privats anon" on storage.objects;
create policy "sdp mitjans privats anon" on storage.objects
as restrictive for all to anon
using (bucket_id <> 'mitjans_privats') with check (bucket_id <> 'mitjans_privats');

-- R2 · 2609200300:38-47 · Manté lectura pública del bucket públic. Admet format nou i objectes antics propis.
create or replace function private.es_ruta_mitjans_publics_propia(p_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_ruta_mitjans_propia(p_name)
    or (cardinality(storage.foldername(p_name)) = 2
      and (storage.foldername(p_name))[1] = (select auth.uid())::text);
$$;
revoke execute on function private.es_ruta_mitjans_publics_propia(text) from public, anon;
grant execute on function private.es_ruta_mitjans_publics_propia(text) to authenticated;

-- R2 · 2609200300:49-58
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

-- R2 · 2609200300:60-70 · Defesa contra altres polítiques permissives d'escriptura del bucket públic.
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

-- R2 · 2609200300:94-103 · Detectar buckets absents.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'mitjans_privats') then
    raise exception 'Falta la migració del bucket privat';
  end if;
  if not exists (select 1 from storage.buckets where id = 'mitjans') then
    raise exception 'Falta la migració del bucket públic';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- R1 · 2609080200:382-383
-- ---------------------------------------------------------------------------
create index if not exists idx_xat_missatges_usuari_creat
  on public.xat_missatges (usuari_id, creat_al desc);

-- R1 · 2609080200:387-410
create or replace function private.trigger_rate_limit_xat()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  -- Bloqueig consultiu transaccional per evitar condicions de cursa en ràfegues
  perform pg_advisory_xact_lock(hashtext(new.usuari_id::text));

  select count(*) into v_count
  from public.xat_missatges
  where usuari_id = new.usuari_id
    and creat_al > now() - interval '5 seconds';

  if v_count >= 15 then
    raise exception 'SDP-XAT-429: Has superat el límit de missatges permesos (15/5s).' using errcode = '42900';
  end if;

  return new;
end;
$$;

-- R1 · 2609080200:412-416
drop trigger if exists trg_rate_limit_xat on public.xat_missatges;
create trigger trg_rate_limit_xat
  before insert on public.xat_missatges
  for each row
  execute function private.trigger_rate_limit_xat();

-- ---------------------------------------------------------------------------
-- R3 · Retirada de la signatura sense arguments (la paginada es conserva).
-- ---------------------------------------------------------------------------
drop function if exists public.admin_list_users();

commit;
