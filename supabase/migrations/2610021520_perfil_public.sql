-- ============================================================================
-- 261002_1520 · La persona al cercador: public.perfil_public(p_id)
-- Ordre del Mestre (261002): «quan algú es registre, se li cree
-- automàticament el seu perfil (Persona) per eixir al cercador».
--
-- La fila ja naix: el trigger d'alta (public.handle_new_user, 2609261500) crea
-- public.profiles i completa_la_meua_alta la repara (el client també la crida
-- des de getProfile quan no troba la fila pròpia). El que faltava era poder-la
-- LLEGIR: la política «profiles read own» només deixa veure la fila pròpia, i
-- src/data/supabase/perfils.js tornava null per a qualsevol altra persona.
--
-- Què obri, per funció i no per política (com membres_del_poble):
--   1. La pròpia persona: la seua fitxa sencera.
--   2. Una fitxa publicada (is_public): sencera, per a qualsevol sessió.
--   3. Una fitxa no publicada: NOMÉS id, full_name, avatar_url i town_name, i
--      només si qui pregunta és membre d'un poble on també ho és ella
--      (town_memberships). És el que diu el text legal vigent
--      (src/sections/text/legalContent.js, §13): el nom i la imatge de perfil
--      són visibles per a la resta de membres del poble.
-- Què NO obri mai: correu, rol, visibility, consentiment_rgpd_at ni
-- baixa_demanada_at; cap persona amb la baixa demanada (quarantena), tampoc a
-- ella mateixa; res sense sessió (anon no té permís i la funció ho exigix).
--
-- Codi nou: SDP-PERFIL-010 (cal la sessió iniciada).
--
-- Additiva i idempotent: una sola funció nova, cap taula, política ni
-- columna. Revisada i NO aplicada a cap base de dades: va després de
-- 2609291230 (i de 2609262232 i 2609282035, que creen copyright i icon).
-- S'ha d'aplicar ABANS de publicar el client: l'adaptador de Supabase declara
-- sempre la capacitat 'directori' (perfils.js exporta loadPerfilPublic) i el
-- cercador enllaça cada persona del padró a /gent/<id>. Sense la funció, el
-- client torna null davant el 404 / PGRST202 i el clic acaba en «Perfil no
-- trobat».
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Les columnes de la fitxa que llig perfilDePersona (perfils.js). En el cas 3
-- les que no són mínimes tornen null i is_public, false.
create or replace function public.perfil_public(p_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  town_name text,
  hero_url text,
  lema text,
  bio text,
  presentacio_html text,
  copyright text,
  icon text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-PERFIL-010: cal la sessió iniciada.' using errcode = '42501';
  end if;
  return query
  select p.id, p.full_name, p.avatar_url, p.town_name,
    case when d.sencera then p.hero_url end,
    case when d.sencera then p.lema end,
    case when d.sencera then p.bio end,
    case when d.sencera then p.presentacio_html end,
    case when d.sencera then p.copyright end,
    case when d.sencera then p.icon end,
    case when d.sencera then coalesce(p.is_public, false) else false end,
    case when d.sencera then p.created_at end,
    case when d.sencera then p.updated_at end
  from public.profiles p
  cross join lateral (select (p.id = v_jo or coalesce(p.is_public, false)) as sencera) d
  where p.id = p_id
    and p.baixa_demanada_at is null
    and (d.sencera or exists (
      select 1
      from public.town_memberships tm_jo
      join public.town_memberships tm_ella on tm_ella.town_id = tm_jo.town_id
      where tm_jo.user_id = v_jo
        and tm_ella.user_id = p.id));
end;
$$;
revoke execute on function public.perfil_public(uuid) from public, anon;
grant execute on function public.perfil_public(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
