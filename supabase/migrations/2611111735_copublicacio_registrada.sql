-- R19 · La publicació editorial té una identitat pròpia, independent de l'autoria i els drets.
-- Depén de 2609080000, 2609261500, 2610042350, 2610061448 i 2610081401.
-- Configuració de desplegament (private.ajustos, només operació de base de dades):
--   copublicacio_actor_socdepoble: UUID de l'organització oficial pública.
--   copublicacio_actor_rentonar: UUID de l'organització pública d'El Rentonar.
-- Si no hi ha ajust, es comproven els dos UUIDs fundacionals de identitatsSeed.js.
-- Un nom o slug homònim no conferix identitat editorial.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists private.recursos_copublicacio_paquet (
  tipus text not null check (tipus in ('pagina', 'llibre_cataleg', 'recepta', 'arbre', 'planta', 'llavor')),
  recurs_id text not null check (recurs_id ~ '^[A-Za-z0-9_-][A-Za-z0-9_:-]{0,127}$'),
  origen_clau text check (origen_clau in ('rentonar')),
  primary key (tipus, recurs_id)
);
alter table private.recursos_copublicacio_paquet enable row level security;
revoke all on table private.recursos_copublicacio_paquet from public, anon, authenticated, service_role;

-- Índex de les peces publicades al paquet R18. Les pàgines i articles que naixen
-- al servidor es verifiquen al seu origen. Una ampliació del paquet afig els IDs
-- a este registre amb la seua pròpia migració.
insert into private.recursos_copublicacio_paquet (tipus, recurs_id, origen_clau)
select tipus, unnest(ids), origen_clau
from (values
  ('pagina', array[
    'anatomia-rural', 'anima', 'animalets',
    'arbres-monumentals', 'banc-de-llavors', 'cervell',
    'consola', 'constitucio', 'descarregues',
    'dispositius', 'disseny', 'drets-autor',
    'fedivers', 'fediversity', 'habitatge',
    'herbari', 'la-iaia-sabuda', 'legal',
    'node-zero', 'notes', 'notes_shared',
    'projecte', 'publicar_calendari', 'publicar_mapa',
    'publicar_mercat', 'publicar_mur', 'receptes',
    'roadmap', 'rutes-de-poble', 'treball',
    'vehicle_compartit', 'versions', 'wikidepoble',
    'xat'
  ], null),
  ('llibre_cataleg', array[
    'atles-catalunya', 'avl-mallorca', 'banc-de-llavors',
    'cataleg-valencia', 'herbari', 'que-dinem'
  ], null),
  ('llibre_cataleg', array[
    'la-torre-de-les-macanes'
  ], 'rentonar'),
  ('recepta', array[
    'aigua-sal', 'aladroc-amb-vinagre', 'aladroc-fregit',
    'alberginies-al-forn', 'alberginies-farcides-al-forn', 'alberginies-fregides',
    'alberginies-torrades', 'aletes-i-cuixes-de-pollastre', 'allioli',
    'amanida-de-tomaca-all-i-tonyina', 'amanida-russa', 'anxoves',
    'arnadi', 'arrop-i-talladetes', 'arros-al-forn',
    'arros-amb-conill', 'arros-amb-ventre', 'arros-blanc',
    'arros-d-hivern', 'arros-melos-de-peix', 'arros-negre',
    'bacallarets-fregits', 'bajoca-torrada', 'bajoques-al-chilindron',
    'bajoques-farcides', 'bajoquins-al-forn', 'bambes',
    'bescuit-d-ametla', 'blat-picat', 'borreta',
    'bullit', 'bunyols-de-carabassa', 'bunyols-de-vent-o-de-pessic',
    'cacaus-fregits', 'cacaus-torrats', 'cafe-licor',
    'calamars-arrebossats', 'calamars-xicotets-arrebossats', 'canelons-d-espinacs',
    'canelons-de-pollastre', 'capella-torrat', 'carabassa-al-forn',
    'caragols-amb-tomaca', 'carinyitos', 'carquinyols-de-bescuit',
    'carxofes-al-forn', 'carxofes-amb-gambes', 'carxofes-arrebossades',
    'carxofes-fregides', 'carxofes-torrades', 'clotxines-al-vapor',
    'coca-de-batre', 'coca-de-canonge', 'coca-de-carabassa-de-tots-sants',
    'coca-de-farina', 'coca-de-nous', 'coca-de-perellons',
    'coca-de-tomaca', 'coca-de-xocolate', 'cocotets-de-tomaca-o-de-verdura',
    'codonyat', 'conill-al-forn-amb-creilles', 'conserva-de-tomaca',
    'coquetes-fregides', 'costelles-de-vedella', 'creilles-al-forn',
    'crema-per-a-farcir', 'cuixot-i-formatge', 'dacsa-fregida',
    'dolc-de-tomaca', 'escabetx-de-sardina', 'esclata-sangs-torrats',
    'esparteros', 'espencat-de-tomaca', 'espigues-torrades',
    'espinacs-passats-per-la-paella', 'fabiola-de-coco', 'faves-bullides',
    'faves-fregides', 'fesols-estofats', 'fetge-o-magre-fregit',
    'fideua', 'figues-seques', 'flam-d-ametla',
    'floricol-bullida', 'formatge-blanquet', 'fregit-de-tomaca-amb-bacallarets',
    'fregit-de-tomaca-amb-conill', 'fregit-de-tomaca-amb-llomellos-i-llonganisses', 'gelat-de-vainilla',
    'guisat-de-verdures-i-pollastre', 'herbero', 'licor-de-salvia',
    'llentilles', 'lluc-amb-gambes', 'llucets-passats-per-farina-i-fregits',
    'macarrons-amb-tomaca', 'magdalenes', 'mandonguilles-d-aladroc',
    'mandonguilles-de-bacalla', 'mandonguilles-de-carn', 'mantegades',
    'mero-torrat', 'mones-de-pasqua', 'mongetes',
    'morro-fregit', 'mullador-de-pesols-amb-conill', 'mullador-de-vedella',
    'natilles', 'olives-blanquetes', 'olives-mancanelles-en-sosa',
    'olives-negretes-madures', 'olla-de-carn', 'olleta-murera',
    'ou-de-tomaca', 'ous-farcits', 'pa-rustic',
    'paella-de-carxofes-i-faves', 'paella-de-floricol', 'panellets-de-tots-sants',
    'pastis-de-galetes', 'pastissos-d-aire', 'pastissos-de-fullada',
    'pastissos-de-nadal', 'patxaran', 'peixet-fregit',
    'pericana', 'petxines-fregides', 'polpets-amb-ceba-i-tomaca',
    'potatge', 'renyons-de-masero', 'rollets-d-ou',
    'roses-amb-mel', 'rosquetes-de-pa', 'rosquetes-de-pa-al-forn',
    'rubiols-fregits-amb-allets', 'sang-amb-ceba', 'sepia-torrada',
    'sopa-d-alls', 'sopetes', 'tomaques-seques-fregides',
    'tortell-de-nous-i-ametles', 'truita-de-creilla', 'ventre-de-corder',
    'ventre-de-vedella', 'vi-de-cirer', 'vi-de-nous',
    'xampinyons-fregits-amb-allets', 'xurros'
  ], null),
  ('arbre', array[
    'la-torre-de-les-macanes:arbre-01-albers-blancs-del-pont', 'la-torre-de-les-macanes:arbre-02-alborc-del-xipreret', 'la-torre-de-les-macanes:arbre-03-carrasca-de-la-foia-blanca',
    'la-torre-de-les-macanes:arbre-04-carrasca-de-la-zurca', 'la-torre-de-les-macanes:arbre-05-carrasca-de-nofre', 'la-torre-de-les-macanes:arbre-06-carrasca-del-buitre',
    'la-torre-de-les-macanes:arbre-07-carrasca-del-moral', 'la-torre-de-les-macanes:arbre-08-fleixos-del-barranc-d-horta', 'la-torre-de-les-macanes:arbre-09-ginebre-de-mitja-orella',
    'la-torre-de-les-macanes:arbre-10-llorer-de-villa-maria', 'la-torre-de-les-macanes:arbre-11-oms-de-la-placa-de-l-esglesia', 'la-torre-de-les-macanes:arbre-12-pi-de-la-foia-boix',
    'la-torre-de-les-macanes:arbre-13-pi-del-mas-de-pipa', 'la-torre-de-les-macanes:arbre-14-pi-del-pla-verd', 'la-torre-de-les-macanes:arbre-15-pi-dels-arrendaors',
    'la-torre-de-les-macanes:arbre-16-roures-de-nofre', 'la-torre-de-les-macanes:arbre-17-xiprer-de-la-foia', 'la-torre-de-les-macanes:arbre-18-xiprers-del-calvari',
    'la-torre-de-les-macanes:arbre-19-xiprers-del-cementeri'
  ], 'rentonar'),
  ('planta', array[
    'herbari-001-acacia-robinia', 'herbari-002-alber-blanc', 'herbari-003-albercoquer',
    'herbari-004-alfabega', 'herbari-005-ametler', 'herbari-006-amor-de-fadri',
    'herbari-007-anouer', 'herbari-008-anouer-del-japo', 'herbari-009-aranyoner',
    'herbari-010-arbocer-madronyer', 'herbari-011-arbre-de-judes', 'herbari-012-arbre-del-paradis',
    'herbari-013-arnet-roig-cirerer-de-pastor', 'herbari-014-atzerolera', 'herbari-015-auro',
    'herbari-016-auro-del-sucre', 'herbari-017-auro-vermell', 'herbari-018-avellaner',
    'herbari-019-avena', 'herbari-020-bacorera', 'herbari-021-baladre',
    'herbari-022-bedoll', 'herbari-023-blat-forment', 'herbari-024-bresquillera',
    'herbari-025-camamirla-revisar', 'herbari-026-camamirla-borda-revisar', 'herbari-027-camelia',
    'herbari-028-cantueso', 'herbari-029-caquier', 'herbari-030-carrasca',
    'herbari-031-castanyer', 'herbari-032-castanyer-bord', 'herbari-033-ceba-mora',
    'herbari-034-ciprer', 'herbari-035-ciprer-blau', 'herbari-036-ciprer-de-plata',
    'herbari-037-ciprer-lambert', 'herbari-038-cirer', 'herbari-039-codonyer',
    'herbari-040-cornera', 'herbari-041-cornera-blanca', 'herbari-042-cornera-rastrera',
    'herbari-043-coscolla', 'herbari-044-curri', 'herbari-045-encens',
    'herbari-046-espigol', 'herbari-047-espigol-femella', 'herbari-048-figuera',
    'herbari-049-fleix', 'herbari-050-fotinia-roja', 'herbari-051-garrofer',
    'herbari-052-gerdera-groga', 'herbari-053-ginebre', 'herbari-054-ginjoler',
    'herbari-055-grevol', 'herbari-056-groseller-negre', 'herbari-057-groseller-roig',
    'herbari-058-hedrera', 'herbari-059-herba-sana', 'herbari-060-julivert',
    'herbari-061-lavanda', 'herbari-062-lillera', 'herbari-063-llentiscle',
    'herbari-064-llidoner', 'herbari-065-lliri-blau-girablau', 'herbari-066-llorer',
    'herbari-067-loropetal', 'herbari-068-magraner', 'herbari-069-magraner-nano',
    'herbari-070-marfull', 'herbari-071-margarida-groga', 'herbari-072-marialluisa-herballuisa',
    'herbari-073-menta', 'herbari-074-morera-blanca-revisar', 'herbari-075-morera-negra-revisar',
    'herbari-076-murta', 'herbari-077-nabiu-blau', 'herbari-078-nabiu-roig',
    'herbari-079-nesprer', 'herbari-080-nesprer-del-japo', 'herbari-081-nesto-nyestro',
    'herbari-082-olivaro', 'herbari-083-olivera', 'herbari-084-ordi-civada',
    'herbari-085-orenga', 'herbari-086-panis-blat-de-moro', 'herbari-087-parra',
    'herbari-088-pebrella', 'herbari-089-perera', 'herbari-090-perera-de-flor',
    'herbari-091-perico', 'herbari-092-pi-revisar', 'herbari-093-pi-pinyer-revisar',
    'herbari-094-piracanta', 'herbari-095-pistatxer', 'herbari-096-pomera',
    'herbari-097-pomera-borda-blanca', 'herbari-098-pomera-borda-roja', 'herbari-099-prunera',
    'herbari-100-prunera-de-fulla-vermella', 'herbari-101-rabet-de-gat', 'herbari-102-romer',
    'herbari-103-romer-reptant', 'herbari-104-roser', 'herbari-105-roser-sense-punxes',
    'herbari-106-ruda', 'herbari-107-salvia', 'herbari-108-salvia-de-mariola',
    'herbari-109-segol', 'herbari-110-servera', 'herbari-111-teix',
    'herbari-112-tillera', 'herbari-113-timo', 'herbari-114-timo-allimonat',
    'herbari-115-timo-reptant', 'herbari-116-vareta-de-sant-josep', 'herbari-117-vincapervinca'
  ], null),
  ('llavor', array[
    'atles-14-all', 'atles-24-carbasso', 'atles-28-cigro',
    'atles-30-cogombre', 'atles-34-col-de-cabdell', 'atles-38-escarola',
    'atles-40-fajol', 'atles-42-fava', 'atles-44-fesolet',
    'atles-46-guixes', 'atles-55-pastanaga', 'atles-59-pesol',
    'atles-61-porro', 'atles-63-salsifi', 'atles-65-sindria',
    'avl-11-alberginia-morada', 'avl-11-alfabeguera-de-fulla-morada', 'avl-11-alfabeguera-de-fulla-verda',
    'avl-11-blat-de-les-indies', 'avl-12-carabassa-d-encarabassat', 'avl-12-carabassa-de-cabell-d-angel',
    'avl-12-carabassa-de-fregall', 'avl-12-carabassa-llarga', 'avl-13-carabassa-petita',
    'avl-13-enciam-de-tres-ulls', 'avl-13-fesol', 'avl-13-fesol-llarg-o-de-metro',
    'avl-14-melo-des-clot-des-pou', 'avl-14-melo-erico', 'avl-14-melo-fei-rodo',
    'avl-14-melo-manto-del-senyor', 'avl-15-mongeta-blanca', 'avl-15-mongeta-de-careta',
    'avl-15-mongeta-negra', 'avl-15-mongeta-tendra-blanca', 'avl-16-pebre-de-banya-de-cabra',
    'avl-16-pebre-de-fulla-d-olivera', 'avl-16-pebre-de-padron', 'avl-16-pebre-de-tap-de-corti',
    'avl-17-pebre-d-envinagrar', 'avl-17-pebre-ros', 'avl-17-pebre-ros-gruixat',
    'avl-17-sindria-blanca-i-allargada', 'avl-18-sindria-de-pinyol-blanc', 'avl-18-sindria-de-pinyol-vermell',
    'avl-18-tomatiga-de-bombilla', 'avl-18-tomatiga-de-cor-de-bou', 'avl-19-tomatiga-de-mutxamel',
    'avl-19-tomatiga-de-pera', 'avl-19-tomatiga-de-ramellet-de-canyisset', 'avl-19-tomatiga-de-ramellet-de-ferro',
    'avl-20-tomatiga-de-ramellet-de-mateta', 'avl-20-tomatiga-de-ramellet-de-na-solereta', 'avl-20-tomatiga-de-valldemossa',
    'avl-20-tomatiga-negra', 'avl-22-ceba-blanca-mallorquina', 'avl-22-ceba-vermella-d-andratx',
    'avl-22-ciuro-mallorqui', 'avl-22-col-borratxona', 'avl-23-col-borratxona-petita-o-de-7-setmanes',
    'avl-23-col-caputxina', 'avl-23-col-de-cabdell', 'avl-23-colflori-de-fulla-d-espasa',
    'avl-24-colflori-de-la-purissima', 'avl-24-colflori-de-nadal', 'avl-24-colflori-de-sant-antoni',
    'avl-24-colflori-de-sant-josep', 'avl-25-colflori-d-orella-d-ase', 'avl-25-colflori-de-ram-o-de-pasqua',
    'avl-25-colflori-de-tots-sants', 'avl-25-enciam-negre', 'avl-26-enciam-revull-blanc',
    'avl-26-fava-mallorquina', 'avl-26-fava-negra', 'avl-26-julivert-mallorqui',
    'avl-27-lletuga-murtera', 'avl-27-pastanaga-morada', 'avl-27-pesol-d-esclovellar',
    'avl-27-pesol-de-bullir', 'avl-28-rave-mallorqui', 'cv-04-alberginia-blanca',
    'cv-05-alberginia-llistada-de-gandia', 'cv-06-alberginia-roja-de-gandia', 'cv-07-pimento-del-cuerno',
    'cv-08-pimento-quatre-morros', 'cv-09-pimento-valencia', 'cv-10-pimento-nyora',
    'cv-11-tomaca-mutxamel', 'cv-12-tomaca-del-pebre', 'cv-13-tomaca-de-pera',
    'cv-14-tomaca-quarantena', 'cv-15-tomaca-rosada-d-altea', 'cv-16-tomaca-valenciana-blanca',
    'cv-17-tomaca-valenciana-masclet', 'cv-18-garrofo-pintat', 'cv-19-bajoca-de-ferradura',
    'cv-20-bajoca-de-la-mantega', 'cv-21-bajoca-roget', 'cv-22-bajoca-de-careta-curta',
    'cv-23-pesol-de-trencar', 'cv-24-pesol-fi', 'cv-25-fava-de-betera',
    'cv-26-cacau-del-collaret', 'cv-27-carabassa-xata-de-torrar', 'cv-28-carabassa-de-cacauet',
    'cv-29-carabasseta-blanca', 'cv-30-carabasseta-d-utiel', 'cv-31-cogombre-curt-de-vinagre',
    'cv-32-cogombre-de-la-nucia', 'cv-33-melo-d-alger-pipa-roja', 'cv-34-melo-d-alger-sang-de-bou',
    'cv-35-melona', 'cv-36-melo-blanc-ratllat', 'cv-37-melo-tendral-negre',
    'cv-38-safanoria-morada', 'cv-39-col-de-xativa', 'cv-40-rave-roig',
    'cv-41-ceba-bavosa', 'cv-42-ceba-de-mig-gra', 'cv-43-ceba-de-gra',
    'cv-44-encisam-mantegos-d-ademus', 'cv-45-encisam-morat-de-morella', 'cv-46-encisam-meravella-d-espada',
    'cv-47-encisam-orella-de-burro', 'cv-48-bleda-d-eslida'
  ], null)
) as paquet(tipus, ids, origen_clau)
on conflict (tipus, recurs_id) do nothing;

create table if not exists private.publicacio_publicadors (
  tenant_id uuid not null references public.towns(id) on delete cascade,
  tipus text not null check (tipus in ('article', 'pagina', 'llibre_cataleg', 'recepta', 'arbre', 'planta', 'llavor')),
  recurs_id text not null check (recurs_id ~ '^[A-Za-z0-9_-][A-Za-z0-9_:-]{0,127}$'),
  -- NULL restaura l'origen viu sense perdre la versió ni l'historial.
  publicadors_ids uuid[] check (
    cardinality(publicadors_ids) between 1 and 12
    and array_position(publicadors_ids, null) is null
  ),
  versio integer not null check (versio > 0),
  operacio_id uuid not null,
  es_ugc boolean not null,
  ugc_id uuid references public.section_submissions(id) on delete set null,
  check (es_ugc or ugc_id is null),
  primary key (tenant_id, tipus, recurs_id)
);
create index if not exists publicacio_publicadors_ugc_id
  on private.publicacio_publicadors (ugc_id) where ugc_id is not null;
alter table private.publicacio_publicadors enable row level security;
revoke all on table private.publicacio_publicadors from public, anon, authenticated, service_role;

create table if not exists private.publicacio_traspassos (
  tenant_id uuid not null references public.towns(id) on delete cascade,
  operacio_id uuid not null,
  tipus text not null,
  recurs_id text not null,
  qui uuid references auth.users(id) on delete set null,
  peticio jsonb not null,
  publicadors_abans uuid[],
  publicadors_despres uuid[],
  versio integer not null check (versio > 0),
  creat timestamptz not null default clock_timestamp(),
  primary key (tenant_id, operacio_id),
  unique (tenant_id, tipus, recurs_id, versio)
);
alter table private.publicacio_traspassos enable row level security;
revoke all on table private.publicacio_traspassos from public, anon, authenticated, service_role;

create or replace function private.copub_text_uuid(valor text)
returns uuid language sql immutable set search_path = '' as $$
  select case when valor ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then valor::uuid end;
$$;

create or replace function private.copub_actor_oficial(p_clau text)
returns uuid language sql stable set search_path = '' as $$
  select o.id from public.organizations o
  where o.id = coalesce(
    (select private.copub_text_uuid(a.valor) from private.ajustos a where a.clau = 'copublicacio_actor_' || p_clau),
    case p_clau
      when 'socdepoble' then 'a240e870-4aef-4d92-b138-e8b4e2f2123a'::uuid
      when 'rentonar' then 'b2c87505-53b1-4108-902f-2313e77b9968'::uuid
    end
  );
$$;

-- El Node 0 té email_confirmed_at. GoTrue també pot portar una confirmació
-- per telèfon i baixa lògica. Les columnes opcionals no alteren el seu esquema.
create or replace function private.copub_compte_actiu(p_id uuid)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from auth.users u join public.profiles p on p.id = u.id
    where u.id = p_id and p.baixa_demanada_at is null
      and (u.email_confirmed_at is not null or to_jsonb(u)->>'confirmed_at' is not null)
      and to_jsonb(u)->>'deleted_at' is null and to_jsonb(u)->>'is_anonymous' is distinct from 'true'
      and (u.banned_until is null or u.banned_until <= statement_timestamp())
  );
$$;

-- Només es projecten camps públics del padró. No s'emmagatzema el nom,
-- l'avatar ni el poble a l'historial. Una baixa o un canvi de visibilitat
-- revoca immediatament l'aparició de l'actor en lectures noves.
create or replace function private.copub_actor(p_id uuid, p_mostra_persones boolean)
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(
    (
      select jsonb_build_object('actor_id', o.id, 'slug_ruta', '/perfil/' || o.id::text || '?registre=organitzacio',
        'nom', o.name, 'avatar_url', o.logo_url, 'poble_nom', coalesce(nullif(o.town_name, ''), t.name))
      from public.organizations o join public.towns t on t.id = o.tenant_id
      where o.id = p_id and o.visibility = 'public' and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = o.id and m.tenant_id = o.tenant_id and m.role = 'owner'
          and private.copub_compte_actiu(m.user_id)
      )
    ),
    (
      select jsonb_build_object('actor_id', p.id, 'slug_ruta', '/perfil/' || p.id::text || '?registre=persona',
        'nom', p.full_name, 'avatar_url', p.avatar_url, 'poble_nom', p.town_name)
      from public.profiles p
      where p_mostra_persones and p.id = p_id and p.is_public
        and private.copub_compte_actiu(p.id)
        and exists (select 1 from public.town_memberships m where m.user_id = p.id)
        and not exists (select 1 from public.organizations o where o.id = p.id)
    )
  );
$$;

-- Retorna una fila per recurs elegible, fins i tot quan l'origen no té UUID.
-- Els articles del veïnat conserven la mateixa frontera de lectura que el Mur.
create or replace function private.copub_recurs(p_tenant_id uuid, p_tipus text, p_recurs_id text)
returns table (origen_id uuid, article_id uuid) language plpgsql stable set search_path = '' as $$
declare
  id_article uuid := private.copub_text_uuid(p_recurs_id);
  fila record;
  origen_paquet text;
  element jsonb;
  quantes integer;
begin
  if not exists (select 1 from public.towns t where t.id = p_tenant_id) then return; end if;

  if p_tipus = 'article' and id_article is not null then
    select s.author_org_id, s.owner_user_id into fila
    from public.section_submissions s
    where s.id = id_article and s.tenant_id = p_tenant_id and s.section_id = 'mur';
    if found then
      if coalesce((select private.is_town_member(p_tenant_id)), false) then
        return query select coalesce(fila.author_org_id, fila.owner_user_id), id_article;
      end if;
      return;
    end if;
  end if;

  if p_tipus in ('article', 'pagina') then
    select c.payload into element from public.app_content c
    where c.tenant_id = p_tenant_id and c.key = case p_tipus when 'article' then 'feedPosts' else 'pages' end;
    if jsonb_typeof(element) = 'array' then
      select count(*), (jsonb_agg(e.value)->0) into quantes, element
      from jsonb_array_elements(element) e where e.value->>'id' = p_recurs_id;
      if quantes > 1 then return; end if;
    end if;
  end if;

  select r.origen_clau into origen_paquet from private.recursos_copublicacio_paquet r
  where r.tipus = p_tipus and r.recurs_id = p_recurs_id;
  if found or quantes = 1 then
    return query select coalesce(
      private.copub_text_uuid(element->>'author_org_id'),
      private.copub_text_uuid(element->>'author_id'),
      private.copub_text_uuid(element->>'authorId'),
      private.copub_actor_oficial(origen_paquet),
      private.copub_actor_oficial(case coalesce(element->>'authorId', element->>'author_id')
        when 'rentonar' then 'rentonar'
        when 'socdepoble' then 'socdepoble'
        when 'soc-de-poble_official' then 'socdepoble'
      end)
    ), null::uuid;
  end if;
end;
$$;

create or replace function private.copub_dto(p_tipus text, p_recurs_id text, p_versio integer, p_ids uuid[])
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('recursTipus', p_tipus, 'recursId', p_recurs_id, 'versio', p_versio,
    'publicadorsRegistrats', coalesce(jsonb_agg(actor || jsonb_build_object('rol_publicacio',
      case when posicio = 1 then 'principal' else 'copublicador' end) order by posicio), '[]'::jsonb))
  from (
    select actor, row_number() over (order by u.ord) as posicio
    from unnest(p_ids) with ordinality u(id, ord)
    cross join lateral (select private.copub_actor(u.id, (select auth.uid()) is not null) as actor) a
    where actor is not null
  ) actors;
$$;

create or replace function public.llig_publicadors_registrats(p_tenant_id uuid, p_tipus text, p_recurs_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  origen record;
  actual private.publicacio_publicadors;
  mateix_recurs boolean;
begin
  if p_tenant_id is null or p_tipus is null
    or p_tipus not in ('article', 'pagina', 'llibre_cataleg', 'recepta', 'arbre', 'planta', 'llavor')
    or p_recurs_id is null or p_recurs_id !~ '^[A-Za-z0-9_-][A-Za-z0-9_:-]{0,127}$' then
    raise exception 'SDP-COPUB-001: recurs invàlid.' using errcode = '22023';
  end if;
  if private.copub_text_uuid(p_recurs_id) is not null then p_recurs_id := lower(p_recurs_id); end if;
  select r.* into origen from private.copub_recurs(p_tenant_id, p_tipus, p_recurs_id) r;
  if not found then return private.copub_dto(p_tipus, p_recurs_id, 0, null); end if;
  select * into actual from private.publicacio_publicadors
  where tenant_id = p_tenant_id and tipus = p_tipus and recurs_id = p_recurs_id;
  mateix_recurs := actual.es_ugc is not distinct from (origen.article_id is not null)
    and actual.ugc_id is not distinct from origen.article_id;
  -- Una baixa d'UGC trenca la referència. Si es reutilitza el seu id, la peça
  -- nova no hereta publicadors ni accepta la versió de la peça esborrada.
  return private.copub_dto(p_tipus, p_recurs_id,
    least(2147483647, coalesce(actual.versio::bigint, 0)
      + case when actual.versio is not null and not mateix_recurs then 1 else 0 end)::integer,
    coalesce(case when mateix_recurs then actual.publicadors_ids end, array[origen.origen_id]));
end;
$$;

create or replace function private.copub_canvia(
  p_tenant_id uuid, p_tipus text, p_recurs_id text, p_versio_esperada integer, p_operacio_id uuid,
  p_actor_id uuid, p_copublicadors_ids uuid[], p_mantindre_sdp boolean, p_traspas_id uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  qui uuid := (select auth.uid());
  peticio jsonb;
  historial private.publicacio_traspassos;
  actual private.publicacio_publicadors;
  nous uuid[];
  anteriors uuid[];
  oficial uuid;
  origen record;
  versio_vigent integer;
  versio_nova integer;
begin
  if qui is null or (select auth.jwt()->>'aal') is distinct from 'aal2' then
    raise exception 'SDP-COPUB-007: cal el segon factor.' using errcode = '42501';
  end if;
  if not coalesce((select private.es_superadmin()), false) or not private.copub_compte_actiu(qui) then
    raise exception 'SDP-COPUB-008: cal un superadmin actiu.' using errcode = '42501';
  end if;
  if p_tenant_id is null or p_tipus is null
    or p_tipus not in ('article', 'pagina', 'llibre_cataleg', 'recepta', 'arbre', 'planta', 'llavor')
    or p_recurs_id is null or p_recurs_id !~ '^[A-Za-z0-9_-][A-Za-z0-9_:-]{0,127}$'
    or p_operacio_id is null or p_versio_esperada is null
    or p_versio_esperada < 0 or p_versio_esperada >= 2147483647 then
    raise exception 'SDP-COPUB-001: recurs o versió invàlids.' using errcode = '22023';
  end if;
  if private.copub_text_uuid(p_recurs_id) is not null then p_recurs_id := lower(p_recurs_id); end if;
  if p_traspas_id is not null then
    if p_traspas_id = p_operacio_id or p_versio_esperada = 0 then
      raise exception 'SDP-COPUB-001: reversió invàlida.' using errcode = '22023';
    end if;
  else
    if p_actor_id is null or p_mantindre_sdp is null or p_copublicadors_ids is null
      or cardinality(p_copublicadors_ids) > 11 or coalesce(array_ndims(p_copublicadors_ids), 1) <> 1 then
      raise exception 'SDP-COPUB-001: publicadors invàlids.' using errcode = '22023';
    end if;
    if (select count(distinct id) from unnest(array[p_actor_id] || p_copublicadors_ids) u(id))
      <> 1 + cardinality(p_copublicadors_ids) then
      raise exception 'SDP-COPUB-001: publicadors nuls o repetits.' using errcode = '22023';
    end if;
  end if;
  peticio := jsonb_build_object('versioEsperada', p_versio_esperada, 'actorId', p_actor_id,
    'copublicadorsIds', p_copublicadors_ids, 'mantindreSdp', p_mantindre_sdp, 'traspasId', p_traspas_id);

  -- Ordre global de bloquejos: operació, després recurs. El pany de recurs
  -- també serialitza la primera escriptura quan la fila encara no existix.
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_operacio_id::text, 1901));
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_tipus || ':' || p_recurs_id, 1902));

  select r.* into origen from private.copub_recurs(p_tenant_id, p_tipus, p_recurs_id) r;
  if not found then
    raise exception 'SDP-COPUB-002: recurs inexistent.' using errcode = 'P0002';
  end if;

  select * into historial from private.publicacio_traspassos h
  where h.tenant_id = p_tenant_id and h.operacio_id = p_operacio_id;
  if found then
    if historial.qui is distinct from qui or historial.tipus <> p_tipus or historial.recurs_id <> p_recurs_id
      or historial.peticio is distinct from peticio then
      raise exception 'SDP-COPUB-005: identificador d’operació reutilitzat.' using errcode = '22023';
    end if;
    return public.llig_publicadors_registrats(p_tenant_id, p_tipus, p_recurs_id)
      || jsonb_build_object('operacioId', p_operacio_id, 'repetida', true, 'versioOperacio', historial.versio);
  end if;

  select * into actual from private.publicacio_publicadors
  where tenant_id = p_tenant_id and tipus = p_tipus and recurs_id = p_recurs_id;
  versio_vigent := coalesce(actual.versio, 0);
  if actual.versio is not null and (actual.es_ugc is distinct from (origen.article_id is not null)
    or actual.ugc_id is distinct from origen.article_id) then
    versio_vigent := least(2147483647, versio_vigent::bigint + 1)::integer;
    actual.operacio_id := null;
  else
    anteriors := actual.publicadors_ids;
  end if;
  if versio_vigent <> p_versio_esperada then
    raise exception 'SDP-COPUB-004: versió de publicació obsoleta.' using errcode = '40001';
  end if;

  if p_traspas_id is not null then
    if actual.operacio_id is distinct from p_traspas_id then
      raise exception 'SDP-COPUB-004: l’operació a revertir no és la vigent.' using errcode = '40001';
    end if;
    select h.publicadors_abans into strict nous from private.publicacio_traspassos h
    where h.tenant_id = p_tenant_id and h.operacio_id = p_traspas_id;
  else
    nous := array[p_actor_id] || p_copublicadors_ids;
    if p_mantindre_sdp then
      oficial := private.copub_actor_oficial('socdepoble');
      if oficial is null or private.copub_actor(oficial, false) is null then
        raise exception 'SDP-COPUB-006: compte oficial no configurat.' using errcode = '22023';
      end if;
      if not oficial = any(nous) then nous := array_append(nous, oficial); end if;
    end if;
    if cardinality(nous) > 12 then
      raise exception 'SDP-COPUB-001: massa publicadors.' using errcode = '22023';
    end if;
  end if;

  if exists (select 1 from unnest(nous) u(id) where private.copub_actor(u.id, true) is null) then
    raise exception 'SDP-COPUB-003: actor sense compte públic actiu.' using errcode = '22023';
  end if;

  versio_nova := p_versio_esperada + 1;
  insert into private.publicacio_publicadors (
    tenant_id, tipus, recurs_id, publicadors_ids, versio, operacio_id, es_ugc, ugc_id
  )
  values (p_tenant_id, p_tipus, p_recurs_id, nous, versio_nova, p_operacio_id, origen.article_id is not null, origen.article_id)
  on conflict (tenant_id, tipus, recurs_id) do update set
    publicadors_ids = excluded.publicadors_ids, versio = excluded.versio, operacio_id = excluded.operacio_id,
    es_ugc = excluded.es_ugc, ugc_id = excluded.ugc_id;

  insert into private.publicacio_traspassos (
    tenant_id, operacio_id, tipus, recurs_id, qui, peticio, publicadors_abans, publicadors_despres, versio
  )
  values (p_tenant_id, p_operacio_id, p_tipus, p_recurs_id, qui, peticio, anteriors, nous, versio_nova);
  return private.copub_dto(p_tipus, p_recurs_id, versio_nova, coalesce(nous, array[origen.origen_id]))
    || jsonb_build_object('operacioId', p_operacio_id, 'repetida', false, 'versioOperacio', versio_nova);
end;
$$;

create or replace function public.traspassa_publicacio(
  p_tenant_id uuid, p_tipus text, p_recurs_id text, p_versio_esperada integer, p_operacio_id uuid,
  p_actor_id uuid, p_copublicadors_ids uuid[], p_mantindre_sdp boolean
)
returns jsonb language sql security definer set search_path = '' as $$
  select private.copub_canvia(p_tenant_id, p_tipus, p_recurs_id, p_versio_esperada, p_operacio_id,
    p_actor_id, p_copublicadors_ids, p_mantindre_sdp, null);
$$;

create or replace function public.reverteix_traspas_publicacio(
  p_tenant_id uuid, p_tipus text, p_recurs_id text, p_versio_esperada integer, p_operacio_id uuid, p_traspas_id uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_traspas_id is null then
    raise exception 'SDP-COPUB-001: falta l’operació a revertir.' using errcode = '22023';
  end if;
  return private.copub_canvia(p_tenant_id, p_tipus, p_recurs_id, p_versio_esperada, p_operacio_id,
    null, null, null, p_traspas_id);
end;
$$;

revoke all on function private.copub_text_uuid(text) from public, anon, authenticated, service_role;
revoke all on function private.copub_actor_oficial(text) from public, anon, authenticated, service_role;
revoke all on function private.copub_compte_actiu(uuid) from public, anon, authenticated, service_role;
revoke all on function private.copub_actor(uuid, boolean) from public, anon, authenticated, service_role;
revoke all on function private.copub_recurs(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function private.copub_dto(text, text, integer, uuid[]) from public, anon, authenticated, service_role;
revoke all on function private.copub_canvia(uuid, text, text, integer, uuid, uuid, uuid[], boolean, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.llig_publicadors_registrats(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.traspassa_publicacio(uuid, text, text, integer, uuid, uuid, uuid[], boolean)
  from public, anon, authenticated, service_role;
revoke all on function public.reverteix_traspas_publicacio(uuid, text, text, integer, uuid, uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.llig_publicadors_registrats(uuid, text, text) to anon, authenticated;
grant execute on function public.traspassa_publicacio(uuid, text, text, integer, uuid, uuid, uuid[], boolean) to authenticated;
grant execute on function public.reverteix_traspas_publicacio(uuid, text, text, integer, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
