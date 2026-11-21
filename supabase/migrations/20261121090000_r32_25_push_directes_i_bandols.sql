-- R32.25 · Preparat en clon, NO aplicat a producció. Worker compatible primer.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · Precondicions ──────────────────────────────────────────────────────
do $$ begin
  if to_regclass('private.xat_push_lliuraments') is null
     or to_regprocedure('private.xat_push_candidats_v2(bigint)') is null
     or to_regprocedure('public.xat_push_reclama_v2(integer)') is null
     or to_regprocedure('private.xat_participant_vigent(uuid,uuid)') is null
     or to_regprocedure('private.mur_public_eligible(jsonb)') is null
     or to_regclass('private.mur_publicacions_revocades') is null
     or to_regclass('private.mur_bloquejos_opacs') is null                        -- [VA-16]
     or to_regprocedure('public.pot_signar_com_organitzacio(uuid,uuid)') is null
     or not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'section_submissions'
                       and column_name = 'moderation_state') then
    raise exception using errcode = '55000',
      message = 'SDP-PUSH-P00: cal 2611080431, 2611011500 i 2611121430/2611122200 aplicades.';
  end if;
end $$;


-- Rellotge privat: producció usa now(); la fixture el fixa sense cap bandera pública.
create or replace function private.avisos_push_ara()
returns timestamptz language sql stable set search_path = '' as $$select now()$$;
revoke all on function private.avisos_push_ara() from public, anon, authenticated, service_role;
insert into private.ajustos(clau,valor) values ('push_poble_actiu','no'),('push_xat_directes_nous_dia','10')
on conflict(clau) do nothing;

-- ── 1 · El sí de la persona (D-16, opció B; amb l'opció A, este bloc no hi és) ─
create table if not exists public.avisos_push_bandols (
  usuari_id      uuid primary key references auth.users (id) on delete cascade,
  actiu          boolean not null,
  actualitzat_al timestamptz not null default now()
);
alter table public.avisos_push_bandols enable row level security;
revoke all on table public.avisos_push_bandols from public, anon, authenticated, service_role;
grant select on table public.avisos_push_bandols to authenticated;
drop policy if exists "avisos_push_bandols_propis" on public.avisos_push_bandols;
create policy "avisos_push_bandols_propis" on public.avisos_push_bandols
  for select to authenticated using (usuari_id = (select auth.uid()));

-- Coacció primitiva: un booleà, cap jsonb d'entrada. Torna l'estat desat.
create or replace function public.avisos_push_bandols_desa(p_actiu boolean)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then raise exception 'SDP-PUSH-B01: cal la sessió iniciada.' using errcode = '42501'; end if;
  if p_actiu is null then raise exception 'SDP-PUSH-B02: valor invàlid.' using errcode = '22023'; end if;
  insert into public.avisos_push_bandols (usuari_id, actiu) values (v_jo, p_actiu)
  on conflict (usuari_id) do update set actiu = excluded.actiu, actualitzat_al = now();
  return p_actiu;
end;
$$;
-- [VA-15] Tres estats: true (sí), false (no, que es respecta sempre) i null (mai no ha contestat).
-- Sense coalesce: el client ha de distingir «no» de «mai no ho he dit».
create or replace function public.avisos_push_bandols_llig()
returns boolean language sql stable security definer set search_path = '' as $$
  select b.actiu from public.avisos_push_bandols b where b.usuari_id = (select auth.uid());
$$;
-- [VA-15] El sí de la píndola: només s'escriu si la persona no ha contestat mai. Un «no» desat
-- (Ajustos) no el torna a encendre cap toc pensat per al Xat. Torna l'estat vigent.
create or replace function public.avisos_push_bandols_accepta_si_absent()
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid := (select auth.uid()); v_actiu boolean;
begin
  if v_jo is null then raise exception 'SDP-PUSH-B01: cal la sessió iniciada.' using errcode = '42501'; end if;
  insert into public.avisos_push_bandols (usuari_id, actiu) values (v_jo, true)
  on conflict (usuari_id) do nothing;
  select b.actiu into v_actiu from public.avisos_push_bandols b where b.usuari_id = v_jo;
  return v_actiu;
end;
$$;
revoke all on function public.avisos_push_bandols_desa(boolean), public.avisos_push_bandols_llig(),
  public.avisos_push_bandols_accepta_si_absent() from public, anon, authenticated, service_role;
grant execute on function public.avisos_push_bandols_desa(boolean), public.avisos_push_bandols_llig(),
  public.avisos_push_bandols_accepta_si_absent() to authenticated;

-- ── 2 · La mateixa cua, amb canal ─────────────────────────────────────────
alter table private.xat_push_cua add column if not exists canal text not null default 'xat';
alter table private.xat_push_cua add column if not exists tenant_id uuid;
alter table private.xat_push_cua add column if not exists publicacio_id uuid;
alter table private.xat_push_cua alter column fil_id drop not null;
alter table private.xat_push_cua alter column missatge_id drop not null;
do $$ begin
  if not exists (select 1 from pg_catalog.pg_constraint
                  where conrelid = 'private.xat_push_cua'::regclass and conname = 'xat_push_cua_canal_forma') then
    alter table private.xat_push_cua add constraint xat_push_cua_canal_forma check (
         (canal = 'xat' and fil_id is not null and missatge_id is not null)
      or (canal = 'urgent' and tenant_id is not null and publicacio_id is not null
          and fil_id is null and missatge_id is null));
  end if;
end $$;
-- El disparador del Xat (2611020417:336-366) no canvia: insereix sense canal i rep 'xat'.

-- ── 3 · Una vegada en la vida i el sostre (RLS sense cap política) ─────────
create table if not exists private.avisos_push_bandols_avisats (
  submission_id uuid primary key,
  tenant_id     uuid not null,
  sonat         boolean not null default false,
  avisat_al     timestamptz not null default now()
);
create index if not exists avisos_push_bandols_sonats_idx
  on private.avisos_push_bandols_avisats (tenant_id, avisat_al) where sonat;
alter table private.avisos_push_bandols_avisats enable row level security;
revoke all on table private.avisos_push_bandols_avisats from public, anon, authenticated, service_role;

-- ── 4 · Predicats: mirall de src/sections/mur/alertesMunicipals.js ────────
-- normalitzaEtiqueta (alertesMunicipals.js:99-107). Prova de paritat obligatòria (§5.2, S4).
-- [VA-11] Dos miralls exactes del JS: (1) el topall de 64 és en unitats UTF-16 (text.length,
-- :102): un punt de codi de fora del pla bàsic (emojis) en compta 2; (2) NFD i fora les marques
-- combinants (:103), no una llista fixa d'accents: «Ba\u0300ndol» és un bàndol als dos costats.
-- Unicode 16.0: tots els 2.501 punts de General_Category=Mark, 321 rangs.
-- Generats amb /\p{M}/u de Node 24 (Unicode16), NFD i classificació C.
-- Una actualització d'Unicode del JS exigix regenerar rangs i corpus abans de desplegar.
create or replace function private.avisos_push_normalitza(p_text text)
returns text language sql immutable set search_path = '' as $normalitza$
  select case when p_text is null or
    char_length(p_text) + char_length(regexp_replace(p_text COLLATE "C", '[^\U00010000-\U0010FFFF]', '', 'g')) > 64 then ''
  else btrim(regexp_replace(lower(regexp_replace(normalize(p_text, NFD) COLLATE "C",
    $marques$[̀-ͯ҃-҉֑-ֽֿׁ-ׂׄ-ׇׅؐ-ًؚ-ٰٟۖ-ۜ۟-ۤۧ-۪ۨ-ܑۭܰ-݊ަ-ް߫-߽߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࡙࠭-࡛ࢗ-࢟࣊-ࣣ࣡-ःऺ-़ा-ॏ॑-ॗॢ-ॣঁ-ঃ়া-ৄে-ৈো-্ৗৢ-ৣ৾ਁ-ਃ਼ਾ-ੂੇ-ੈੋ-੍ੑੰ-ੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢ-ૣૺ-૿ଁ-ଃ଼ା-ୄେ-ୈୋ-୍୕-ୗୢ-ୣஂா-ூெ-ைொ-்ௗఀ-ఄ఼ా-ౄె-ైొ-్ౕ-ౖౢ-ౣಁ-ಃ಼ಾ-ೄೆ-ೈೊ-್ೕ-ೖೢ-ೣೳഀ-ഃ഻-഼ാ-ൄെ-ൈൊ-്ൗൢ-ൣඁ-ඃ්ා-ුූෘ-ෟෲ-ෳัิ-ฺ็-๎ັິ-ຼ່-໎༘-༹༙༵༷༾-༿ཱ-྄྆-྇ྍ-ྗྙ-ྼ࿆ါ-ှၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ፝-፟ᜒ-᜕ᜲ-᜴ᝒ-ᝓᝲ-ᝳ឴-៓៝᠋-᠍᠏ᢅ-ᢆᢩᤠ-ᤫᤰ-᤻ᨗ-ᨛᩕ-ᩞ᩠-᩿᩼᪰-ᫎᬀ-ᬄ᬴-᭄᭫-᭳ᮀ-ᮂᮡ-ᮭ᯦-᯳ᰤ-᰷᳐-᳔᳒-᳨᳭᳴᳷-᳹᷀-᷿⃐-⃰⳯-⵿⳱ⷠ-〪ⷿ-゙〯-゚꙯-꙲ꙴ-꙽ꚞ-ꚟ꛰-꛱ꠂ꠆ꠋꠣ-ꠧ꠬ꢀ-ꢁꢴ-ꣅ꣠-꣱ꣿꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀ꧥꨩ-ꨶꩃꩌ-ꩍꩻ-ꩽꪰꪲ-ꪴꪷ-ꪸꪾ-꪿꫁ꫫ-ꫯꫵ-꫶ꯣ-ꯪ꯬-꯭ﬞ︀-️︠-𐇽𐋠︯𐍶-𐍺𐨁-𐨃𐨅-𐨆𐨌-𐨏𐨸-𐨿𐨺𐫥-𐫦𐴤-𐴧𐵩-𐵭𐺫-𐺬𐻼-𐻿𐽆-𐽐𐾂-𐾅𑀀-𑀂𑀸-𑁆𑁰𑁳-𑁴𑁿-𑂂𑂰-𑂺𑃂𑄀-𑄂𑄧-𑄴𑅅-𑅆𑅳𑆀-𑆂𑆳-𑇀𑇉-𑇌𑇎-𑇏𑈬-𑈷𑈾𑉁𑋟-𑋪𑌀-𑌃𑌻-𑌼𑌾-𑍄𑍇-𑍈𑍋-𑍍𑍗𑍢-𑍣𑍦-𑍬𑍰-𑍴𑎸-𑏀𑏅𑏅𑎸-𑏊𑏌-𑏐𑏒𑏡-𑏢𑐵-𑑆𑑞𑒰-𑓃𑖯-𑖵𑖸-𑗀𑗜-𑗝𑘰-𑙀𑚫-𑚷𑜝-𑜫𑠬-𑠺𑤰-𑤵𑤷-𑤸𑤻-𑤾𑥀𑥂-𑥃𑧑-𑧗𑧚-𑧠𑧤𑨁-𑨊𑨳-𑨹𑨻-𑨾𑩇𑩑-𑩛𑪊-𑪙𑰯-𑰶𑰸-𑰿𑲒-𑲧𑲩-𑲶𑴱-𑴶𑴺𑴼-𑴽𑴿-𑵅𑵇𑶊-𑶎𑶐-𑶑𑶓-𑶗𑻳-𑻶𑼀-𑼁𑼃𑼴-𑼺𑼾-𑽂𑽚𓑀𓑇-𓑕𖄞-𖫰𖄯-𖫴𖬰-𖬶𖽏𖽑-𖾇𖾏-𖾒𖿤𖿰-𖿱𛲝-𛲞𜼀-𜼭𜼰-𜽆𝅥-𝅩𝅭-𝅲𝅻-𝆂𝆅-𝆋𝆪-𝆭𝉂-𝉄𝨀-𝨶𝨻-𝩬𝩵𝪄𝪛-𝪟𝪡-𝪯𞀀-𞀆𞀈-𞀘𞀛-𞀡𞀣-𞀤𞀦-𞀪𞂏𞄰-𞄶𞊮𞋬-𞋯𞓬-𞓯𞗮-𞗯𞣐-𞣖𞥄-𞥊󠄀-󠇯]$marques$, '', 'g')) COLLATE "C", '[^a-z0-9]+', '_', 'g'), '_') end;
$normalitza$;
-- Una etiqueta és un text o { text } (alertesMunicipals.js:100-101).
create or replace function private.avisos_push_etiqueta(p jsonb)
returns text language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p) = 'string' then p #>> '{}'
              when jsonb_typeof(p) = 'object' and jsonb_typeof(p->'text') = 'string' then p->>'text' end;
$$;
-- 'alerta' | 'bandol_urgent' | null, amb la precedència de alertesMunicipals.js:80 i els topalls de :84-85.
-- Més estricte que el client a posta: un payload amb type 'sistema' no avisa mai.
create or replace function private.avisos_push_tipus_alerta(p_payload jsonb)
returns text language plpgsql immutable set search_path = '' as $$
declare v_clau text; v_bandol boolean := false; v_llista text; v_e jsonb;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or p_payload->'isSystem' = 'true'::jsonb
     or coalesce(p_payload->>'type', '') in ('event', 'market', 'product', 'sistema', 'poble') then
    return null;
  end if;
  foreach v_llista in array array['labels', 'categories', 'tags'] loop
    if jsonb_typeof(p_payload->v_llista) = 'array' then
      for v_e in select x.valor from jsonb_array_elements(p_payload->v_llista) with ordinality as x(valor, n)
                  where x.n <= 32 loop
        v_clau := private.avisos_push_normalitza(private.avisos_push_etiqueta(v_e));
        if v_clau in ('alerta', 'alerta_municipal', 'emergencia', 'emergencia_municipal') then return 'alerta'; end if;
        v_bandol := v_bandol or v_clau = 'bandol_urgent';
      end loop;
    end if;
  end loop;
  foreach v_llista in array array['category', 'tag'] loop
    v_clau := private.avisos_push_normalitza(private.avisos_push_etiqueta(p_payload->v_llista));
    if v_clau in ('alerta', 'alerta_municipal', 'emergencia', 'emergencia_municipal') then return 'alerta'; end if;
    v_bandol := v_bandol or v_clau = 'bandol_urgent';
  end loop;
  return case when v_bandol then 'bandol_urgent' end;
end;
$$;
-- Un bàndol: Mur públic + etiqueta + signatura d'un city_hall DEL MATEIX poble (la regla de 2611011500).
-- [VA-16] De llig_mur_public (2611122200:455-462) es repliquen la secció, la visibilitat, la
-- moderació, deleted_at, mur_public_eligible i les revocades. NO es repliquen mur_actor_bloqueja
-- ni mur_bloqueig_opac, que depenen d'auth.uid() i el worker corre sense usuari: els bloquejos
-- es miren per destinatari a la branca 'urgent' de xat_push_candidats_v2 (bloc 6).
create or replace function private.avisos_push_es_bandol(p_fila public.section_submissions)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_fila.section_id = 'mur'
     and p_fila.visibility = 'public' and p_fila.moderation_state = 'visible' and p_fila.deleted_at is null
     and p_fila.author_org_id is not null
     and private.mur_public_eligible(p_fila.payload)
     and not exists (select 1 from private.mur_publicacions_revocades r where r.submission_id = p_fila.id)
     and private.avisos_push_tipus_alerta(p_fila.payload) is not null
     and exists (select 1 from public.organizations o
                  where o.id = p_fila.author_org_id and o.kind = 'city_hall' and o.tenant_id = p_fila.tenant_id);
$$;
-- Silenci de nit fix, 22:00-08:00, d'Europe/Madrid (consens). Què fa un bàndol de nit és D-18,
-- decisió del Mestre: A en este esborrany; el moderador de la plaça recomana B [VA-37].
-- El TTL del proveïdor també s'acota a l'inici del silenci (natius.js, §3.3.3) [VA-17].
create or replace function private.avisos_push_en_silenci(p_ara timestamptz)
returns boolean language sql stable set search_path = '' as $$
  select (p_ara at time zone 'Europe/Madrid')::time >= time '22:00'
      or (p_ara at time zone 'Europe/Madrid')::time <  time '08:00';
$$;
-- Mateix sostre temporal que ttlUrgent() del worker: floor de segons fins a les22:00,
-- màxim6h i mínim300s per intentar enviament. PostgreSQL conserva els microsegons;
-- un instant posterior a21:55:00, inclòs1µs, no pot consumir quota ni prometre so.
create or replace function private.avisos_push_ttl_urgent(p_ara timestamptz)
returns integer language sql stable set search_path = '' as $$
  select case when p_ara is null or not isfinite(p_ara)
      or private.avisos_push_en_silenci(p_ara) then 0
    else least(21600,greatest(0,floor(extract(epoch from
      (time '22:00' - (p_ara at time zone 'Europe/Madrid')::time)))))::integer end;
$$;
revoke all on function private.avisos_push_ttl_urgent(timestamptz) from public, anon, authenticated, service_role;

revoke all on function private.avisos_push_normalitza(text), private.avisos_push_etiqueta(jsonb),
  private.avisos_push_tipus_alerta(jsonb), private.avisos_push_es_bandol(public.section_submissions),
  private.avisos_push_en_silenci(timestamptz) from public, anon, authenticated, service_role;

-- ── 5 · El disparador: una publicació que PASSA a bàndol públic ───────────
-- Mai atura una publicació (com xat_push_encua, 2611020417:354-357).
create or replace function private.avisos_push_bandol_encua()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_limit constant integer := 2;                     -- D-17: sostre fix [VA-22]; el text de l'app el diu
        v_sona boolean;
begin
  if coalesce((select a.valor from private.ajustos a where a.clau = 'push_poble_actiu'), '') <> 'si'
     or coalesce((select a.valor from private.ajustos a where a.clau = 'push_xat_actiu'), '') <> 'si' then return null; end if;
  if not private.avisos_push_es_bandol(new) then return null; end if;
  -- Abans de qualsevol marca/consum: una vida insuficient no és un avís sonat.
  if private.avisos_push_ttl_urgent(private.avisos_push_ara()) < 300 then return null; end if;
  if tg_op = 'UPDATE' and private.avisos_push_es_bandol(old) then return null; end if;   -- una edició no torna a avisar
  -- [VA-21] Fora de la vigència del Mur (72 h, alertesMunicipals.js:91) no sona mai: la purga de
  -- 30 dies de baix ja no pot reobrir l'avís d'una publicació vella que torna a ser bàndol.
  -- Un esborrany de fa més de 72 h que es publica ara tampoc no sona (més estricte, a posta).
  if coalesce(new.created_at, private.avisos_push_ara()) < private.avisos_push_ara() - interval '72 hours' then return null; end if;
  delete from private.avisos_push_bandols_avisats x
   where x.submission_id in (select y.submission_id from private.avisos_push_bandols_avisats y
                              where y.avisat_al < private.avisos_push_ara() - interval '30 days'
                              order by y.avisat_al limit 100 for update skip locked);
  insert into private.avisos_push_bandols_avisats (submission_id, tenant_id, avisat_al) values (new.id, new.tenant_id, private.avisos_push_ara())
  on conflict (submission_id) do nothing;
  if not found then return null; end if;                                                  -- una vegada (dins de la vigència)
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('sdp.avisos_push_bandol'),
                                           pg_catalog.hashtext(new.tenant_id::text));
  v_sona := (select count(*) from private.avisos_push_bandols_avisats x
              where x.tenant_id = new.tenant_id and x.sonat and x.avisat_al > private.avisos_push_ara() - interval '24 hours') < v_limit
        and not exists (select 1 from private.avisos_push_bandols_avisats x
              where x.tenant_id = new.tenant_id and x.sonat and x.avisat_al > private.avisos_push_ara() - interval '10 minutes')
        and private.avisos_push_ttl_urgent(private.avisos_push_ara()) >= 300;
  if v_sona then
    update private.avisos_push_bandols_avisats set sonat = true where submission_id = new.id;
    insert into private.xat_push_cua (canal, tenant_id, publicacio_id, autor_id, com_org_id, creat_al)
    values ('urgent', new.tenant_id, new.id, new.owner_user_id, new.author_org_id, private.avisos_push_ara());
  end if;
  return null;
exception when others then
  raise warning 'SDP-PUSH-920: no s''ha pogut encuar l''avís del bàndol (%).', sqlstate;
  return null;
end;
$$;
revoke all on function private.avisos_push_bandol_encua() from public, anon, authenticated, service_role;

drop trigger if exists section_submissions_avisos_push_bandol on public.section_submissions;
create trigger section_submissions_avisos_push_bandol
  after insert or update of section_id, visibility, moderation_state, deleted_at, payload, author_org_id
  on public.section_submissions
  for each row
  when (new.section_id = 'mur' and new.visibility = 'public' and new.moderation_state = 'visible'
        and new.deleted_at is null and new.author_org_id is not null)
  execute function private.avisos_push_bandol_encua();

-- ── 6 · Destinataris: repartidor per canal (mateixa signatura) ────────────
create or replace function private.xat_push_candidats_v2(p_cua_id bigint)
returns table (id uuid, usuari_id uuid, tipus text, adreca text, llengua text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_dies integer;
  v_generals boolean;
  v_canal text;
begin
  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
      from private.ajustos a where a.clau = 'push_xat_dies_dispositiu';
  exception when invalid_text_representation or numeric_value_out_of_range then
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 60);
  select q.canal into v_canal from private.xat_push_cua q where q.id = p_cua_id;
  if v_canal is null then return; end if;

  if v_canal = 'xat' then
    -- El cos LITERAL de 2611080431:163-192. Cap condició afegida.
    v_generals := coalesce((select a.valor from private.ajustos a where a.clau = 'push_xat_generals'), '') = 'si';
    return query
      select distinct d.id, d.usuari_id, d.tipus, d.adreca, d.llengua
        from private.xat_push_cua q
        join public.xat_missatges m on m.id = q.missatge_id and m.fil_id = q.fil_id
        join public.xat_fils f on f.id = q.fil_id
        join public.xat_participants p on p.fil_id = q.fil_id
        join public.xat_dispositius_push d on d.usuari_id = p.usuari_id
       where q.id = p_cua_id and q.creat_al > now() - interval '15 minutes'
         and coalesce((select a.valor from private.ajustos a where a.clau='push_xat_actiu'), '')='si'
         and m.esborrat_al is null
         and p.usuari_id is distinct from q.autor_id
         and p.visible_fins_seq is null and p.arxivat_al is null
         and coalesce(p.llegit_fins_seq, 0) < m.seq
         and (p.silenciat_fins_al is null or p.silenciat_fins_al <= now())
         and (p.avisos = 'tots' or (p.avisos = 'destacats' and q.resposta_a is not null
              and exists (select 1 from public.xat_missatges r
                           where r.id = q.resposta_a and r.usuari_id = p.usuari_id)))
         and not (q.com_org_id is not null and p.com_org_id is not distinct from q.com_org_id)
         and (f.tipus = 'directe' or (f.tipus in ('canal', 'grup')
              and ((f.comunitat_id is null and f.subjecte_tipus is null) or v_generals)))
         and private.xat_participant_vigent(q.fil_id, p.usuari_id)
         and not exists (select 1 from public.bloquejos b where b.bloquejador = p.usuari_id
              and ((b.bloquejat_tipus = 'persona' and b.bloquejat_persona = q.autor_id)
                or (b.bloquejat_tipus = 'entitat' and q.com_org_id is not null
                    and b.bloquejat_entitat = q.com_org_id)))
         and not exists (select 1 from private.baixes bx where bx.user_id = p.usuari_id)
         and (d.caduca_al is null or d.caduca_al > now())
         and d.renovat_al > now() - make_interval(days => v_dies);
    return;
  end if;

  if v_canal <> 'urgent'
     or coalesce((select a.valor from private.ajustos a where a.clau = 'push_poble_actiu'), '') <> 'si' then
    return;
  end if;
  -- Es revalida a cada reclamació (2611080431:270-279, :296-305): una publicació retirada,
  -- un bloqueig nou, una baixa o la nit que comença descarten l'avís pendent.
  return query
    select distinct d.id, d.usuari_id, d.tipus, d.adreca, d.llengua
      from private.xat_push_cua q
      join public.section_submissions s on s.id = q.publicacio_id and s.tenant_id = q.tenant_id
      join public.town_memberships tm on tm.town_id = q.tenant_id
      join public.avisos_push_bandols pb on pb.usuari_id = tm.user_id and pb.actiu   -- D-16 B (amb l'opció A, fora)
      join public.xat_dispositius_push d on d.usuari_id = tm.user_id
     where q.id = p_cua_id and q.creat_al > private.avisos_push_ara() - interval '15 minutes'
       and coalesce((select a.valor from private.ajustos a where a.clau='push_xat_actiu'), '')='si'
       and private.avisos_push_es_bandol(s)
       and s.author_org_id = q.com_org_id and s.owner_user_id = q.autor_id
       and private.avisos_push_ttl_urgent(private.avisos_push_ara()) >= 300
       and tm.user_id is distinct from q.autor_id
       and not exists (select 1 from public.bloquejos b where b.bloquejador = tm.user_id
            and ((b.bloquejat_tipus = 'persona' and b.bloquejat_persona = q.autor_id)
              or (b.bloquejat_tipus = 'entitat' and q.com_org_id is not null
                  and b.bloquejat_entitat = q.com_org_id)))
       -- [VA-16] El bloqueig opac per publicació (2611122200:129-138) que el Mur aplica amb
       -- mur_bloqueig_opac (:171-177, :460): qui no veu el bàndol al Mur no el sent al mòbil.
       -- Sense filtrar per tenant_ids: el destinatari ja és membre de q.tenant_id i ser més
       -- estricte no revela res (cap avís no és observable per l'autor).
       and not exists (select 1 from private.mur_bloquejos_opacs o where o.bloquejador = tm.user_id
            and ((q.com_org_id is null and o.bloquejat_persona = q.autor_id)
              or (q.com_org_id is not null and o.bloquejat_entitat = q.com_org_id)))
       and not exists (select 1 from private.baixes bx where bx.user_id = tm.user_id)
       and d.tipus in ('apns', 'fcm')                       -- el SW només sap «Tens missatges nous»
       and (d.caduca_al is null or d.caduca_al > private.avisos_push_ara())
       and d.renovat_al > private.avisos_push_ara() - make_interval(days => v_dies);
end;
$$;
revoke all on function private.xat_push_candidats_v2(bigint) from public, anon, authenticated, service_role;


-- D-24: una conversa nova que es denega continua muda durant les primeres 24h.
-- El missatge sempre s'envia. El sostre afecta exclusivament l'avís push.
create table if not exists private.xat_push_directes_nous (
  fil_id uuid primary key references public.xat_fils(id) on delete cascade,
  remitent_id uuid not null references auth.users(id) on delete cascade,
  primer_al timestamptz not null default now(),
  admes boolean not null
);
create index if not exists xat_push_directes_nous_remitent_idx
on private.xat_push_directes_nous(remitent_id,primer_al);
alter table private.xat_push_directes_nous enable row level security;
revoke all on table private.xat_push_directes_nous from public,anon,authenticated,service_role;
create or replace function private.xat_push_encua()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_limit integer; v_decisio private.xat_push_directes_nous%rowtype;
begin
  delete from private.xat_push_cua c
   where c.id in (select q.id from private.xat_push_cua q where q.creat_al < now()-interval '1 hour'
     order by q.creat_al limit 100 for update skip locked);
  -- Retenció mínima: fora de 24h ja no afecta quota ni silenci; el missatge reconeix un fil antic.
  delete from private.xat_push_directes_nous d where d.fil_id in
    (select x.fil_id from private.xat_push_directes_nous x where x.primer_al<=now()-interval '24 hours'
     order by x.primer_al limit 100 for update skip locked);
  if coalesce((select a.valor from private.ajustos a where a.clau='push_xat_actiu'),'') <> 'si' then return null; end if;
  if exists(select 1 from public.xat_fils f where f.id=new.fil_id and f.tipus='directe'
      and coalesce(to_jsonb(f)->>'propi_usuari_id','')='') then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('sdp.push.directes.nous'),pg_catalog.hashtext(new.usuari_id::text));
    select * into v_decisio from private.xat_push_directes_nous d where d.fil_id=new.fil_id;
    if found then
      if not v_decisio.admes and v_decisio.primer_al > now()-interval '24 hours' then return null; end if;
    elsif not exists(select 1 from public.xat_missatges m where m.fil_id=new.fil_id and m.id<>new.id
      and m.tipus is distinct from 'sistema') then
      begin
        select greatest(0,least(a.valor::integer,1000)) into v_limit from private.ajustos a where a.clau='push_xat_directes_nous_dia';
      exception when invalid_text_representation or numeric_value_out_of_range then v_limit:=null;
      end;
      v_limit:=coalesce(v_limit,10);
      insert into private.xat_push_directes_nous(fil_id,remitent_id,admes)
      select new.fil_id,new.usuari_id,count(*) < v_limit from private.xat_push_directes_nous d
      where d.remitent_id=new.usuari_id and d.admes and d.primer_al > now()-interval '24 hours'
      on conflict(fil_id) do nothing;
      select * into v_decisio from private.xat_push_directes_nous d where d.fil_id=new.fil_id;
      if not v_decisio.admes then return null; end if;
    end if;
  end if;
  insert into private.xat_push_cua(fil_id,missatge_id,autor_id,com_org_id,resposta_a)
  values(new.fil_id,new.id,new.usuari_id,new.com_org_id,new.resposta_a);
  return null;
exception when others then
  raise warning 'SDP-PUSH-900: no s''ha pogut encuar l''avís (%).',sqlstate;
  return null;
end;
$$;
revoke all on function private.xat_push_encua() from public,anon,authenticated,service_role;


-- Previsió sense cap destinatari ni aparell. El trigger decidix de nou en publicar.
create or replace function public.avisos_push_bandols_preveu(p_organitzacio uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_tenant uuid; v_ara timestamptz:=private.avisos_push_ara(); v_motiu text;
begin
  select o.tenant_id into v_tenant from public.organizations o where o.id=p_organitzacio and o.kind='city_hall';
  if v_tenant is null or (select auth.uid()) is null or not public.pot_signar_com_organitzacio(p_organitzacio,v_tenant) then raise exception 'SDP-PUSH-B03: no pots signar com eixe ajuntament.' using errcode='42501'; end if;
  v_motiu:=case
    when coalesce((select valor from private.ajustos where clau='push_poble_actiu'),'')<>'si'
      or coalesce((select valor from private.ajustos where clau='push_xat_actiu'),'')<>'si' then 'apagat'
    when private.avisos_push_en_silenci(v_ara) then 'nit'
    when private.avisos_push_ttl_urgent(v_ara)<300 then 'vida_insuficient'
    when (select count(*) from private.avisos_push_bandols_avisats where tenant_id=v_tenant and sonat and avisat_al>v_ara-interval '24 hours')>=2 then 'sostre'
    when exists(select 1 from private.avisos_push_bandols_avisats where tenant_id=v_tenant and sonat and avisat_al>v_ara-interval '10 minutes') then 'deu_minuts'
    else null end;
  return jsonb_build_object('sona_ara',v_motiu is null,'motiu',v_motiu);
end;
$$;
revoke all on function public.avisos_push_bandols_preveu(uuid) from public,anon,authenticated,service_role;
grant execute on function public.avisos_push_bandols_preveu(uuid) to authenticated;

create or replace function public.xat_push_reclama_v2(p_limit integer default 50)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_preparats integer;
  v_treballs integer;
  v_diferits integer;
  v_dispositius jsonb;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode='42501';
  end if;
  v_preparats := private.xat_push_prepara_v2(p_limit);
  with revisar as materialized (
    select j.id,j.cua_id from private.xat_push_lliuraments j
     where j.completat_al is null and (j.lease_fins is null or j.lease_fins<=now())
     order by j.proxim_al,j.id limit 5000 for update skip locked
  ), candidats as materialized (
    select q.cua_id,d.id,d.usuari_id from (select distinct r.cua_id from revisar r) q
      cross join lateral private.xat_push_candidats_v2(q.cua_id) d
  )
  update private.xat_push_lliuraments j
     set completat_al=now(),resultat='descartat',lease_id=null,lease_fins=null
   where j.id in (select r.id from revisar r)
     and (j.caduca_al<=now() or j.intents>=8 or not exists(
       select 1 from candidats c where c.cua_id=j.cua_id
         and c.id=j.dispositiu_id and c.usuari_id=j.usuari_id));

  delete from private.xat_push_cua q
   where q.id in (select c.id from private.xat_push_cua c
     where c.creat_al<=now()-interval '15 minutes'
        or (c.preparat_al is not null and not exists(
          select 1 from private.xat_push_lliuraments j
           where j.cua_id=c.id and j.completat_al is null))
     order by c.id limit 5000 for update skip locked);

  perform private.xat_push_purga_v2(5000);

  with pendents as materialized (
    select j.id,j.cua_id,j.dispositiu_id,j.usuari_id from private.xat_push_lliuraments j
     where j.completat_al is null and j.proxim_al<=now() and j.caduca_al>now()
       and j.intents<8 and (j.lease_fins is null or j.lease_fins<=now())
     order by j.proxim_al,j.id limit 5000 for update of j skip locked
  ), elegibles as materialized (
    select q.cua_id,c.id,c.usuari_id from (select distinct p.cua_id from pendents p) q
      cross join lateral private.xat_push_candidats_v2(q.cua_id) c
  ), disponibles as materialized (
    select j.id,j.dispositiu_id,j.usuari_id,d.tipus,d.adreca,d.llengua,d.renovat_al,q.canal,
      octet_length(jsonb_build_object('id',j.id,'lease','ffffffff-ffff-ffff-ffff-ffffffffffff',
        'dispositiu',jsonb_build_object('id',d.id,'tipus',d.tipus,'adreca',d.adreca,'llengua',d.llengua,'avis',q.canal))::text)+100 as pes
      from pendents j
      join private.xat_push_cua q on q.id=j.cua_id
      join public.xat_dispositius_push d on d.id=j.dispositiu_id and d.usuari_id=j.usuari_id
      join elegibles e on e.cua_id=j.cua_id and e.id=j.dispositiu_id and e.usuari_id=j.usuari_id
  ), pesats as (
    select d.*,sum(d.pes)over(order by d.id rows between unbounded preceding and current row) as octets
      from disponibles d
  ), triats as (
    select p.* from pesats p where p.octets<=1700000
  ), reclamats as (
    update private.xat_push_lliuraments j
       set lease_id=gen_random_uuid(),lease_fins=now()+interval '120 seconds',registre_versio=t.renovat_al,intents=j.intents+1
      from triats t where j.id=t.id
      returning j.id,j.lease_id,j.dispositiu_id,t.tipus,t.adreca,t.llengua,t.canal
  ), agrupats as (
    select r.dispositiu_id,r.tipus,r.adreca,r.llengua,r.canal as avis,
      jsonb_agg(jsonb_build_object('id',r.id,'lease',r.lease_id)order by r.id) as lliuraments
      from reclamats r group by r.dispositiu_id,r.tipus,r.adreca,r.llengua,r.canal
  )
  select (select count(*)::integer from reclamats),
    (select count(*)::integer from disponibles)-(select count(*)::integer from triats),
    coalesce((select jsonb_agg(jsonb_build_object('id',a.dispositiu_id,'tipus',a.tipus,
      'adreca',a.adreca,'llengua',a.llengua,'lliuraments',a.lliuraments)
      || case when a.avis='urgent' then jsonb_build_object('avis','urgent') else '{}'::jsonb end order by a.dispositiu_id,a.avis)
      from agrupats a),'[]'::jsonb)
    into v_treballs,v_diferits,v_dispositius;
  return jsonb_build_object('protocol','lease-v2','missatges',v_preparats,
    'treballs',v_treballs,'retallats',v_diferits,'dispositius',v_dispositius);
end;
$$;
revoke all on function public.xat_push_reclama_v2(integer) from public,anon,authenticated,service_role;
grant execute on function public.xat_push_reclama_v2(integer) to service_role;
notify pgrst,'reload schema';
commit;
