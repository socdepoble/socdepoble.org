-- ============================================================================
-- 20261114000200 · R22.3 · Sostres de volum per compte (arrel R07 del
-- receptari de l'Eix B, dossier de Fable 5.2). NO aplicada: la revisa i
-- l'aplica el Mestre, mai un agent.
--
-- Per què: l'alta és oberta (sense correu confirmat ni CAPTCHA) i cap taula
-- d'escriptura directa tenia sostre per compte. Un sol compte gratuït podia
-- omplir els 0,5 GB del pla Free (i llavors Supabase restringix el projecte
-- per a tots els pobles) o fer il·legible el Mur de membres.
--
-- Què fa (límits triats generosos per a ús humà rural; els codis són SDP-*):
--   1 · user_tags (taula heretada, buida, cap lector al client): fora tots els
--       privilegis d'anon i authenticated i les seues tres polítiques. Si la
--       taula no existix (Git), no fa res.
--   2 · notes: disparador private.notes_limita_volum (versió del CONTRAST de
--       rls-red-team-1, eixb-contrasta-rlsroig-1-v7k3/correccio_contrast.sql,
--       triada sobre la del primer verificador perquè la seua fita de 2 MB per
--       nota rebutjava notes legítimes: l'editor desat admet fotos enganxades
--       en data URL de fins a 5 MiB):
--         · una nota: com a molt 8 MiB (SDP-NOTES-MIDA, 22001);
--         · una petició: com a molt 16 MiB entre totes les notes (SDP-NOTES-LOT, 54000);
--         · una persona: com a molt 2000 notes i 50 MiB (SDP-NOTES-QUOTA, 53400),
--           també l'emoticona (notes.icon no té cap fita de longitud);
--         · un canvi que no fa créixer el contingut (paperera, restaurar,
--           publicar-la o retirar-la del Mur, encongir-la) no mira ni la mida
--           ni la quota: qui ja és al sostre pot buidar.
--       I el fusible global private.fusible_mida_bd: si la base passa de
--       350 MiB, cap alta ni canvi de mida a notes (SDP-BD-PLENA, 53100),
--       tampoc un canvi només de l'emoticona (notes.icon, R24 · CODEX-R24-11);
--       enviar a la paperera, restaurar i despublicar continuen.
--   3 · organizations: disparador private.organitzacions_frena_abus (de
--       eixb-verif-orgs-1-q7m2/correccio_recomanada.sql, amb els límits del
--       contrast v2): com a molt 20 organitzacions creades per persona i 5 en
--       un dia (SDP-ORG-429, 42900), i cap empresa ni grup amb nom d'una
--       institució (SDP-ORG-403, 42501). Ajust propi: «hisenda»/«hacienda»
--       fora de la llista, perquè en el món rural és una finca (Hisenda El
--       Molí) i no l'Agència Tributària. D-ORG (decisió del Mestre; R24 ·
--       CODEX-R24-05): només es reserva el nom o l'identificador que COMENÇA
--       per la institució (o que n'és exactament una), amb article o
--       tractament davant si cal («L'Ajuntament», «Excm. Ajuntament»); la
--       puntuació, les cometes i les emoticones de davant no compten.
--       «Forn de l'Ajuntament», «Bar de la Plaça de l'Ajuntament» o «Bar El
--       Policia» són comerços. El superadmin en queda fora.
--   4 · xat: private.trigger_rate_limit_xat conserva la ràfega de R22.0 (15
--       missatges cada 5 s, per a tothom, també la IAIA) i hi afig una quota
--       per hora i per compte: 600 missatges i 4 MiB entre text, metadades i
--       xifrat (SDP-XAT-429, 42900). La IAIA (es_ia) en queda fora, perquè un
--       sol compte respon a totes les converses.
--   5 · section_submissions (Mur i publica_nota_al_mur, que hi escriu):
--       disparador private.publicacions_limita_volum:
--         · created_at el posa el servidor en l'alta (now()); en un canvi el
--           conserva section_submissions_conserva_creacio (2609261200), com
--           fins ara. Ja no es pot fixar una publicació dalt del Mur amb
--           created_at = 'infinity' ni esquivar el recompte amb una data vella;
--         · payload: com a molt 1 MiB al Mur, al Mercat, als Actes i a
--           Multimèdia (el cos ja té el seu sostre de 100.000 caràcters de
--           2611122200) i 8 MiB a la secció de notes, com una nota; un canvi
--           que no el fa créixer sempre passa (SDP-MUR-MIDA, 22001). Disparador
--           i no CHECK: una CHECK es tornaria a avaluar en cada UPDATE de les
--           files velles;
--         · ritme: com a molt 60 publicacions noves per hora i 2000 en total
--           per persona (SDP-MUR-429, 42900). Tornar a publicar la mateixa
--           (upsert del mateix id) no compta.
--       L'únic efecte visible és en el límit: una publicació composta ara i
--       enviada minuts després porta l'hora del servidor.
--   Tots els sostres deixen fora el servidor (service_role) i les sessions
--   sense cap petició de l'API (editor SQL, migracions, planificador i
--   federació del Node 0), amb private.peticio_de_servidor() de 20261114000100.
--   Una petició anònima no hi entra.
--
-- Revisió R24 (codex_sql_port, 14-11-2026): D-ORG (secció 3) i notes.icon al
-- fusible (secció 2), editades al seu lloc perquè esta migració no s'ha
-- aplicat mai a cap base remota. Provat a tests/r22-3-sostres-de-volum-postgres.test.mjs.
--
-- Ordre d'aplicació (Runbook del Mestre, apartat 2.0, pas 7): després de la
-- 20261114000100 i de la 2610081400. Depén de 20261114000100, 2611122200 i
-- 20261113112500.
--
-- Precondicions: cap fila es reescriu. Abans, la sonda de volum de l'Annex 1
-- (R07) per a saber si algú ja passa algun sostre: cap fila es toca, però qui
-- ja passa la quota de notes no en pot crear ni fer créixer cap fins que
-- n'esborre (la paperera, la retirada del Mur, encongir-les i l'esborrat
-- continuen), i una fila vella del Mur més gran que el sostre es pot editar
-- sense créixer.
--
-- Com tornar enrere (dins d'una transacció, només si cal):
--   drop trigger if exists notes_limita_volum on public.notes;
--   drop trigger if exists notes_fusible_mida_bd_alta on public.notes;
--   drop trigger if exists notes_fusible_mida_bd_canvi on public.notes;
--   drop trigger if exists organitzacions_frena_abus on public.organizations;
--   drop trigger if exists section_submissions_limita_volum on public.section_submissions;
--   i private.trigger_rate_limit_xat amb el cos de 20261113112500. Els
--   privilegis de user_tags no es tornen (ningú els usa).
--
-- Abans (lectura):
-- select (select count(*) from public.notes) as notes, (select coalesce(max(octet_length(n.content)), 0) from public.notes n) as nota_max_bytes, (select coalesce(max(octet_length(s.payload::text)), 0) from public.section_submissions s) as publicacio_max_bytes;
-- select (select coalesce(max(c), 0) from (select count(*) as c from public.organizations o group by o.created_by) z) as organitzacions_max_per_persona;
-- Verificació posterior (lectura):
-- select t.tgname from pg_catalog.pg_trigger t where not t.tgisinternal and t.tgname in ('notes_limita_volum', 'notes_fusible_mida_bd_alta', 'notes_fusible_mida_bd_canvi', 'organitzacions_frena_abus', 'section_submissions_limita_volum', 'trg_rate_limit_xat') order by 1;
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ---------------------------------------------------------------------------
-- 1 · user_tags (només existix a producció).
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.user_tags') is not null then
    execute 'revoke all on table public.user_tags from anon, authenticated';
    execute 'drop policy if exists "Users can delete their own tags" on public.user_tags';
    execute 'drop policy if exists "Users can insert their own tags" on public.user_tags';
    execute 'drop policy if exists "Users manage own tags" on public.user_tags';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2 · notes: sostre per nota, per petició i per persona, i fusible global.
-- ---------------------------------------------------------------------------
create index if not exists idx_notes_owner on public.notes (owner_user_id);

create or replace function private.notes_limita_volum()
returns trigger language plpgsql security definer set search_path = ''
as $f$
declare v_fila bigint; v_peticio bigint; v_total bigint; v_n integer; v_creix boolean := true;
begin
  if private.peticio_de_servidor() then return new; end if;
  v_fila := octet_length(to_jsonb(new)::text);
  -- Un canvi que no fa créixer el contingut (paperera, restaurar, publicar o
  -- retirar-la del Mur, encongir-la) no mira ni la mida ni la quota: qui ja és
  -- al sostre ha de poder buidar. L'estat (tres valors fixos) no hi compta. El
  -- lot de la petició el compta igual.
  if tg_op = 'UPDATE' then
    v_creix := octet_length(new.folder_id) + octet_length(new.title) + octet_length(new.copyright)
      + coalesce(octet_length(new.subtitle), 0) + coalesce(octet_length(new.lead), 0) + coalesce(octet_length(new.content), 0)
      + coalesce(octet_length(new.hero_image), 0) + coalesce(octet_length(new.logo_image), 0) + coalesce(octet_length(new.logo_image_dark), 0)
      + coalesce(octet_length(new.icon), 0) + octet_length(new.categories::text) + octet_length(new.tags::text)
      + coalesce(octet_length(new.origen::text), 0) + coalesce(octet_length(new.fitxa::text), 0)
    > octet_length(old.folder_id) + octet_length(old.title) + octet_length(old.copyright)
      + coalesce(octet_length(old.subtitle), 0) + coalesce(octet_length(old.lead), 0) + coalesce(octet_length(old.content), 0)
      + coalesce(octet_length(old.hero_image), 0) + coalesce(octet_length(old.logo_image), 0) + coalesce(octet_length(old.logo_image_dark), 0)
      + coalesce(octet_length(old.icon), 0) + octet_length(old.categories::text) + octet_length(old.tags::text)
      + coalesce(octet_length(old.origen::text), 0) + coalesce(octet_length(old.fitxa::text), 0);
  end if;
  if v_creix and v_fila > 8388608 then
    raise exception 'SDP-NOTES-MIDA: una nota no pot passar de 8 MB.' using errcode = '22001';
  end if;
  v_peticio := coalesce(nullif(current_setting('sdp.notes_bytes_peticio', true), ''), '0')::bigint + v_fila;
  if v_peticio > 16777216 then
    raise exception 'SDP-NOTES-LOT: massa contingut en una sola petició.' using errcode = '54000';
  end if;
  perform set_config('sdp.notes_bytes_peticio', v_peticio::text, true);
  if not v_creix then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp:notes:volum:' || new.owner_user_id::text, 0));
  -- notes.icon (20261114000100) no té cap fita de longitud: compta a la quota.
  select count(*), coalesce(sum(
        octet_length(n.folder_id) + octet_length(n.title) + octet_length(n.copyright) + octet_length(n.status)
      + coalesce(octet_length(n.subtitle), 0) + coalesce(octet_length(n.lead), 0) + coalesce(octet_length(n.content), 0)
      + coalesce(octet_length(n.hero_image), 0) + coalesce(octet_length(n.logo_image), 0) + coalesce(octet_length(n.logo_image_dark), 0)
      + coalesce(octet_length(n.icon), 0)
      + pg_column_size(n.categories) + pg_column_size(n.tags)
      + coalesce(pg_column_size(n.origen), 0) + coalesce(pg_column_size(n.fitxa), 0)), 0)
    into v_n, v_total
    from public.notes n where n.owner_user_id = new.owner_user_id and n.id <> new.id;
  if v_n >= 2000 or v_total + v_fila > 52428800 then
    raise exception 'SDP-NOTES-QUOTA: has arribat al màxim de notes o d''espai.' using errcode = '53400';
  end if;
  return new;
end $f$;
revoke all on function private.notes_limita_volum() from public, anon, authenticated, service_role;
drop trigger if exists notes_limita_volum on public.notes;
create trigger notes_limita_volum before insert or update
  on public.notes for each row execute function private.notes_limita_volum();

create or replace function private.fusible_mida_bd()
returns trigger language plpgsql security definer set search_path = ''
as $f$
begin
  if private.peticio_de_servidor() then return null; end if;
  if pg_database_size(current_database()) > 367001600 then
    raise exception 'SDP-BD-PLENA: el Mas no admet més contingut ara mateix; avisa l''administració.' using errcode = '53100';
  end if;
  return null;
end $f$;
revoke all on function private.fusible_mida_bd() from public, anon, authenticated, service_role;
drop trigger if exists notes_fusible_mida_bd on public.notes;
drop trigger if exists notes_fusible_mida_bd_alta on public.notes;
drop trigger if exists notes_fusible_mida_bd_canvi on public.notes;
create trigger notes_fusible_mida_bd_alta before insert
  on public.notes for each statement execute function private.fusible_mida_bd();
-- R24 · CODEX-R24-11 · Les mateixes columnes que fan créixer una nota a
-- notes_limita_volum, també notes.icon (text sense fita pròpia).
create trigger notes_fusible_mida_bd_canvi before update of folder_id, title, subtitle, lead, content, categories, tags,
    hero_image, logo_image, logo_image_dark, icon, copyright, origen, fitxa
  on public.notes for each statement execute function private.fusible_mida_bd();

-- ---------------------------------------------------------------------------
-- 3 · organizations: alta limitada per persona i noms d'institució reservats.
-- ---------------------------------------------------------------------------
create or replace function private.organitzacions_frena_abus()
returns trigger language plpgsql security definer set search_path = ''
as $f$
declare
  v_jo    uuid := (select auth.uid());
  v_total integer;
  v_dia   integer;
  v_nom   text;
  v_visible text;
begin
  -- Fora: el servidor, les sessions sense API (seeds, editor SQL) i el superadmin.
  if private.peticio_de_servidor() or coalesce(private.es_superadmin(), false) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtextextended('sdp-org-alta:' || coalesce(v_jo::text, ''), 0));
    select count(*), count(*) filter (where o.created_at > now() - interval '1 day')
      into v_total, v_dia
      from public.organizations o
     where o.created_by = v_jo;
    if v_total >= 20 or v_dia >= 5 then
      raise exception 'SDP-ORG-429: has arribat al màxim d''organitzacions que pots crear.' using errcode = '42900';
    end if;
  end if;
  -- El nom i l'identificador es miren en l'alta i en cada canvi: la guarda
  -- només d'INSERT se salta creant «Forn» i reanomenant-lo després.
  if new.kind in ('company', 'group')
     and (tg_op = 'INSERT' or new.name is distinct from old.name
          or new.slug is distinct from old.slug or new.kind is distinct from old.kind) then
    -- El nom que es VEU (crítica de seguretat del lliurament R22): sense la forma de
    -- compatibilitat ni els accents descompostos (NFKD: «Ａｊｕｎｔａｍｅｎｔ», l'espai dur),
    -- sense marques combinants ni caràcters invisibles de format (el guionet opcional,
    -- l'espai d'amplada zero, els bidi), amb les lletres ciríl·liques i gregues que pinten
    -- com les llatines i amb els espais seguits plegats en un (l'HTML ja els plega). La
    -- mateixa regla que el prerender aplica al text d'un veí (tooling/seo/text-veinal.mjs).
    -- D-ORG (R24 · CODEX-R24-05): el nom i l'identificador es miren cada un pel seu
    -- compte i només es reserven si COMENCEN per la institució (o en són exactament
    -- una), amb article o tractament davant. La puntuació, les cometes i les
    -- emoticones no són part del nom: es tornen espai i es retallen, perquè «🏛️
    -- Ajuntament» o «Excm. Ajuntament» no esquiven el principi.
    foreach v_visible in array array[coalesce(new.name, ''), replace(coalesce(new.slug, ''), '-', ' ')] loop
      v_nom := regexp_replace(normalize(v_visible, NFKD),
                 '[̀-ͯ᪰-᫿᷀-᷿⃐-⃿︠-︯­͏؜ᅟᅠ឴឵᠋-᠏​-‏‪-‮⁠-⁯ㅤ︀-️﻿ﾠ\U000e0000-\U000e007f]', '', 'g');
      v_nom := lower(translate(v_nom,
                               'àáâäèéêëìíîïòóôöùúûüÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ·аеіјорсухѕһԁӏԛԝкАВЕІЈКМНОРСТХЅҮУαεικνορτυχΑΒΕΖΗΙΚΜΝΟΡΤΥΧıȷ',
                               'aaaaeeeeiiiioooouuuuaaaaeeeeiiiioooouuuu aeijopcyxshdlqwkabeijkmhopctxsyyaeikvoptuxabezhikmnoptyxij'));
      v_nom := btrim(regexp_replace(v_nom, '[^a-z0-9]+', ' ', 'g'));
      if v_nom ~ ('^((l|la|el|els|les|lo|los|las|m|i|molt|muy|excm|excma|excmo|excel lentissim|excel lentissima|excelentisimo|excelentisima'
                  || '|il lustre|il lustrissim|il lustrissima|ilustre|ilustrisimo|ilustrisima|ilmo|ilma) )*'
                  || '(ajuntament|ayuntamiento|consistori|casa de la vila|alcaldia|diputaci|generalitat|conselleria|policia|guardia civil|jutjat|juzgado|seguretat social|seguridad social)') then
        raise exception 'SDP-ORG-403: este nom és d''una institució; les entitats i els ajuntaments es reclamen.' using errcode = '42501';
      end if;
    end loop;
  end if;
  return new;
end $f$;
revoke all on function private.organitzacions_frena_abus() from public, anon, authenticated, service_role;
drop trigger if exists organitzacions_frena_abus on public.organizations;
create trigger organitzacions_frena_abus
  before insert or update of name, slug, kind on public.organizations
  for each row execute function private.organitzacions_frena_abus();

-- ---------------------------------------------------------------------------
-- 4 · xat: la ràfega de R22.0 i una quota per hora i per compte.
-- ---------------------------------------------------------------------------
create or replace function private.trigger_rate_limit_xat()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rafega int;
  v_hora int;
  v_bytes bigint;
begin
  -- Bloqueig consultiu transaccional per evitar condicions de cursa en ràfegues
  perform pg_advisory_xact_lock(hashtext(new.usuari_id::text));

  select count(*) filter (where m.creat_al > now() - interval '5 seconds'), count(*),
         coalesce(sum(octet_length(coalesce(m.text, '')) + octet_length(coalesce(m.metadades, '{}'::jsonb)::text)
           + coalesce(octet_length(m.xifrat::text), 0)), 0)
    into v_rafega, v_hora, v_bytes
  from public.xat_missatges m
  where m.usuari_id = new.usuari_id
    and m.creat_al > now() - interval '1 hour';

  if v_rafega >= 15 then
    raise exception 'SDP-XAT-429: Has superat el límit de missatges permesos (15/5s).' using errcode = '42900';
  end if;

  if not coalesce(new.es_ia, false) and not private.peticio_de_servidor() then
    if v_hora >= 600 then
      raise exception 'SDP-XAT-429: Has superat el límit de missatges permesos (600/h).' using errcode = '42900';
    end if;
    if v_bytes + octet_length(coalesce(new.text, '')) + octet_length(coalesce(new.metadades, '{}'::jsonb)::text)
        + coalesce(octet_length(new.xifrat::text), 0) > 4194304 then
      raise exception 'SDP-XAT-429: Has superat el volum de missatges permés (4 MB/h).' using errcode = '42900';
    end if;
  end if;

  return new;
end;
$$;
revoke all on function private.trigger_rate_limit_xat() from public, anon, authenticated, service_role;
drop trigger if exists trg_rate_limit_xat on public.xat_missatges;
create trigger trg_rate_limit_xat
  before insert on public.xat_missatges
  for each row
  execute function private.trigger_rate_limit_xat();

-- ---------------------------------------------------------------------------
-- 5 · section_submissions: data del servidor, sostre de payload i ritme.
-- ---------------------------------------------------------------------------
create index if not exists idx_section_submissions_owner_created
  on public.section_submissions (owner_user_id, created_at desc);

create or replace function private.publicacions_limita_volum()
returns trigger language plpgsql security definer set search_path = ''
as $f$
declare
  v_mida bigint := octet_length(coalesce(new.payload, '{}'::jsonb)::text);
  v_sostre bigint := case when new.section_id in ('mur', 'mercat', 'events', 'multimedia') then 1048576 else 8388608 end;
  v_vella bigint;
  v_existix boolean := false;
  v_hora integer;
  v_total integer;
begin
  if private.peticio_de_servidor() then return new; end if;
  if tg_op = 'UPDATE' then
    v_vella := octet_length(coalesce(old.payload, '{}'::jsonb)::text);
  else
    -- Un upsert del mateix id arriba ací abans de saber si serà un canvi.
    select true, octet_length(coalesce(s.payload, '{}'::jsonb)::text) into v_existix, v_vella
      from public.section_submissions s where s.id = new.id;
    v_existix := coalesce(v_existix, false);
    new.created_at := now();
  end if;
  if v_mida > v_sostre and (v_vella is null or v_mida > v_vella) then
    raise exception 'SDP-MUR-MIDA: una publicació no pot passar de % bytes.', v_sostre using errcode = '22001';
  end if;
  if tg_op = 'INSERT' and not v_existix then
    perform pg_advisory_xact_lock(hashtextextended('sdp:publicacions:volum:' || new.owner_user_id::text, 0));
    select count(*) filter (where s.created_at > now() - interval '1 hour'), count(*)
      into v_hora, v_total
      from public.section_submissions s where s.owner_user_id = new.owner_user_id;
    if v_hora >= 60 or v_total >= 2000 then
      raise exception 'SDP-MUR-429: has arribat al màxim de publicacions.' using errcode = '42900';
    end if;
  end if;
  return new;
end $f$;
revoke all on function private.publicacions_limita_volum() from public, anon, authenticated, service_role;
drop trigger if exists section_submissions_limita_volum on public.section_submissions;
create trigger section_submissions_limita_volum
  before insert or update of payload, section_id on public.section_submissions
  for each row execute function private.publicacions_limita_volum();

notify pgrst, 'reload schema';
commit;
