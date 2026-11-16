-- R31 · Push vinculat a la sessió autoritzada, no sols al compte.
-- Depén de: 2611080431 (registre i lliurament lease-v2).
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- La desaparició d'auth.sessions en logout revoca físicament el registre,
-- també en logout global o amb el client tancat. Cap token al frontend nou.
-- Les files antigues sense sessió no tenen una autoria que puguem inferir:
-- es revoquen. Reiniciar/recarregar els clients és necessari per renovar
-- el registre: una memòria web encara oberta pot recordar el desat anterior.
-- No es pot retirar un avís que Apple/Google ja haja acceptat abans de logout.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.xat_dispositius_push add column if not exists sessio_id uuid;
delete from public.xat_dispositius_push where sessio_id is null;
alter table public.xat_dispositius_push alter column sessio_id set not null;

do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.xat_dispositius_push'::regclass
      and conname = 'xat_dispositius_push_sessio_fk') then
    alter table public.xat_dispositius_push
      add constraint xat_dispositius_push_sessio_fk
      foreign key (sessio_id) references auth.sessions(id) on delete cascade;
  end if;
end;
$$;
create index if not exists xat_dispositius_push_sessio_idx
  on public.xat_dispositius_push(sessio_id);

-- La RPC existent conserva plataforma, límits, consentiment i canvi d'amo.
-- El trigger aporta la identitat de sessió exclusivament del JWT verificat
-- per PostgREST i comprova també el propietari a Auth. Cap paràmetre nou
-- permet al navegador triar sessió o elevar una altra persona.
create or replace function private.xat_push_vincula_sessio_r31()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
  v_sessio uuid;
  v_claim text := (select auth.jwt()->>'session_id');
begin
  if v_jo is null or new.usuari_id is distinct from v_jo
    or v_claim is null
    or v_claim !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'SDP-PUSH-013: cal una sessio vigent per als avisos.' using errcode='42501';
  end if;
  v_sessio := v_claim::uuid;
  if not exists (select 1 from auth.sessions s where s.id=v_sessio and s.user_id=v_jo) then
    raise exception 'SDP-PUSH-013: cal una sessio vigent per als avisos.' using errcode='42501';
  end if;
  new.sessio_id := v_sessio;
  return new;
end;
$$;
revoke all on function private.xat_push_vincula_sessio_r31() from public,anon,authenticated,service_role;
drop trigger if exists xat_push_vincula_sessio_r31 on public.xat_dispositius_push;
create trigger xat_push_vincula_sessio_r31
  before insert or update on public.xat_dispositius_push
  for each row execute function private.xat_push_vincula_sessio_r31();

-- sessio_id no es publica ni es concedix: continua la lectura RLS per usuari
-- de les úniques columnes innòcues ja autoritzades en 2611020417.
notify pgrst,'reload schema';
commit;
