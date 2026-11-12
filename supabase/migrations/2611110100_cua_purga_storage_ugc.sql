-- R17.2B · P0-20. NO aplicada: l'aplica el Mestre.
-- Depén de 2610241440 i de Storage amb owner, owner_id i version.
-- Abans (lectura): select pg_get_serial_sequence('private.purga_storage_pendent', 'id');
-- Abans (lectura, amb el rol de migració): select has_table_privilege('auth.users', 'UPDATE');
-- Verificació posterior (lectura): select bucket_id, referenciat, count(*)
-- from public.cua_purga_storage_ugc group by 1, 2;
--
-- Una baixa registra objectes de Storage pel propietari
-- acreditat i l'objecte concret. El worker purga-fitxers conserva les seues
-- RPC i esborra el binari per l'API de Storage. Cap permís de taula al client.
begin;

-- La guarda de Storage bloqueja la fila d'Auth (for key share). Sense el
-- privilegi, totes les pujades dels tres buckets fallarien després de migrar:
-- la migració falla tancada abans de crear res.
do $privilegi$
begin
  if not has_table_privilege('auth.users', 'UPDATE') then
    raise exception 'SDP-PURGA-010: el rol de migració no pot bloquejar auth.users; la guarda de Storage trencaria les pujades.';
  end if;
end;
$privilegi$;

alter table private.baixes add column if not exists purga_fitxers_iniciada_al timestamptz;

-- IDs de la mateixa seqüència que la cua privada: els rebuts del worker
-- continuen inequívocs durant el canvi i els adjunts previs són compatibles.
create table if not exists public.cua_purga_storage_ugc (
  id bigint primary key default nextval('private.purga_storage_pendent_id_seq'::regclass),
  user_id uuid not null,
  object_id uuid not null,
  object_version text,
  bucket_id text not null check (bucket_id in ('mitjans', 'mitjans_privats', 'xat_adjunts')),
  nom text not null,
  referenciat boolean not null,
  creat_al timestamptz not null default now(),
  intents integer not null default 0 check (intents >= 0),
  ultim_intent_al timestamptz,
  ultim_error text check (char_length(ultim_error) <= 200),
  unique (bucket_id, nom)
);

alter table public.cua_purga_storage_ugc enable row level security;
revoke all on table public.cua_purga_storage_ugc from public, anon, authenticated, service_role;
create index if not exists cua_purga_storage_ugc_pendent on public.cua_purga_storage_ugc (creat_al, id)
  where not referenciat;
create index if not exists cua_purga_storage_ugc_usuari on public.cua_purga_storage_ugc (user_id);

-- Les referències es calculen pel bucket i nom. Les imatges d'una entitat o
-- publicació conservada mantenen el contracte editorial de la baixa anterior.
-- Les publicacions personals de la persona només deixen de comptar quan la
-- baixa ja les ha esborrades (purga iniciada). Un esborrat directe d'Auth
-- (tauler o auth.admin.deleteUser) no les esborra: section_submissions no té
-- FK cap a auth.users, i les seues imatges continuen referenciades.
create or replace function private.referencia_storage_ugc(p_bucket text, p_nom text, p_uid uuid)
returns boolean
language sql stable set search_path = ''
as $$
  select p_bucket <> 'xat_adjunts' and (
    exists (select 1 from public.organizations org
      where right(split_part(split_part(org.logo_url, '?', 1), '#', 1), char_length(p_bucket || '/' || p_nom)) = p_bucket || '/' || p_nom
         or right(split_part(split_part(org.hero_url, '?', 1), '#', 1), char_length(p_bucket || '/' || p_nom)) = p_bucket || '/' || p_nom
         or strpos(coalesce(org.presentacio_html, ''), p_bucket || '/' || p_nom) > 0)
    or exists (select 1 from public.section_submissions s
      where (s.owner_user_id is distinct from p_uid or s.author_org_id is not null
          or not exists (select 1 from private.baixes b
            where b.user_id = p_uid and b.purga_fitxers_iniciada_al is not null))
        and strpos(s.payload::text, p_bucket || '/' || p_nom) > 0)
    or exists (select 1 from public.app_content a
      where a.key in ('feedPosts', 'marketItems', 'events', 'mediaItems', 'towns', 'pages')
        and strpos(a.payload::text, p_bucket || '/' || p_nom) > 0)
  );
$$;
revoke all on function private.referencia_storage_ugc(text, text, uuid) from public, anon, authenticated, service_role;

-- Un DELETE pel nom en un bucket amb versionat deixa els binaris antics.
-- Els nodes anteriors al versionat no tenen la columna.
create or replace function private.storage_ugc_bucket_no_versionat(p_bucket text)
returns boolean
language sql stable set search_path = ''
as $$
  select exists (select 1 from storage.buckets b
    where b.id = p_bucket and coalesce(to_jsonb(b)->>'versioning_status', 'DISABLED') = 'DISABLED');
$$;
revoke all on function private.storage_ugc_bucket_no_versionat(text) from public, anon, authenticated, service_role;

create or replace function private.encua_storage_ugc(p_uid uuid)
returns void
language sql volatile security definer set search_path = ''
as $$
  insert into public.cua_purga_storage_ugc as existent (user_id, object_id, object_version, bucket_id, nom, referenciat)
  select p_uid, o.id, o.version, o.bucket_id, o.name, private.referencia_storage_ugc(o.bucket_id, o.name, p_uid)
    from storage.objects o
   where o.bucket_id in ('mitjans', 'mitjans_privats', 'xat_adjunts')
     and coalesce(o.owner_id, o.owner::text) = p_uid::text
   order by o.bucket_id, o.name
   for update of o
  on conflict (bucket_id, nom) do update set referenciat = excluded.referenciat
   where existent.object_id = excluded.object_id
     and existent.object_version is not distinct from excluded.object_version
     and existent.user_id = excluded.user_id
     -- Una reclamació vigent conserva la reserva fins al final del seu torn.
     and (existent.ultim_intent_al is null or existent.ultim_intent_al < now() - interval '10 minutes')
     and existent.referenciat is distinct from excluded.referenciat;
$$;
revoke all on function private.encua_storage_ugc(uuid) from public, anon, authenticated, service_role;

create or replace function private.encua_storage_ugc_en_baixa()
returns trigger
language plpgsql volatile security definer set search_path = ''
as $$
begin
  perform private.encua_storage_ugc(old.id);
  return old;
end;
$$;
revoke all on function private.encua_storage_ugc_en_baixa() from public, anon, authenticated, service_role;
drop trigger if exists encua_storage_ugc_en_baixa on auth.users;
create trigger encua_storage_ugc_en_baixa before delete on auth.users
  for each row execute function private.encua_storage_ugc_en_baixa();

-- Storage esborra pel nom. Mentre una ruta siga pendent, cap escriptura
-- de Storage pot canviar l'objecte ni reocupar la ruta durant el DELETE.
-- El bloqueig d'Auth arbitra pujades en vol amb l'inici de la purga.
create or replace function private.guarda_storage_ugc_en_purga()
returns trigger
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_propietari text := coalesce(new.owner_id, new.owner::text);
  v_uid uuid;
  v_bucket_anterior text;
  v_nom_anterior text;
begin
  if tg_op = 'UPDATE' then
    v_bucket_anterior := old.bucket_id;
    v_nom_anterior := old.name;
    -- Una FK històrica ON DELETE SET NULL pot llevar només `owner` dins
    -- de l'esborrat d'Auth. Mantín les altres columnes i la identitat de
    -- l'objecte si la ruta encara espera el worker.
    if pg_trigger_depth() > 1 and old.owner is not null and new.owner is null
      and (to_jsonb(new) - 'owner' - 'updated_at') = (to_jsonb(old) - 'owner' - 'updated_at')
      and not exists (select 1 from auth.users u where u.id = old.owner)
      and (new.owner_id = old.owner::text or not exists (
        select 1 from public.cua_purga_storage_ugc c
        where c.bucket_id = old.bucket_id and c.nom = old.name and not c.referenciat)) then
      return new;
    end if;
  end if;
  if exists (select 1 from public.cua_purga_storage_ugc c
    where (c.bucket_id, c.nom) in ((new.bucket_id, new.name), (v_bucket_anterior, v_nom_anterior))
      and not c.referenciat)
    or exists (select 1 from private.purga_storage_pendent c
      where c.bucket_id = 'xat_adjunts'
        and (c.bucket_id, c.nom) in ((new.bucket_id, new.name), (v_bucket_anterior, v_nom_anterior))
        and not c.referenciat and c.feta_al is null) then
    raise exception 'SDP-PURGA-004: ruta en procés de purga.' using errcode = '55000';
  end if;

  if new.bucket_id not in ('mitjans', 'mitjans_privats', 'xat_adjunts')
    or v_propietari is null or v_propietari !~ '^[[:xdigit:]]{8}(-[[:xdigit:]]{4}){3}-[[:xdigit:]]{12}$' then
    return new;
  end if;
  v_uid := v_propietari::uuid;
  -- Un UPDATE de Storage ja pot tindre bloquejada la seua fila. No espera
  -- un bloqueig d'Auth que estiga esperant eixa mateixa fila. Qualsevol
  -- bloqueig aliè sobre la fila de la persona es tradueix en un error
  -- reintentable i explicat, no en un 55P03 sense context.
  begin
    perform 1 from auth.users u where u.id = v_uid for key share nowait;
  exception when lock_not_available then
    raise exception 'SDP-PURGA-005: compte en procés de purga o ocupat; torna-ho a provar.' using errcode = '55000';
  end;
  if not found or exists (select 1 from private.baixes b
    where b.user_id = v_uid and b.purga_fitxers_iniciada_al is not null) then
    raise exception 'SDP-PURGA-005: compte en procés de purga.' using errcode = '55000';
  end if;
  return new;
end;
$$;
revoke all on function private.guarda_storage_ugc_en_purga() from public, anon, authenticated, service_role;
drop trigger if exists guarda_storage_ugc_en_purga on storage.objects;
create trigger guarda_storage_ugc_en_purga before insert on storage.objects
  for each row when (new.bucket_id in ('mitjans', 'mitjans_privats', 'xat_adjunts'))
  execute function private.guarda_storage_ugc_en_purga();
drop trigger if exists guarda_storage_ugc_canvi on storage.objects;
create trigger guarda_storage_ugc_canvi before update on storage.objects
  for each row when (old.bucket_id in ('mitjans', 'mitjans_privats', 'xat_adjunts')
    or new.bucket_id in ('mitjans', 'mitjans_privats', 'xat_adjunts'))
  execute function private.guarda_storage_ugc_en_purga();

-- Storage fa la baixa de metadades dins de la seua transacció. Revalidem
-- ací l'objecte i les referències de les rutes en curs de purga.
create or replace function private.valida_storage_ugc_en_esborrat()
returns trigger
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.cua_purga_storage_ugc c
    where c.bucket_id = old.bucket_id and c.nom = old.name
      and not c.referenciat and c.intents > 0
      and (old.id <> c.object_id or old.version is distinct from c.object_version
        or coalesce(old.owner_id, old.owner::text) is distinct from c.user_id::text
        or not private.storage_ugc_bucket_no_versionat(c.bucket_id)
        or private.referencia_storage_ugc(c.bucket_id, c.nom, c.user_id))) then
    raise exception 'SDP-PURGA-006: objecte canviat o referenciat.' using errcode = '55000';
  end if;
  return old;
end;
$$;
revoke all on function private.valida_storage_ugc_en_esborrat() from public, anon, authenticated, service_role;
drop trigger if exists valida_storage_ugc_en_esborrat on storage.objects;
create trigger valida_storage_ugc_en_esborrat before delete on storage.objects
  for each row when (old.bucket_id in ('mitjans', 'mitjans_privats', 'xat_adjunts'))
  execute function private.valida_storage_ugc_en_esborrat();

-- Només es recupera una fila antiga si Storage corrobora la propietat, i
-- el compte ja no existix. Les altres files antigues queden per revisar.
insert into public.cua_purga_storage_ugc
  (id, user_id, object_id, object_version, bucket_id, nom, referenciat, creat_al, intents, ultim_intent_al, ultim_error)
select c.id, c.user_id, o.id, o.version, c.bucket_id, c.nom,
       c.referenciat or private.referencia_storage_ugc(c.bucket_id, c.nom, c.user_id),
       c.creat_al, c.intents, c.ultim_intent_al, c.ultim_error
  from private.purga_storage_pendent c
  join storage.objects o on o.bucket_id = c.bucket_id and o.name = c.nom
 where c.bucket_id in ('mitjans', 'mitjans_privats') and c.feta_al is null
   and coalesce(o.owner_id, o.owner::text) = c.user_id::text
   and not exists (select 1 from auth.users u where u.id = c.user_id)
on conflict (bucket_id, nom) do nothing;
delete from private.purga_storage_pendent c
 where c.bucket_id in ('mitjans', 'mitjans_privats')
   and exists (select 1 from public.cua_purga_storage_ugc nou where nou.id = c.id);

-- La baixa existent conserva les garanties d'Apple i d'entitats. La
-- finestra de cancel·lació acaba quan comença la purga física.
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
             when b.ultim_error like 'SDP-BAIXA-043%' then null
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

create or replace function public.cancela_baixa()
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b   private.baixes;
  v_p   jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  select * into v_b from private.baixes b where b.user_id = v_uid for update;
  if not found then
    return jsonb_build_object('cancelada', true);
  end if;
  if v_b.purga_fitxers_iniciada_al is not null then
    raise exception 'SDP-BAIXA-041: la purga de compte ja ha començat.' using errcode = '55000';
  end if;
  v_p := coalesce(v_b.instantania -> 'perfil', '{}'::jsonb);

  update public.profiles p
     set full_name = coalesce(nullif(btrim(v_p ->> 'full_name'), ''), p.full_name),
         avatar_url = v_p ->> 'avatar_url',
         bio = coalesce(v_p ->> 'bio', ''),
         lema = coalesce(v_p ->> 'lema', ''),
         presentacio_html = coalesce(v_p ->> 'presentacio_html', ''),
         hero_url = v_p ->> 'hero_url',
         icon = v_p ->> 'icon',
         copyright = coalesce(v_p ->> 'copyright', ''),
         is_public = coalesce((v_p ->> 'is_public')::boolean, false),
         baixa_demanada_at = null
   where p.id = v_uid;

  -- Torna a GoTrue el nom, la foto i la bio que la baixa li va retirar.
  if jsonb_typeof(v_b.instantania -> 'metadades') = 'object' and v_b.instantania -> 'metadades' <> '{}'::jsonb then
    begin
      update auth.users u
         set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || (v_b.instantania -> 'metadades')
       where u.id = v_uid;
    exception when insufficient_privilege then
      raise notice 'SDP-BAIXA-022: sense permís per a restaurar les metadades de GoTrue de %.', v_uid;
    end;
  end if;

  -- Torna les claus retirades i el trigger d'autor torna a signar amb el nom.
  update public.section_submissions s
     set payload = s.payload || coalesce(v_b.instantania -> 'publicacions' -> (s.id::text), '{}'::jsonb)
   where s.owner_user_id = v_uid
     and s.author_org_id is null;

  delete from private.baixes where user_id = v_uid;
  return jsonb_build_object('cancelada', true);
end;
$$;

create or replace function public.estat_baixa()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b   private.baixes;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  select * into v_b from private.baixes b where b.user_id = v_uid;
  return jsonb_build_object(
    'demanada', v_b.user_id is not null,
    'demanada_al', v_b.demanada_al,
    'purga_prevista_al', v_b.purga_prevista_al,
    'purga_iniciada_al', v_b.purga_fitxers_iniciada_al);
end;
$$;
create or replace function private.purga_baixes_vencudes(p_limit integer default 100)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  r       record;
  v_fetes integer := 0;
  v_purgada boolean;
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
      v_purgada := private.purga_una_baixa(r.user_id);
      -- El trigger diferit d'una propietària salta ací, dins del bloc, i no al
      -- COMMIT: una persona que falla no tomba la purga de la resta.
      set constraints all immediate;
      set constraints all deferred;
      if v_purgada then v_fetes := v_fetes + 1; end if;
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
revoke all on function private.purga_baixes_vencudes(integer) from public, anon, authenticated, service_role;
revoke all on function private.purga_una_baixa(uuid) from public, anon, authenticated, service_role;
revoke all on function public.cancela_baixa() from public, anon, authenticated, service_role;
grant execute on function public.cancela_baixa() to authenticated;
revoke all on function public.estat_baixa() from public, anon, authenticated, service_role;
grant execute on function public.estat_baixa() to authenticated;

-- Les mateixes RPC reben les dues cues. La cua privada continua resolent
-- la neteja ordinària del Xat. Les antigues files de mitjans amb una ruta
-- com a única prova ja no poden activar un esborrat.
create or replace function public.purga_fitxers_reclama(p_limit integer default 50)
returns table (id bigint, bucket_id text, nom text, intents integer)
language plpgsql volatile security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_maxim integer;
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 200));
  v_n integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PURGA-000: només el servidor.' using errcode = '42501';
  end if;
  begin
    select greatest(1, least(a.valor::integer, 100)) into v_maxim
    from private.ajustos a where a.clau = 'purga_fitxers_max_intents';
  exception when invalid_text_representation or numeric_value_out_of_range then
    v_maxim := null;
  end;
  v_maxim := coalesce(v_maxim, 10);

  -- Una referència d'entitat pot haver aparegut des de la baixa. Un objecte
  -- diferent al mateix nom no es reclama, encara que arribara de fora.
  return query
  with triades as (
    select c.id from public.cua_purga_storage_ugc c
    where not c.referenciat and c.intents < v_maxim
      and (c.ultim_intent_al is null
        or c.ultim_intent_al <= now() - least(make_interval(mins => (5 * 2 ^ least(c.intents, 9))::integer), interval '1 day'))
      and private.storage_ugc_bucket_no_versionat(c.bucket_id)
      and not private.referencia_storage_ugc(c.bucket_id, c.nom, c.user_id)
      and not exists (select 1 from storage.objects o
        where o.bucket_id = c.bucket_id and o.name = c.nom
          and (o.id <> c.object_id or o.version is distinct from c.object_version
            or coalesce(o.owner_id, o.owner::text) is distinct from c.user_id::text))
    order by c.creat_al, c.id limit v_limit for update of c skip locked
  )
  update public.cua_purga_storage_ugc p
     set intents = p.intents + 1, ultim_intent_al = now()
    from triades t where p.id = t.id
  returning p.id, p.bucket_id, p.nom, p.intents;
  get diagnostics v_n = row_count;

  return query
  with triades as (
    select c.id from private.purga_storage_pendent c
    where c.bucket_id = 'xat_adjunts' and not c.referenciat and c.feta_al is null and c.intents < v_maxim
      and (c.ultim_intent_al is null
        or c.ultim_intent_al <= now() - least(make_interval(mins => (5 * 2 ^ least(c.intents, 9))::integer), interval '1 day'))
      and private.storage_ugc_bucket_no_versionat(c.bucket_id)
      and not exists (select 1 from public.cua_purga_storage_ugc nou
        where nou.bucket_id = c.bucket_id and nou.nom = c.nom)
    order by c.creat_al, c.id limit (v_limit - v_n) for update of c skip locked
  )
  update private.purga_storage_pendent p
     set intents = p.intents + 1, ultim_intent_al = now()
    from triades t where p.id = t.id
  returning p.id, p.bucket_id, p.nom, p.intents;
end;
$$;

create or replace function public.purga_fitxers_fets(p_ids bigint[])
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_n integer;
  v_fets integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PURGA-000: només el servidor.' using errcode = '42501';
  end if;
  if p_ids is null or cardinality(p_ids) not between 1 and 1000 then
    raise exception 'SDP-PURGA-001: paràmetre invàlid.' using errcode = '22023';
  end if;

  delete from public.cua_purga_storage_ugc p
   where p.id = any(p_ids) and not p.referenciat and p.intents > 0
     and private.storage_ugc_bucket_no_versionat(p.bucket_id)
     and not exists (select 1 from storage.objects o where o.bucket_id = p.bucket_id and o.name = p.nom);
  get diagnostics v_fets = row_count;
  update public.cua_purga_storage_ugc p
     set ultim_error = case when private.storage_ugc_bucket_no_versionat(p.bucket_id)
       then 'SDP-PURGA-002: l''objecte encara és a Storage.'
       else 'SDP-PURGA-007: bucket absent o amb versionat.' end
   where p.id = any(p_ids) and not p.referenciat and p.intents > 0;

  delete from private.purga_storage_pendent p
   where p.id = any(p_ids) and p.bucket_id = 'xat_adjunts' and not p.referenciat
     and p.feta_al is null and p.intents > 0
     and private.storage_ugc_bucket_no_versionat(p.bucket_id)
     and not exists (select 1 from storage.objects o where o.bucket_id = p.bucket_id and o.name = p.nom);
  get diagnostics v_n = row_count;
  update private.purga_storage_pendent p
     set ultim_error = case when private.storage_ugc_bucket_no_versionat(p.bucket_id)
       then 'SDP-PURGA-002: l''objecte encara és a Storage.'
       else 'SDP-PURGA-007: bucket absent o amb versionat.' end
   where p.id = any(p_ids) and p.bucket_id = 'xat_adjunts' and not p.referenciat
     and p.feta_al is null and p.intents > 0;
  return v_fets + v_n;
end;
$$;

create or replace function public.purga_fitxers_fallits(p_ids bigint[], p_error text)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_n integer;
  v_fallits integer;
  v_error text := left(coalesce(nullif(btrim(p_error), ''), 'sense detall'), 200);
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PURGA-000: només el servidor.' using errcode = '42501';
  end if;
  if p_ids is null or cardinality(p_ids) not between 1 and 1000 then
    raise exception 'SDP-PURGA-001: paràmetre invàlid.' using errcode = '22023';
  end if;
  update public.cua_purga_storage_ugc p set ultim_error = v_error
   where p.id = any(p_ids) and not p.referenciat and p.intents > 0;
  get diagnostics v_fallits = row_count;
  update private.purga_storage_pendent p set ultim_error = v_error
   where p.id = any(p_ids) and p.bucket_id = 'xat_adjunts' and not p.referenciat
     and p.feta_al is null and p.intents > 0;
  get diagnostics v_n = row_count;
  return v_fallits + v_n;
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
