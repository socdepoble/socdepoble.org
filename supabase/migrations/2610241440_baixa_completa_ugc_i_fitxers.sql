-- ============================================================================
-- 261024_1440 · T8 (P0-20; pla 261024_1315; auditoria Codex 261024_1315 C-06)
-- · La baixa completa: la purga esborra les publicacions personals, la cua
-- de fitxers té qui la buida (la funció purga-fitxers) i cap compte amb una
-- autorització d'Apple per revocar no es purga sense esperar-la.
-- NO aplicada: cap agent no l'executa contra cap base remota.
-- L'aplica el Mestre, mai un agent.
-- Additiva i idempotent: es pot tornar a executar. Va ABANS de desplegar la
-- funció supabase/functions/purga-fitxers: sense ella, el worker rep PGRST202
-- i no esborra cap fitxer.
--
-- Depén de: 2609261500 (private.baixes, private.purga_storage_pendent,
-- private.ajustos, private.hash_subjecte i purga_baixes_vencudes) i
-- 2609282100 (la purga vigent, que ací es copia), aplicades de veres. La porta
-- d'Apple, de 2610241420 (T1: private.autoritzacions_apple i
-- private.revocacions_apple): mentre no hi siga, to_regclass la deixa
-- apagada i la purga fa com abans (sense taula, no hi ha cap autorització
-- custodiada que revocar); quan s'aplique, la porta s'encén sola.
--
-- QUÈ FA:
--   1. private.ajustos: dies_espera_revocacio_apple (7) i
--      purga_fitxers_max_intents (10), només si no hi són.
--   2. private.purga_storage_pendent: intents, ultim_error (200 caràcters com
--      a molt) i ultim_intent_al, i l'índex parcial de la cua viva. Tot
--      revocat, també a service_role: el worker només hi entra per les RPC.
--   3. private.purga_una_baixa: la de 2609282100 LITERAL, amb tres canvis i
--      prou (src/data/supabase/baixaCompleta.migracio.test.js ho comprova):
--      a) La porta d'Apple, just després de tornar a llegir i bloquejar la
--         baixa. Si queda una fila a private.autoritzacions_apple i la purga
--         prevista no fa encara dies_espera_revocacio_apple dies (de 0 a 30),
--         la d'esta persona s'atura amb SDP-BAIXA-030: purga_baixes_vencudes
--         l'anota a private.baixes (intents, ultim_error) i l'endemà ho torna
--         a provar. Passada l'espera, deixa a private.revocacions_apple una
--         fila 'purga' / 'purgat_sense_revocar' amb l'empremta amb pebre (mai
--         l'uid) i l'últim error, i continua: no es pot retindre un compte
--         per sempre perquè Apple o els secrets fallen (RGPD art. 5.1.e).
--      b) Les publicacions personals (author_org_id null) s'ESBORREN; abans
--         passaven a l'uuid zero i en quedaven el títol, la descripció i el
--         cos. S'esborren abans de la cua de fitxers: les imatges de la
--         carpeta de la persona que només usaven elles hi entren amb
--         referenciat = false. Les que encara usa una entitat o una altra
--         publicació continuen referenciat = true i es conserven.
--      c) Just abans d'esborrar-les, els fils de pàgina que naixen d'elles
--         (xat_fils amb subjecte_tipus publicacio, producte, esdeveniment o
--         multimedia i subjecte_id = l'id de la publicació) perden la còpia
--         del que ella va escriure: titol = 'Publicació esborrada' i
--         subjecte_titol, subjecte_ruta i subjecte_uri a null (auditoria
--         Codex 261024 D-02, Gemini G2-05.1). El fil i els missatges d'altres
--         persones es queden; subjecte_tipus i subjecte_id (l'uuid, sense
--         cap dada) també: ningú no el pot tornar a obrir (SDP-XAT-013).
--   4. private.purga_baixes_vencudes: la de 2609261500 LITERAL, amb un sol
--      canvi: l'ordre del lot. Primer les baixes vençudes que no han fallat
--      mai (ultim_intent_al null), per data prevista; després les que ja han
--      fallat, primer la que fa més temps que ho va provar. Qui espera la
--      revocació d'Apple falla cada dia amb SDP-BAIXA-030 fins a
--      dies_espera_revocacio_apple dies: amb l'ordre d'abans (només per data
--      prevista), 100 persones així ocupaven el lot sencer i ningú més no es
--      purgava.
--   5. Tres RPC per al worker, SECURITY DEFINER i només per a service_role
--      (permís i guarda auth.role()): purga_fitxers_reclama (un lot amb
--      FOR UPDATE SKIP LOCKED, que suma l'intent i respecta l'espera
--      exponencial de 10 minuts a un dia i el sostre d'intents),
--      purga_fitxers_fets (lleva les files l'objecte de les quals ja no és a
--      storage.objects) i purga_fitxers_fallits (anota l'error).
--
-- QUÈ NO FA:
--   · No esborra cap binari des de SQL ni crida cap URL: cap pg_net, cap http
--     i cap secret. Ho fa la funció purga-fitxers per l'API de Storage, i la
--     programa el Mestre (supabase/README.md, «Funció purga-fitxers»).
--   · No revoca res a Apple: ho fa T1 (la funció compte-apple). Ací només
--     s'espera la revocació i se'n deixa constància.
--   · No toca les publicacions signades per una entitat que continua: són de
--     l'entitat (D10). Les d'un grup que desapareix amb la persona (n'era
--     l'única membre que no estava de baixa) perden l'entitat per la clau
--     forana (on delete set null) i, com que les va escriure ella, ara
--     s'esborren amb les personals; abans es quedaven a l'uuid zero.
--     Conservar-les és decisió del Mestre.
--   · No esborra els fils de pàgina d'una publicació esborrada
--     (xat_fils.subjecte_*, sense clau forana): hi queden els missatges
--     d'altres persones, sense cap còpia del títol (3c). Esborrar els fils
--     sencers és decisió del Mestre (custòdia legal). Quan l'autora esborra
--     ella mateixa una publicació (sense baixa), el fil continua igual que
--     abans, amb el títol: això no ho toca esta migració.
--   · No buida el nom d'un grup que desapareix amb la persona als fils
--     d'eixe grup (titol, subjecte_titol): és el nom de l'entitat, no una
--     publicació seua. Buidar-lo és decisió del Mestre.
--   · No toca les denúncies sobre una publicació esborrada
--     (public.denuncies.objecte_id, text sense clau forana): són historial de
--     moderació (2610201500).
--   · No canvia demana_baixa ni cancela_baixa: durant la quarantena tot es
--     pot desfer com abans; només la purga esborra.
--   · No esborra les publicacions que una purga d'abans ja havia passat a
--     l'uuid zero: comptar-les (README) i esborrar-les és decisió del Mestre.
--   · Els fitxers amb referenciat = true i les files amb feta_al (marques a
--     mà d'abans del worker) no les reclama el worker. Les que arriben al
--     sostre d'intents es queden per a revisar-les a mà (README).
--
-- CODIS:
--   SDP-BAIXA-030  la revocació d'Apple encara és pendent (55000): la purga
--                  d'esta persona espera; la resta del lot continua.
--   SDP-PURGA-000  només el servidor (42501).
--   SDP-PURGA-001  paràmetre invàlid (22023).
--   SDP-PURGA-002  l'objecte encara és a Storage (anotat a ultim_error, no és
--                  cap excepció: la fila torna a la cua).
-- ============================================================================
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Ajustos ──────────────────────────────────────────────────────────────
-- Si T1 ja l'ha posat, no es toca.
insert into private.ajustos (clau, valor)
values
  ('dies_espera_revocacio_apple', '7'),
  ('purga_fitxers_max_intents', '10')
on conflict (clau) do nothing;


-- ── 2 · La cua de fitxers: intents, error i darrer intent ────────────────────
alter table private.purga_storage_pendent
  add column if not exists intents integer not null default 0;
alter table private.purga_storage_pendent
  add column if not exists ultim_error text check (ultim_error is null or char_length(ultim_error) <= 200);
alter table private.purga_storage_pendent
  add column if not exists ultim_intent_al timestamptz;
create index if not exists purga_storage_pendent_cua
  on private.purga_storage_pendent (creat_al, id)
  where not referenciat and feta_al is null;
-- Mandat Supabase 30-Oct-2026: tot revocat. Cap permís de taula: el worker
-- només entra per les RPC de la secció 5.
revoke all on table private.purga_storage_pendent from public, anon, authenticated, service_role;


-- ── 3 · La purga d'una baixa esborra el que era seu ─────────────────────────
-- La de 2609282100 sencera, més la porta d'Apple, la neteja dels títols als
-- fils de pàgina i l'esborrat de les publicacions personals (vegeu la
-- capçalera).
create or replace function private.purga_una_baixa(p_uid uuid)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  r     record;
  v_nou uuid;
  v_dies_apple integer;
begin
  perform 1
  from private.baixes b
  where b.user_id = p_uid
    and b.purga_prevista_al <= now()
  for update;
  if not found then
    return false;
  end if;

  -- T8 (261024; T1, P0-04) · La porta d'Apple. Mentre quede una autorització
  -- per revocar, la purga espera fins a dies_espera_revocacio_apple dies
  -- després de la data prevista (SDP-BAIXA-030, que purga_baixes_vencudes
  -- anota sense parar la resta). Passada l'espera, en deixa constància amb
  -- l'empremta i continua. Sense la taula de T1 no n'hi ha cap: dos if, i no
  -- un sol «and», perquè la consulta no es prepare si la taula no hi és.
  if to_regclass('private.autoritzacions_apple') is not null then
    if exists (select 1 from private.autoritzacions_apple a where a.user_id = p_uid) then
      begin
        select greatest(0, least(a.valor::integer, 30)) into v_dies_apple
        from private.ajustos a where a.clau = 'dies_espera_revocacio_apple';
      exception when invalid_text_representation then
        v_dies_apple := null;
      end;
      v_dies_apple := coalesce(v_dies_apple, 7);
      if exists (select 1 from private.baixes b
                  where b.user_id = p_uid
                    and b.purga_prevista_al > now() - make_interval(days => v_dies_apple)) then
        raise exception 'SDP-BAIXA-030: la revocació d''Apple encara és pendent.' using errcode = '55000';
      end if;
      insert into private.revocacions_apple (subjecte_hash, origen, resultat, detall)
      select private.hash_subjecte(p_uid::text), 'purga', 'purgat_sense_revocar', left(a.ultim_error, 200)
      from private.autoritzacions_apple a
      where a.user_id = p_uid;
    end if;
  end if;

  -- T2 · Grups on és propietària: un grup ha de tindre exactament una
  -- propietària (comprova_una_propietaria). Passa a qui l'administra o, si no,
  -- al membre més antic que no estiga de baixa. Si no queda ningú, el grup
  -- desapareix: les publicacions que hi signaven altres conserven la
  -- signatura (D10) i les d'ella, sense entitat, s'esborren amb les personals.
  for r in
    select m.organization_id
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = p_uid and m.role = 'owner' and o.kind = 'group'
  loop
    v_nou := null;
    select m2.user_id into v_nou
    from public.organization_memberships m2
    where m2.organization_id = r.organization_id
      and m2.user_id <> p_uid
      and not exists (select 1 from private.baixes b where b.user_id = m2.user_id)
    order by (m2.role = 'admin') desc, m2.created_at asc
    limit 1;

    if v_nou is null then
      delete from public.organizations where id = r.organization_id;
    else
      update public.organization_memberships
         set role = 'owner'
       where organization_id = r.organization_id and user_id = v_nou;
      delete from public.organization_memberships
       where organization_id = r.organization_id and user_id = p_uid;
    end if;
  end loop;

  -- D12, revisada per T8 (261024; auditoria Codex C-06): les notes (privades)
  -- i les publicacions personals (també les de la secció notes) s'esborren.
  -- Abans les publicacions passaven a l'uuid zero i en quedaven el títol, la
  -- descripció i el cos, que poden portar dades de la persona. Les signades
  -- per una entitat són de l'entitat i no es toquen. Van abans de la cua de
  -- fitxers: les imatges que només usaven elles deixen d'estar referenciades.
  delete from public.notes where owner_user_id = p_uid;
  -- D-02 (Codex 261024; Gemini G2-05.1) · Els fils de pàgina d'eixes
  -- publicacions es queden amb els missatges d'altres persones, però sense la
  -- còpia del que ella va escriure. La correspondència secció → subjecte és la
  -- de private.xat_subjecte (2609282100, i la vigent de 2610042330). Abans de
  -- l'esborrat: després ja no se sap quines eren.
  update public.xat_fils f
     set titol = 'Publicació esborrada',
         subjecte_titol = null,
         subjecte_ruta = null,
         subjecte_uri = null
    from public.section_submissions s
   where s.owner_user_id = p_uid
     and s.author_org_id is null
     and f.tenant_id = s.tenant_id
     and f.subjecte_id = s.id::text
     and f.subjecte_tipus = case s.section_id when 'mur' then 'publicacio' when 'mercat' then 'producte'
                              when 'events' then 'esdeveniment' when 'multimedia' then 'multimedia' end;
  delete from public.section_submissions s
   where s.owner_user_id = p_uid
     and s.author_org_id is null;

  -- Fitxers: a la cua. Els que encara usa una entitat o una publicació es
  -- marquen com a referenciats i es conserven. Es compara amb el bucket
  -- inclòs (casa amb sdp-media://<bucket>/<nom> i amb /object/public/<bucket>/<nom>):
  -- la còpia pública d'un adjunt té el mateix nom que l'original privat, i
  -- només la pública és la referenciada. Les imatges del cos de la fitxa
  -- d'una entitat (presentacio_html) també són seues.
  begin
    insert into private.purga_storage_pendent (user_id, bucket_id, nom, referenciat)
    select p_uid, o.bucket_id, o.name,
           exists (select 1 from public.organizations org
                    where right(coalesce(org.logo_url, ''), char_length(o.bucket_id || '/' || o.name)) = o.bucket_id || '/' || o.name
                       or right(coalesce(org.hero_url, ''), char_length(o.bucket_id || '/' || o.name)) = o.bucket_id || '/' || o.name
                       or strpos(coalesce(org.presentacio_html, ''), o.bucket_id || '/' || o.name) > 0)
        or exists (select 1 from public.section_submissions s
                    where strpos(s.payload::text, o.bucket_id || '/' || o.name) > 0)
    from storage.objects o
    where o.bucket_id in ('mitjans', 'mitjans_privats')
      and ((storage.foldername(o.name))[2] = p_uid::text
        or (cardinality(storage.foldername(o.name)) = 1 and (storage.foldername(o.name))[1] = p_uid::text))
    on conflict (bucket_id, nom) do nothing;
  exception when insufficient_privilege or undefined_table or undefined_function then
    raise notice 'SDP-BAIXA-020: sense accés a storage.objects per a %.', p_uid;
  end;

  -- Cascada: perfil, pertinences, rols, reclamacions, missatges i lectures del
  -- xat, incidències, la pròpia baixa i els consentiments (que passen a bloqueig).
  delete from auth.users where id = p_uid;

  -- Fils que ja no són de ningú.
  delete from public.xat_fils f
   where f.creat_per is null
     and f.subjecte_tipus is null
     and not exists (select 1 from public.xat_participants p where p.fil_id = f.id);
  return true;
end;
$$;
revoke execute on function private.purga_una_baixa(uuid) from public, anon, authenticated;


-- ── 4 · El lot de cada dia: qui espera Apple no tapa la resta ────────────────
-- La de 2609261500 sencera, amb un sol canvi: l'ordre del lot (vegeu la
-- capçalera). Les que no han fallat mai van primer; les que ja han fallat
-- (SDP-BAIXA-030 o qualsevol altre error), darrere i per torns, primer la
-- que fa més temps que ho va provar. La programació (sdp-purga-baixes) i la
-- crida purga_baixes_vencudes(100) no canvien.
create or replace function private.purga_baixes_vencudes(p_limit integer default 100)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  r       record;
  v_fetes integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtext('sdp-purga-baixes')) then
    return 0;
  end if;

  for r in
    select b.user_id
    from private.baixes b
    where b.purga_prevista_al <= now()
    order by b.ultim_intent_al asc nulls first, b.purga_prevista_al asc
    limit greatest(1, least(coalesce(p_limit, 100), 1000))
  loop
    begin
      -- Només compta el que s'ha purgat de veres (una cancel·lació pel camí, no).
      if not private.purga_una_baixa(r.user_id) then
        continue;
      end if;
      -- El trigger diferit d'una propietària salta ací, dins del bloc, i no al
      -- COMMIT: una persona que falla no tomba la purga de la resta.
      set constraints all immediate;
      set constraints all deferred;
      v_fetes := v_fetes + 1;
    exception when others then
      update private.baixes
         set intents = intents + 1,
             ultim_error = left(sqlstate || ': ' || sqlerrm, 500),
             ultim_intent_al = now()
       where user_id = r.user_id;
    end;
  end loop;

  -- Bloqueig: fins a 3 anys (prescripció, LOPDGDD arts. 72-74).
  delete from private.consentiments_bloquejats where bloquejat_al < now() - interval '3 years';
  return v_fetes;
end;
$$;
revoke execute on function private.purga_baixes_vencudes(integer) from public, anon, authenticated;


-- ── 5 · Les RPC del worker purga-fitxers (només service_role) ────────────────
-- Les tres porten la guarda d'auth.role() a més del permís: una RPC pública
-- de Supabase naix amb EXECUTE per a anon i authenticated, i el permís es
-- revoca ací mateix, dins de la transacció.

-- Un lot de la cua. FOR UPDATE SKIP LOCKED: dos passades alhora no es
-- reparteixen la mateixa fila. Reclamar suma l'intent i en fixa l'hora, i
-- eixa hora fa de reserva: la fila no torna fins que passa l'espera
-- exponencial (10 minuts després del primer intent, el doble a cada intent,
-- un dia com a molt), també si el worker cau abans de dir res. Les que han
-- arribat a purga_fitxers_max_intents (10 per defecte, d'1 a 100) es queden
-- per a revisar-les a mà.
create or replace function public.purga_fitxers_reclama(p_limit integer default 50)
returns table (id bigint, bucket_id text, nom text, intents integer)
language plpgsql volatile security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_maxim integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PURGA-000: només el servidor.' using errcode = '42501';
  end if;

  begin
    select greatest(1, least(a.valor::integer, 100)) into v_maxim
    from private.ajustos a where a.clau = 'purga_fitxers_max_intents';
  exception when invalid_text_representation then
    v_maxim := null;
  end;
  v_maxim := coalesce(v_maxim, 10);

  return query
  with triades as (
    select c.id
    from private.purga_storage_pendent c
    where not c.referenciat
      and c.feta_al is null
      and c.intents < v_maxim
      and (c.ultim_intent_al is null
        or c.ultim_intent_al <= now() - least(make_interval(mins => (5 * 2 ^ least(c.intents, 9))::integer), interval '1 day'))
    order by c.creat_al, c.id
    limit greatest(1, least(coalesce(p_limit, 50), 200))
    for update of c skip locked
  )
  update private.purga_storage_pendent p
     set intents = p.intents + 1,
         ultim_intent_al = now()
    from triades t
   where p.id = t.id
  returning p.id, p.bucket_id, p.nom, p.intents;
end;
$$;

-- Fets: només les files reclamades l'objecte de les quals ja no és a
-- storage.objects. Un 200 de Storage que no l'haguera esborrat no buida la
-- cua: la fila es queda amb SDP-PURGA-002 i torna després de l'espera.
create or replace function public.purga_fitxers_fets(p_ids bigint[])
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_fetes integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PURGA-000: només el servidor.' using errcode = '42501';
  end if;
  if p_ids is null or cardinality(p_ids) not between 1 and 1000 then
    raise exception 'SDP-PURGA-001: paràmetre invàlid.' using errcode = '22023';
  end if;

  delete from private.purga_storage_pendent p
   where p.id = any (p_ids)
     and not p.referenciat
     and p.feta_al is null
     and p.intents > 0
     and not exists (select 1 from storage.objects o
                      where o.bucket_id = p.bucket_id and o.name = p.nom);
  get diagnostics v_fetes = row_count;

  update private.purga_storage_pendent p
     set ultim_error = 'SDP-PURGA-002: l''objecte encara és a Storage.'
   where p.id = any (p_ids)
     and not p.referenciat
     and p.feta_al is null
     and p.intents > 0;
  return v_fetes;
end;
$$;

-- Fallits: només s'anota l'error (l'intent ja el va sumar la reclamació). El
-- text el posa el worker (cap nom d'objecte) i es talla a 200 caràcters.
create or replace function public.purga_fitxers_fallits(p_ids bigint[], p_error text)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_n integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PURGA-000: només el servidor.' using errcode = '42501';
  end if;
  if p_ids is null or cardinality(p_ids) not between 1 and 1000 then
    raise exception 'SDP-PURGA-001: paràmetre invàlid.' using errcode = '22023';
  end if;

  update private.purga_storage_pendent p
     set ultim_error = left(coalesce(nullif(btrim(p_error), ''), 'sense detall'), 200)
   where p.id = any (p_ids)
     and p.feta_al is null
     and p.intents > 0;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.purga_fitxers_reclama(integer) from public, anon, authenticated, service_role;
revoke all on function public.purga_fitxers_fets(bigint[]) from public, anon, authenticated, service_role;
revoke all on function public.purga_fitxers_fallits(bigint[], text) from public, anon, authenticated, service_role;
grant execute on function public.purga_fitxers_reclama(integer) to service_role;
grant execute on function public.purga_fitxers_fets(bigint[]) to service_role;
grant execute on function public.purga_fitxers_fallits(bigint[], text) to service_role;

notify pgrst, 'reload schema';
commit;
