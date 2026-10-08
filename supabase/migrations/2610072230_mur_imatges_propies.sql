-- ============================================================================
-- 261007_2230 · El Mur només guarda imatges pròpies
-- Decisió 3 del Mestre (261007, confirmada): «Imatges externes al Mur:
-- PROHIBIDES (PRIVACITAT). Per a evitar el rastreig d'IPs dels usuaris per
-- part de tercers, només es permetran imatges allotjades localment o pujades
-- al nostre servidor. Les imatges externes s'han de bloquejar o forçar la seua
-- pujada.»
-- Relleu 261007 (informe 261007_1715_auditoria_claude.md, «Límits» §4,
-- decisió 3) i troballa de seguretat «Les targetes del Mur demanen qualsevol
-- imatge http(s) de tercers amb referent».
--
-- NO S'APLICA SOLA: la llança el Mestre. Additiva i idempotent (es pot tornar
-- a executar). Requerix 260908_0000 .. 260926_1500 aplicades.
--
-- El client ja ho fa en pintar (mode estricte de src/utils/sanitize.js,
-- esFontImatgePropia, a TargetaDelMur, EventCard i el detall). Esta és la
-- segona línia: el que escriu qualsevol veí directament per PostgREST ja no
-- arriba a la base de dades amb una imatge d'un servidor de fora.
--
-- QUÈ FA. Un trigger BEFORE INSERT OR UPDATE a public.section_submissions,
-- NOMÉS a les files que llig el Mur (section_id 'mur', 'mercat' i 'events':
-- loadMur de src/data/supabase/content.js; section_id és immutable,
-- SDP-SEC-002), BUIDA (lleva la clau) els camps d'imatge del payload que no
-- són propis. Revisió adversarial del 261007 · La decisió és del Mur: les
-- files 'multimedia' (la galeria, amb el seu `src`) i 'notes' queden com
-- abans fins que el Mestre diga si també hi van. Els camps:
--   · claus soltes: image, image_url, imageSrc, src, author_avatar,
--     avatar_url, avatarUrl i logo_image (NotesContext.jsx, publishNote;
--     mapejadorSeccions.js, mapSectionSubmissionToItem; els lectors de
--     TargetaDelMur, EventCard, detailSectionMeta i elementDeSeccio);
--   · llistes: cada element de `images` i la `image` de cada objecte de
--     `variations` (els productes del Mercat, imatgesDeProducte.js).
-- Propi vol dir: buit; data:image/(png|jpeg|jpg|webp|gif|avif); (sense SVG,
-- com esFontImatgeSegura); sdp-media://mitjans/ o sdp-media://mitjans_privats/
-- (la referència opaca que desa la pujada, storage.js); un camí que comença
-- per UNA sola barra ('/assets/…', el resol el paquet); o una URL http(s)
-- d'un origen declarat com a nostre a private.ajustos (vegeu més avall). Un
-- valor amb caràcters de control o amb barra inversa no és mai propi: el
-- navegador els lleva o els llig com a barra, i '/\fora.example' és un altre
-- origen.
--
-- PER QUÈ BUIDAR I NO REBUTJAR. NotesContext.jsx envia `author_avatar` amb la
-- foto del perfil, i la d'una persona que entra amb Google és un avatar de
-- lh3.googleusercontent.com. Rebutjar la fila (raise) deixaria eixa gent sense
-- poder publicar res al Mur. Buidar la clau dona el mateix que ja fa el client
-- amb el mode estricte: la targeta pinta la silueta de sempre en lloc de la
-- foto, i sense portada no en pinta cap. Publicar torna a enviar el payload
-- sencer: si demà la foto és pròpia (pujada al nostre Storage), torna.
--
-- ELS ORÍGENS PROPIS. La base de dades no sap des de quin domini se la crida.
-- El Mestre els declara una sola volta, separats per espais o comes, sense
-- barra final (l'origen del Supabase de Sóc de Poble, el del seu Storage, i
-- si cal el de socdepoble.org):
--
--   insert into private.ajustos (clau, valor)
--   values ('origens_mitjans_propis', 'https://<projecte>.supabase.co')
--   on conflict (clau) do update set valor = excluded.valor;
--
-- Sense eixa fila, cap URL http(s) absoluta és pròpia i totes es buiden (les
-- pujades legítimes viatgen com a sdp-media:// i els recursos del paquet com
-- a '/assets/…': no en depenen). La migració ho avisa amb un NOTICE.
--
-- LES FILES QUE JA HI HA no es toquen: el trigger actua en la pròxima escriptura
-- de cada fila. Un UPDATE massiu dispararia també
-- section_submissions_conserva_creacio, que posa updated_at = now() i faria
-- que totes les publicacions del Mur pareguessen editades ara (dataDElement).
-- Si el Mestre vol netejar-les, private.mur_neteja_imatges(payload, origens)
-- és la mateixa regla, pura, per a fer-ho amb eixe trigger aturat.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Els orígens propis declarats ────────────────────────────────────────
-- Llista neta: minúscules, sense espais ni barra final, sense buits. Sense la
-- fila, una llista buida. Llig private.ajustos, que està revocada per a
-- authenticated: només la crida el trigger (SECURITY DEFINER, més avall).
create or replace function private.origens_mitjans_propis()
returns text[]
language sql
stable
set search_path = ''
as $$
  select coalesce(
    array_agg(rtrim(o.origen, '/')) filter (where o.origen <> ''),
    '{}'::text[])
  from private.ajustos a
  cross join lateral regexp_split_to_table(lower(btrim(a.valor)), '[[:space:],]+') as o(origen)
  where a.clau = 'origens_mitjans_propis';
$$;
revoke execute on function private.origens_mitjans_propis() from public, anon, authenticated;

-- ── 2 · Una font d'imatge pròpia (pura) ─────────────────────────────────────
-- p_valor és el valor jsonb de la clau: null (absent) o un null de JSON, propi
-- (no hi ha res a demanar); un que no és text (un objecte, una llista), no.
-- L'origen d'una URL http(s) és el tros fins a la primera '/', '?' o '#':
-- amb usuari ('https://nostre@fora.example') o amb port no casa amb cap
-- origen declarat i no és propi. La comparació és exacta, en minúscules.
create or replace function private.mur_imatge_propia(p_valor jsonb, p_origens text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_valor is null or jsonb_typeof(p_valor) = 'null' then true
    when jsonb_typeof(p_valor) <> 'string' then false
    when (p_valor #>> '{}') = '' then true
    when (p_valor #>> '{}') ~ '[[:cntrl:]\\]' then false
    when (p_valor #>> '{}') ~* '^data:image/(png|jpeg|jpg|webp|gif|avif);' then true
    when (p_valor #>> '{}') ~* '^sdp-media://(mitjans_privats|mitjans)/' then true
    when (p_valor #>> '{}') ~ '^/[^/]' then true
    when (p_valor #>> '{}') ~* '^https?://' then coalesce(
      lower(substring((p_valor #>> '{}') from '^[A-Za-z]+://[^/?#]*')) = any (coalesce(p_origens, '{}'::text[])),
      false)
    else false
  end;
$$;
revoke execute on function private.mur_imatge_propia(jsonb, text[]) from public, anon, authenticated;

-- ── 3 · El payload sense imatges de fora (pura) ─────────────────────────────
-- Lleva les claus soltes que no són pròpies, filtra `images` i lleva la
-- `image` impròpia de cada variació. La resta del payload, intacta i en el
-- mateix ordre. Un payload que no és un objecte torna tal qual.
create or replace function private.mur_neteja_imatges(p_payload jsonb, p_origens text[])
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_payload jsonb := p_payload;
  v_clau    text;
  v_llista  jsonb;
begin
  if jsonb_typeof(v_payload) is distinct from 'object' then
    return v_payload;
  end if;

  foreach v_clau in array array['image', 'image_url', 'imageSrc', 'src', 'author_avatar', 'avatar_url', 'avatarUrl', 'logo_image'] loop
    if not private.mur_imatge_propia(v_payload -> v_clau, p_origens) then
      v_payload := v_payload - v_clau;
    end if;
  end loop;

  if jsonb_typeof(v_payload -> 'images') = 'array' then
    select coalesce(jsonb_agg(e.valor order by e.ordre), '[]'::jsonb)
      into v_llista
    from jsonb_array_elements(v_payload -> 'images') with ordinality as e(valor, ordre)
    where private.mur_imatge_propia(e.valor, p_origens);
    v_payload := jsonb_set(v_payload, '{images}', v_llista);
  elsif v_payload ? 'images' then
    v_payload := v_payload - 'images';
  end if;

  if jsonb_typeof(v_payload -> 'variations') = 'array' then
    select coalesce(jsonb_agg(
             case
               when jsonb_typeof(e.valor) = 'object' and not private.mur_imatge_propia(e.valor -> 'image', p_origens)
                 then e.valor - 'image'
               else e.valor
             end order by e.ordre), '[]'::jsonb)
      into v_llista
    from jsonb_array_elements(v_payload -> 'variations') with ordinality as e(valor, ordre);
    v_payload := jsonb_set(v_payload, '{variations}', v_llista);
  end if;

  return v_payload;
end;
$$;
revoke execute on function private.mur_neteja_imatges(jsonb, text[]) from public, anon, authenticated;

-- ── 4 · El trigger ──────────────────────────────────────────────────────────
-- SECURITY DEFINER perquè SECURITY INVOKER no n'hi ha prou: el trigger corre
-- amb el rol de qui escriu (authenticated) i private.ajustos li està revocada
-- (260908_0000). Mateix patró que trg_force_submission_author: search_path
-- buit, tot qualificat, i ningú no la pot cridar (un trigger no comprova
-- EXECUTE). Va després de sdp_force_author (ordre alfabètic dels triggers
-- BEFORE): no toca cap clau d'autoria, i sdp_force_author cap d'imatge.
-- La clàusula WHEN el limita a les seccions del Mur (vegeu la capçalera).
create or replace function private.trg_mur_imatges_propies()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.payload := private.mur_neteja_imatges(new.payload, private.origens_mitjans_propis());
  return new;
end;
$$;
revoke execute on function private.trg_mur_imatges_propies() from public, anon, authenticated;

drop trigger if exists sdp_mur_imatges_propies on public.section_submissions;
create trigger sdp_mur_imatges_propies
  before insert or update on public.section_submissions
  for each row
  when (new.section_id in ('mur', 'mercat', 'events'))
  execute function private.trg_mur_imatges_propies();

comment on function private.trg_mur_imatges_propies() is
  'Decisió 3 del Mestre (261007): el payload de les files del Mur de section_submissions (mur, mercat, events) només guarda imatges pròpies; les de fora es lleven.';

-- ── 5 · Avís si encara no hi ha cap origen propi declarat ───────────────────
do $$
begin
  if cardinality(private.origens_mitjans_propis()) = 0 then
    raise notice 'SDP-MUR-IMG-001: cap origen propi a private.ajustos (origens_mitjans_propis). Fins que el declares, el Mur buidarà tota URL http(s) absoluta dels camps d''imatge.';
  end if;
end;
$$;

commit;
