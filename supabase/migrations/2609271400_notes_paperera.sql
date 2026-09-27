-- ============================================================================
-- 260927_1400 · Paperera i arxiu de Notes
-- Cicle de vida d'una nota: activa → paperera (30 dies) | arxivada, i esborrat
-- definitiu (DELETE, que «private delete notes» de 260914_0000 ja permet).
--
-- Additiva i idempotent: es pot tornar a executar. Requerix 260914_0000
-- (public.notes) i 260926_1500 (private.ajustos). Mateix estil que
-- 260926_1500: una sola transacció amb temps d'espera curts.
--
-- NO S'HA APLICAT: a l'entorn local no hi ha PostgreSQL. El client
-- (src/data/supabase/notes.js) ja demana status i filtra status=eq.activa:
-- fins que s'aplique, el mode remot de Notes no carrega (el mateix cas que la
-- columna copyright de 260926_2232).
--
--   1. Columnes status i trashed_at, coherència entre elles i índex.
--   2. trashed_at el fixa el servidor (trigger before insert or update): el
--      valor que envie el client no compta mai.
--   3. Purga als 30 dies: private.purga_paperera_notes, amb pg_cron si hi és.
--      L'arxiu no caduca.
--
-- La publicació al Mur es conserva: la clau forana va de la nota cap a
-- section_submissions (published_submission_id … on delete set null) i
-- esborrar la nota no hi toca.
--
-- Codis nous: SDP-NOTES-900.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · Ajustos: dies que una nota es guarda a la paperera ───────────────────
insert into private.ajustos (clau, valor)
values ('dies_paperera_notes', '30')
on conflict (clau) do nothing;


-- ── 1 · Estat de la nota ─────────────────────────────────────────────────────
alter table public.notes
  add column if not exists status text not null default 'activa'
    constraint notes_status_valid check (status in ('activa', 'paperera', 'arxivada'));

alter table public.notes
  add column if not exists trashed_at timestamptz;

-- Una nota és a la paperera si i només si té data d'entrada.
alter table public.notes drop constraint if exists notes_paperera_amb_data;
alter table public.notes
  add constraint notes_paperera_amb_data check ((status = 'paperera') = (trashed_at is not null));

-- El Bloc llista les actives d'una persona per id descendent (cursor de
-- loadNotesPage); la purga busca per estat.
create index if not exists idx_notes_tenant_owner_status
  on public.notes (tenant_id, owner_user_id, status, id desc);


-- ── 2 · La data d'entrada a la paperera la posa el servidor ──────────────────
-- En entrar-hi, now(); en eixir-ne, null; si l'estat no canvia, la que hi
-- havia. Un INSERT o un PATCH amb trashed_at inventat (una data futura que no
-- caducaria mai) no té cap efecte.
create or replace function public.notes_marca_paperera()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status <> 'paperera' then
    new.trashed_at := null;
  elsif tg_op = 'UPDATE' and old.status = 'paperera' then
    new.trashed_at := old.trashed_at;
  else
    new.trashed_at := now();
  end if;
  return new;
end;
$$;
revoke execute on function public.notes_marca_paperera() from public, anon, authenticated;

drop trigger if exists trg_notes_paperera on public.notes;
create trigger trg_notes_paperera
before insert or update on public.notes
for each row execute function public.notes_marca_paperera();


-- ── 3 · Purga de la paperera ─────────────────────────────────────────────────
-- Només esborra notes en estat 'paperera' amb més dies dels de l'ajust. El
-- client no la pot executar; la programa pg_cron.
create or replace function private.purga_paperera_notes(p_limit integer default 500)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_dies  integer;
  v_fetes integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtext('sdp-purga-paperera-notes')) then
    return 0;
  end if;

  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
    from private.ajustos a where a.clau = 'dies_paperera_notes';
  exception when invalid_text_representation then
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 30);

  with vencudes as (
    select n.id
    from public.notes n
    where n.status = 'paperera'
      and n.trashed_at <= now() - make_interval(days => v_dies)
    order by n.trashed_at asc
    limit greatest(1, least(coalesce(p_limit, 500), 5000))
    for update skip locked
  )
  delete from public.notes n
   using vencudes v
   where n.id = v.id
     and n.status = 'paperera';
  get diagnostics v_fetes = row_count;
  return v_fetes;
end;
$$;
revoke execute on function private.purga_paperera_notes(integer) from public, anon, authenticated;

-- Programació només si pg_cron ja està actiu (s'activa des del panell). Si no
-- ho està, cal programar private.purga_paperera_notes() a mà.
do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule('sdp-purga-paperera-notes', '37 3 * * *', $cron$select private.purga_paperera_notes(500)$cron$);
  else
    raise notice 'SDP-NOTES-900: pg_cron no està actiu; la purga de la paperera de Notes queda sense programar.';
  end if;
end
$$;

notify pgrst, 'reload schema';
commit;
