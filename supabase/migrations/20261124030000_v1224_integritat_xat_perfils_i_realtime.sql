-- v1.2.24 · IDEA-339 · Integritat del xat i dels perfils, i publicació de Realtime buida
--
-- Font: radiografia adversarial de Producció del 24-11-2026 (01:26–01:40 CET,
-- _investigacio_ia_de_poble/261123_radiografia_adversarial_supabase_produccio/):
--   · 7 de 26 fils de xat sense cap participant;
--   · 1 compte d'auth.users sense fila a public.profiles;
--   · 6.075 s + 435 s de sondeig del WAL de Realtime (postgres_changes) que el
--     client actual ja no fa servir: només usa Broadcast privat (xat:f:<filId>,
--     realtime.send des de la base), que no depén de la publicació.
--
-- Idempotent: es pot tornar a aplicar sense efectes nous. Portable al Node 0
-- (Postgres pla): no llig cap columna d'auth.users que el bootstrap no tinga, i
-- si la publicació no existix no fa res.
--
-- NO aplicada: l'aplica el Mestre, després de passar la sonda de només lectura
-- sonda_01c_integritat_xat_perfils_realtime_readonly.sql (kit v1.2.24, sublot 01c)
-- i de llegir-ne els recomptes.
--
-- Depén de: 2609261500 (private.nom_d_alta, private.url_https_o_null, private.baixes),
--           20261114060000 (public.crea_fil_directe canònica).

begin;

-- ── 1 · Comptes sense perfil ────────────────────────────────────────────────
-- La mateixa fila que handle_new_user i completa_la_meua_alta (id, nom i foto de
-- reserva), per a qui no ha tornat a entrar des que el disparador d'alta va
-- fallar (SDP-REG-900). Mai per a un compte en baixa (private.baixes) ni per a
-- un compte esborrat de GoTrue (deleted_at, llegit sense nomenar la columna).
-- La pertinença al poble no es toca: la completa completa_la_meua_alta en entrar.
insert into public.profiles (id, full_name, avatar_url)
select u.id,
       private.nom_d_alta(coalesce(u.raw_user_meta_data, '{}'::jsonb)),
       private.url_https_o_null(coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
  and not exists (select 1 from private.baixes b where b.user_id = u.id)
  and (to_jsonb(u) ->> 'deleted_at') is null
on conflict (id) do nothing;

-- ── 2 · Fils directes sense ningú ni res ────────────────────────────────────
-- Un fil directe sense cap participant no el pot obrir ningú. Si tampoc té cap
-- missatge, no guarda res: s'esborra. Els fils de subjecte (pàgina, comunitat,
-- canal i grups de subjecte) naixen sense participants per disseny
-- (private.xat_fil_del_subjecte) i no es toquen. Un directe buit amb missatges
-- es conserva: el decidix la retenció, no esta migració.
delete from public.xat_fils f
where f.tipus = 'directe'
  and not exists (select 1 from public.xat_participants p where p.fil_id = f.id)
  and not exists (select 1 from public.xat_missatges m where m.fil_id = f.id);

-- ── 3 · Un directe naix amb almenys un participant ──────────────────────────
-- Comprovació diferida al COMMIT: crea_fil_directe insertix el fil i els
-- participants dins de la mateixa transacció i passa; un flux que deixara el fil
-- sol (com el client de juny, en dues peticions) ara falla sencer.
create or replace function private.xat_fil_directe_amb_participants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tipus = 'directe'
     and exists (select 1 from public.xat_fils f where f.id = new.id)
     and not exists (select 1 from public.xat_participants p where p.fil_id = new.id) then
    raise exception 'SDP-XAT-051: un fil directe ha de nàixer amb almenys un participant.'
      using errcode = '23514';
  end if;
  return null;
end;
$$;
revoke all on function private.xat_fil_directe_amb_participants() from public, anon, authenticated;

drop trigger if exists xat_fil_directe_amb_participants on public.xat_fils;
create constraint trigger xat_fil_directe_amb_participants
  after insert on public.xat_fils
  deferrable initially deferred
  for each row execute function private.xat_fil_directe_amb_participants();

-- ── 4 · Un directe que es queda sense ningú i sense res desapareix ──────────
-- Quan l'última fila de participant d'un directe se'n va (una purga en cascada
-- des d'auth.users, per exemple) i el fil no té cap missatge, el fil s'esborra
-- al COMMIT. Amb missatges es conserva, com al punt 2.
create or replace function private.xat_fil_directe_buit_fora()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.xat_fils f
  where f.id = old.fil_id
    and f.tipus = 'directe'
    and not exists (select 1 from public.xat_participants p where p.fil_id = f.id)
    and not exists (select 1 from public.xat_missatges m where m.fil_id = f.id);
  return null;
end;
$$;
revoke all on function private.xat_fil_directe_buit_fora() from public, anon, authenticated;

drop trigger if exists xat_fil_directe_buit_fora on public.xat_participants;
create constraint trigger xat_fil_directe_buit_fora
  after delete on public.xat_participants
  deferrable initially deferred
  for each row execute function private.xat_fil_directe_buit_fora();

-- ── 5 · Publicació de Realtime sense taules de public ───────────────────────
-- Cap client actual no subscriu postgres_changes (retirat el 06-10-2026, ENX-17).
-- Cada taula de public a supabase_realtime fa que qualsevol client amb la clau
-- anònima puga encendre el sondeig del WAL (el 90 % del temps de base de la
-- radiografia). Broadcast des de la base (realtime.send → realtime.messages) no
-- en depén. Una publicació FOR ALL TABLES no es toca: ho diu un NOTICE.
do $$
declare
  r record;
  v_totes boolean;
begin
  select p.puballtables into v_totes from pg_catalog.pg_publication p where p.pubname = 'supabase_realtime';
  if not found then
    return;
  end if;
  if v_totes then
    raise notice 'supabase_realtime és FOR ALL TABLES: no es retira cap taula (decisió del Mestre).';
    return;
  end if;
  for r in
    select t.schemaname, t.tablename
    from pg_catalog.pg_publication_tables t
    where t.pubname = 'supabase_realtime' and t.schemaname = 'public'
    order by t.tablename
  loop
    execute format('alter publication supabase_realtime drop table %I.%I', r.schemaname, r.tablename);
  end loop;
end;
$$;

commit;
