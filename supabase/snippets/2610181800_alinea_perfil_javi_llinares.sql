-- ============================================================================
-- 261018_1800 · Pla 261018_1605 · Tasca 0 (D7) · Alinea la fitxa remota de la
-- persona pilot amb la canònica del paquet
-- Ordre del Mestre (18-10-2026; pla
-- 261018_1605_pla_implementacio_perfil_public_multimedia_i_poble.md, Tasca 0):
-- un sol perfil de la persona pilot, el mateix en local i en remot.
--
-- NO ÉS CAP MIGRACIÓ: és un fragment per a l'editor SQL de Supabase. No el
-- llança cap porta ni cap agent: l'executa el Mestre, a mà, DESPRÉS d'aplicar
-- 2610160250_perfil_update_propi.sql. El client no pot escriure la fila d'un
-- altre compte (ni la seua sense sessió), i per això la persistència va ací.
--
-- EXECUTEU-LO UNA SOLA VEGADA. Si després buideu a posta la bio o el lema, o
-- trieu la foto de Google com a avatar, no el torneu a executar: tornaria a
-- omplir els buits i a posar la foto canònica. Dues execucions seguides, en
-- canvi, no canvien res la segona vegada (el WHERE només casa amb una fila que
-- encara té algun buit o una foto de Google).
-- La publicació de la fitxa (is_public = true) NO és ací: és un altre
-- fragment, 2610181800_publica_perfil_javi_llinares.sql, d'una sola vegada,
-- perquè tornar-lo a executar no desfaça una tria privada posterior.
--
-- QUÈ FA (només la fila de public.profiles del compte de la persona pilot):
--   · El compte es resol pel correu (auth.users.email, sense distingir
--     majúscules), el mateix que reconeix el client (CORREU_PERSONA_PILOT,
--     src/data/identitatsSeed.js); cap UUID al repositori. Com al client
--     (esComptePersonaPilot), només si el correu està confirmat o el compte
--     té una identitat de Google. Si no n'hi ha exactament un, avorta sencer
--     (SDP-PILOT-001) i no canvia res.
--   · Omple NOMÉS els buits (null, '' o només espais) amb els MATEIXOS valors
--     canònics de PERSONA_PILOT: full_name, town_name (POBLE_FUNDACIONAL), bio
--     i lema. Una dada que la fila ja porta no es toca mai. La capçalera
--     canònica és cap (hero_url ''): no se n'escriu cap.
--   · avatar_url: la foto canònica del paquet només si la fila no en porta cap
--     o la que porta és la de Google (googleusercontent.com o ggpht.com). Una
--     foto pròpia (sdp-media://, una ruta del lloc, el Storage del node) es
--     queda.
--   · is_public: NO el toca (vegeu baix el fragment de la publicació).
--   · visibility: MAI. El CHECK de profiles només admet 'private'
--     (2609080000) i la publicació d'una persona la diu is_public.
--   · Una fitxa amb la baixa demanada (baixa_demanada_at) no es toca.
-- Respecta les restriccions de les columnes: full_name entre 1 i 120
-- caràcters, bio de 500 com a màxim (profiles_bio_llargaria), lema de 256 com
-- a màxim (2609281500); avatar_url i town_name no en tenen cap, i
-- '/assets/fotos/…' és una ruta del mateix lloc, com la llig el client
-- (esFontImatgePropia).
--
-- ABANS, a soles: seleccioneu i executeu NOMÉS esta consulta de només lectura
-- (l'editor de Supabase només ensenya el resultat de l'última sentència d'un
-- fitxer sencer) i guardeu-ne el resultat: és el que permet desfer-ho a mà,
-- camp a camp. DESPRÉS, la mateixa consulta ha de mostrar els valors canònics
-- als buits.
--
--   select p.id, p.full_name, p.avatar_url, p.town_name, p.bio, p.lema, p.hero_url,
--          p.is_public, p.visibility, p.baixa_demanada_at, u.email_confirmed_at,
--          exists (select 1 from auth.identities i
--                   where i.user_id = u.id and i.provider = 'google') as amb_google
--     from public.profiles p
--     join auth.users u on u.id = p.id
--    where lower(u.email) = 'socdepoblecom@gmail.com';
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
declare
  v_comptes integer;
begin
  select count(*) into v_comptes
    from auth.users u
   where lower(u.email) = 'socdepoblecom@gmail.com'
     and (u.email_confirmed_at is not null
          or exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google'));
  if v_comptes <> 1 then
    raise exception 'SDP-PILOT-001: hi ha % comptes acreditats amb el correu de la persona pilot; no s''alinea res.', v_comptes;
  end if;
end
$$;

update public.profiles p
   set full_name = case when coalesce(btrim(p.full_name), '') = '' then 'Javi Llinares' else p.full_name end,
       town_name = case when coalesce(btrim(p.town_name), '') = '' then 'La Torre de les Maçanes' else p.town_name end,
       bio = case when coalesce(btrim(p.bio), '') = '' then 'La Torre de les Maçanes' else p.bio end,
       lema = case when coalesce(btrim(p.lema), '') = '' then 'Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l''Associació El Rentonar, coordine el Projecte Sóc de Poble.' else p.lema end,
       avatar_url = case
         when coalesce(btrim(p.avatar_url), '') = ''
           or btrim(p.avatar_url) ~* '^https://([a-z0-9-]+\.)*(googleusercontent\.com|ggpht\.com)(/|$)'
         then '/assets/fotos/javi-llinares-perfil-1200px.jpg'
         else p.avatar_url
       end
  from auth.users u
 where u.id = p.id
   and lower(u.email) = 'socdepoblecom@gmail.com'
   and (u.email_confirmed_at is not null
        or exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google'))
   and p.baixa_demanada_at is null
   and (coalesce(btrim(p.full_name), '') = ''
        or coalesce(btrim(p.town_name), '') = ''
        or coalesce(btrim(p.bio), '') = ''
        or coalesce(btrim(p.lema), '') = ''
        or coalesce(btrim(p.avatar_url), '') = ''
        or btrim(p.avatar_url) ~* '^https://([a-z0-9-]+\.)*(googleusercontent\.com|ggpht\.com)(/|$)');

commit;
