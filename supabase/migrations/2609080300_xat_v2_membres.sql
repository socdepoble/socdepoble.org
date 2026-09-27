-- ==============================================================================
-- MIGRACIÓ: Xat v2 · DIRECTORI DEL POBLE (260908)
-- ==============================================================================
-- S'aplica DESPRÉS de 260908_xat_v2_correccions.sql. És idempotent.
--
-- PER QUÈ EXISTIX
-- ───────────────
-- `crea_fil_directe(p_tenant_id, p_altre_usuari, p_titol)` necessita l'uuid de
-- l'altra persona, i no hi havia CAP manera d'obtindre'l des del client:
--   · `profiles read own` només deixa llegir el teu propi perfil.
--   · `town_memberships` no té cap política de lectura per a tercers.
-- El botó «Nova conversa» era, literalment, impossible d'implementar.
--
-- ⚠ DECISIÓ DE GOVERNANÇA, NO TÈCNICA ⚠
-- ─────────────────────────────────────
-- Aquesta funció obri una cosa que fins ara estava tancada: el NOM de la resta
-- de veïns del teu poble. És el mínim imprescindible perquè un xat existisca
-- (no pots escriure a qui no pots trobar), però continua sent una obertura.
--
-- El que NO s'obri, i convé que quede escrit:
--   · correu electrònic          · data d'alta          · rol al poble
--   · `visibility`               · `consentiment_rgpd_at`
--   · qualsevol dada d'un poble del qual TU no eres membre
--
-- Això afecta LLEI_05_Privacitat i el text de la pàgina legal, que ara mateix
-- diu que les dades personals «mai es comparteixen sense consentiment». Un
-- directori de noms visible per als covilatans és una cessió intracomunitària:
-- defensable, però ha d'estar escrita i, idealment, consentida. Decisió del
-- Mestre (Veto Presidencial), no meua.
--
-- Al final del fitxer hi ha, comentat, el filtre per consentiment RGPD.
-- ==============================================================================


create or replace function public.membres_del_poble(
  p_tenant_id uuid,
  p_cerca     text default null,
  p_limit     integer default 100
)
returns table (
  usuari_id uuid,
  nom       text,
  fil_id    uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;

  -- DIVULGACIÓ MÍNIMA, PORTA 1: només si TU eres membre d'aquest poble.
  -- Sense esta comprovació, qualsevol autenticat podria enumerar el padró de
  -- tots els pobles de la instància passant uuids fins encertar-ne un.
  if not exists (
    select 1 from public.town_memberships m
    where m.town_id = p_tenant_id and m.user_id = v_jo
  ) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;

  return query
    select
      pr.id,
      coalesce(pr.full_name, 'Veí')::text,
      -- Si ja teniu conversa oberta, es torna el seu id. Així la interfície
      -- pot navegar-hi directament sense fer cap escriptura: obrir un fil que
      -- ja existix no ha de tocar la base de dades.
      (
        select f.id
        from public.xat_fils f
        where f.tenant_id = p_tenant_id
          and (select count(*) from public.xat_participants xp where xp.fil_id = f.id) = 2
          and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = v_jo)
          and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = pr.id)
        order by f.creat_al asc
        limit 1
      )
    from public.town_memberships m
    join public.profiles pr on pr.id = m.user_id
    where m.town_id = p_tenant_id
      -- DIVULGACIÓ MÍNIMA, PORTA 2: mai tu mateix. `crea_fil_directe` ja
      -- rebutja el fil amb un mateix; ací ni tan sols apareixes a la llista.
      and m.user_id <> v_jo
      and (
        p_cerca is null
        or btrim(p_cerca) = ''
        or pr.full_name ilike '%' || btrim(p_cerca) || '%'
      )
      -- ── FILTRE PER CONSENTIMENT (desactivat a propòsit) ──
      -- Descomenta la línia per excloure del directori qui no haja donat el
      -- consentiment RGPD. NO l'actives sense mirar abans quants perfils el
      -- tenen a null, o el directori es quedarà buit i perdràs una hora
      -- buscant l'error a un altre lloc:
      --     select count(*) filter (where consentiment_rgpd_at is null),
      --            count(*) from public.profiles;
      -- and pr.consentiment_rgpd_at is not null
    order by pr.full_name asc
    limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

revoke execute on function public.membres_del_poble(uuid, text, integer) from public;
revoke execute on function public.membres_del_poble(uuid, text, integer) from anon;
grant  execute on function public.membres_del_poble(uuid, text, integer) to authenticated;


-- Els dos índexs que fan que això no siga un seqüencial quan el poble cresca.
-- `town_memberships(user_id)` ja existix des de l'esquema inicial; falta el
-- camí contrari, que és el que recorre aquesta funció.
create index if not exists idx_town_memberships_town
  on public.town_memberships (town_id);

create index if not exists idx_profiles_full_name
  on public.profiles (full_name);


-- ══════════════════════════════════════════════════════════════════════════
-- COMPROVACIÓ (executa-la amb la sessió d'un tester, no com a postgres:
-- `auth.uid()` és null al SQL Editor i la funció llançarà SDP-XAT-001, que és
-- exactament el comportament correcte).
--
--   select * from public.membres_del_poble('11111111-2222-3333-4444-555555555555');
--
-- Si torna 0 files amb dos testers donats d'alta, mira `town_memberships`:
-- el trigger `handle_new_user` és qui hi inserix la fila, i si l'alta va
-- fallar-hi silenciosament la persona existix a `auth.users` però no és de cap
-- poble. Eixe era el P0 de registre de l'auditoria anterior.
-- ══════════════════════════════════════════════════════════════════════════
