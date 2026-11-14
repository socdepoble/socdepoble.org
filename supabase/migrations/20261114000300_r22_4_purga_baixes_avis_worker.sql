-- ============================================================================
-- 20261114000300 · R22.4 · Purga de baixes: assaig abans de destruir i avís del
-- worker (arrel R09, D-PURGA, del receptari de l'Eix B, dossier de Fable 5.2).
-- NO aplicada: la revisa i l'aplica el Mestre, mai un agent.
--
-- Què fa: torna a crear private.purga_una_baixa(uuid) partint de l'última
-- definició de Git (2611110100_cua_purga_storage_ugc.sql, el mateix cos que
-- producció, md5 8270ef8f64ef15c4ea6e80e75a6a0037) amb el pegat de
-- gauntlet/proves_verificadors/eixb-baixes-rgpd-r1/pegat_purga_una_baixa_r22.sql:
--   1 · B-baixes-rgpd-1 · Assaig: en la primera passada, abans d'esborrar res,
--       fa «delete from auth.users» dins d'un bloc que sempre es desfà (i força
--       els disparadors diferits). Si una clau forana o un disparador l'hauria
--       de parar al final, l'error ix ara, amb tot intacte i la baixa encara
--       cancel·lable, en lloc de deixar un compte mig purgat (notes i
--       publicacions esborrades i la cancel·lació tancada, SDP-BAIXA-041).
--   2 · B-baixes-rgpd-2 · Avís SDP-BAIXA-044 a private.baixes.ultim_error
--       quan la cua de fitxers porta més de 24 h sense que el worker
--       purga-fitxers la reclame (hui eixe cas no deixava cap rastre). Es
--       neteja sol quan la cua es desbloqueja, com l'SDP-BAIXA-043.
--   3 · A-sessio-auth-r1-3 · Abans de l'assaig, esborra les files de
--       private.xat_iaia_jobs de qui se'n va (requester_id o missatge font
--       seu): les seues claus foranes no tenen ON DELETE i, amb una sola
--       pregunta a la IAIA, el compte no es podria purgar mai.
--   4 · B-deriva-esquema-6 · Torna la clau town_memberships_user_id_fkey
--       (ON DELETE CASCADE, 2609080000) que producció no té: sense ella, la
--       pertinença al poble sobreviu al compte. NOT VALID i validada només si
--       no hi ha cap pertinença òrfena (avís si n'hi ha).
-- Mateixa signatura, mateix retorn i mateixos permisos (cap rol de l'API la
-- pot executar). NO programa cap planificador: l'ordre del Runbook (apartat
-- R09) és worker desplegat i provat, pg_cron i pg_net, el planificador del
-- worker amb un 200, i només al final el de private.purga_baixes_vencudes.
--
-- Ordre d'aplicació (Runbook del Mestre, apartat 2.0, pas 10): després de la
-- 20261114000100 (sense ella la purga d'una propietària falla igualment) i
-- abans de programar cap purga. Depén de 2611110100 i 20261114000100.
--
-- Precondicions: la sonda de l'Annex 1 ha de donar
-- fk_storage_objects_cap_a_auth_users = 0 (si storage.objects tinguera una
-- clau antiga cap a auth.users, l'assaig fallaria per a tota persona amb
-- fitxers en lloc d'anotar SDP-BAIXA-042). Efecte de cost (B-rendiment-1): la primera passada fa
-- l'esborrat d'Auth dues vegades (l'assaig i el de veritat); amb molt
-- d'historial de xat és lent. El lock_timeout de 5 s no afecta l'execució.
--
-- Com tornar enrere: tornar a aplicar, dins d'una transacció, el bloc
-- «create or replace function private.purga_una_baixa» de 2611110100 (des de
-- la línia 236) i el seu revoke (línia 527). La clau de town_memberships és
-- la de Git i es queda.
--
-- Abans (lectura):
-- select char_length(p.prosrc) as purga_llargaria, position('SDP-BAIXA-ASSAIG' in p.prosrc) > 0 as ja_te_assaig from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.purga_una_baixa(uuid)');
-- select count(*) as baixes, count(*) filter (where b.purga_fitxers_iniciada_al is not null) as iniciades from private.baixes b;
-- select count(*) as pertinences_orfes from public.town_memberships tm where not exists (select 1 from auth.users u where u.id = tm.user_id);
-- Verificació posterior (lectura):
-- select position('SDP-BAIXA-044' in p.prosrc) > 0 as te_avis_044, position('SDP-BAIXA-ASSAIG' in p.prosrc) > 0 as te_assaig from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.purga_una_baixa(uuid)');
-- select k.conname, k.convalidated from pg_catalog.pg_constraint k where k.conrelid = 'public.town_memberships'::regclass and k.contype = 'f';
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function private.purga_una_baixa(p_uid uuid)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  r     record;
  v_nou uuid;
  v_dies_apple integer;
  v_inici timestamptz;
begin
  select b.purga_fitxers_iniciada_al into v_inici
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
  if v_inici is null and to_regclass('private.autoritzacions_apple') is not null then
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

  -- Amb l’Auth bloquejat, una pujada concurrent es completa abans de la
  -- foto de Storage o es rebutja en arribar a la guarda.
  perform 1 from auth.users u where u.id = p_uid for update;
  if not found then return false; end if;
  update private.baixes b
     set purga_fitxers_iniciada_al = coalesce(b.purga_fitxers_iniciada_al, now())
   where b.user_id = p_uid;

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

  -- R22 (A-sessio-auth-r1-3) · Les peticions a la IAIA de qui se'n va.
  -- private.xat_iaia_jobs referencia auth.users, xat_missatges i xat_fils sense
  -- ON DELETE: una sola fila pararia l'esborrat d'Auth per sempre (l'assaig ho
  -- diria cada nit). Són seues (requester_id o missatge font seu) i només
  -- servixen a la feina en curs. Dos if, com Apple: sense la taula, no es prepara.
  if to_regclass('private.xat_iaia_jobs') is not null then
    if exists (select 1 from private.xat_iaia_jobs j where j.requester_id = p_uid
               or j.source_id in (select m.id from public.xat_missatges m where m.usuari_id = p_uid)) then
      delete from private.xat_iaia_jobs j
       where j.requester_id = p_uid
          or j.source_id in (select m.id from public.xat_missatges m where m.usuari_id = p_uid);
    end if;
  end if;

  -- R22 (Eix B, baixes-rgpd) · Assaig abans de destruir res. La primera passada
  -- esborra notes i publicacions i tanca la cancel·lació (SDP-BAIXA-041) abans
  -- de saber si el «delete from auth.users» del final pot passar. Si una clau
  -- forana o un disparador el para, el compte queda mig purgat per sempre.
  -- L'assaig fa l'esborrat dins d'un bloc que sempre es desfà: si falla, l'error
  -- ix ara, amb tot intacte i la baixa encara cancel·lable.
  if v_inici is null then
    begin
      delete from auth.users where id = p_uid;
      set constraints all immediate;
      raise exception 'SDP-BAIXA-ASSAIG' using errcode = 'SDP99';
    exception when sqlstate 'SDP99' then
      null;
    end;
  end if;

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

  perform private.encua_storage_ugc(p_uid);
  -- El lot confirma la cua abans que el worker puga esborrar el binari.
  -- L'absència de metadades pot precedir la resposta de Storage. La baixa
  -- espera la confirmació del worker abans d'esborrar Auth.
  -- Una fila que ha esgotat els intents o que cau en un bucket amb versionat
  -- ja no es reclama: la baixa ho anota amb SDP-BAIXA-043 perquè l'operador
  -- ho revise, i ho torna a llevar quan la cua ja no està bloquejada.
  if exists (select 1 from public.cua_purga_storage_ugc c
    where c.user_id = p_uid and not c.referenciat) then
    update private.baixes b
       set ultim_intent_al = now(),
           ultim_error = case
             when exists (select 1 from public.cua_purga_storage_ugc c
               where c.user_id = p_uid and not c.referenciat
                 and (c.intents >= coalesce((select greatest(1, least(a.valor::integer, 100))
                       from private.ajustos a
                      where a.clau = 'purga_fitxers_max_intents' and a.valor ~ '^[0-9]{1,3}$'), 10)
                   or not private.storage_ugc_bucket_no_versionat(c.bucket_id)))
               then 'SDP-BAIXA-043: fitxers bloquejats a la cua; cal revisió de l''operador.'
             when exists (select 1 from public.cua_purga_storage_ugc c
               where c.user_id = p_uid and not c.referenciat and c.intents = 0
                 and c.creat_al < now() - interval '24 hours')
               then 'SDP-BAIXA-044: fitxers a la cua sense reclamar des de fa més de 24 h; el worker purga-fitxers no corre.'
             when b.ultim_error like 'SDP-BAIXA-043%' or b.ultim_error like 'SDP-BAIXA-044%' then null
             else b.ultim_error
           end
     where b.user_id = p_uid;
    return false;
  end if;

  -- La propietat de fitxers compartits queda intacta. En un Storage vell
  -- amb FK restrictiva, l'operador ha de reassignar estos fitxers. Una FK
  -- en cascada tampoc ha d'esborrar-ne només la metadada.
  if exists (select 1 from storage.objects o where o.owner = p_uid)
     and exists (select 1 from pg_catalog.pg_constraint k
       where k.contype = 'f' and k.conrelid = 'storage.objects'::regclass
         and k.confrelid = 'auth.users'::regclass and k.confdeltype in ('a', 'r', 'c')
         and exists (select 1 from pg_catalog.pg_attribute col
           where col.attrelid = k.conrelid and col.attname = 'owner' and col.attnum = any(k.conkey))) then
    update private.baixes set ultim_intent_al = now(),
      ultim_error = 'SDP-BAIXA-042: propietat de Storage pendent de reassignar.'
      where user_id = p_uid;
    return false;
  end if;

  -- Cascada: perfil, pertinences, rols, reclamacions, missatges i lectures del
  -- xat, incidències, la pròpia baixa i els consentiments (que passen a bloqueig).
  delete from auth.users where id = p_uid;
  -- Les files referenciades no tenen camí de purga: no conserven l'UUID ni
  -- la ruta d'un compte suprimit. Els objectes compartits continuen a Storage
  -- amb l'owner_id del compte suprimit i en cal una revisió de l'operador.
  delete from public.cua_purga_storage_ugc where user_id = p_uid and referenciat;

  -- Fils que ja no són de ningú.
  delete from public.xat_fils f
   where f.creat_per is null
     and f.subjecte_tipus is null
     and not exists (select 1 from public.xat_participants p where p.fil_id = f.id);
  return true;
end;
$$;
revoke all on function private.purga_una_baixa(uuid) from public, anon, authenticated, service_role;

-- B-deriva-esquema-6 · Producció no té town_memberships_user_id_fkey
-- (2609080000): sense ella, la purga (i tot esborrat d'Auth) deixa la
-- pertinença al poble d'un compte que ja no existix. NOT VALID i validada
-- només si cap fila és òrfena; si n'hi ha, avisa i es queda NOT VALID (s'aplica
-- igual a tot esborrat nou). Les òrfenes velles són decisió del Mestre.
do $$
declare v_orfes bigint;
begin
  if not exists (select 1 from pg_catalog.pg_constraint k
                  where k.conrelid = 'public.town_memberships'::regclass and k.contype = 'f'
                    and k.confrelid = 'auth.users'::regclass) then
    alter table public.town_memberships add constraint town_memberships_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade not valid;
  end if;
  if exists (select 1 from pg_catalog.pg_constraint k
              where k.conrelid = 'public.town_memberships'::regclass and k.conname = 'town_memberships_user_id_fkey'
                and not k.convalidated) then
    select count(*) into v_orfes from public.town_memberships tm
     where not exists (select 1 from auth.users u where u.id = tm.user_id);
    if v_orfes = 0 then
      alter table public.town_memberships validate constraint town_memberships_user_id_fkey;
    else
      raise notice 'R22.4 · town_memberships_user_id_fkey queda NOT VALID: % pertinences de comptes que ja no existixen.', v_orfes;
    end if;
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
