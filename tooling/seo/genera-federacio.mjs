#!/usr/bin/env node
/**
 * P1-23 (ordre del Mestre del 30-10-2026, candidatura NLnet NGI Fediversity) ·
 * Els documents federats estàtics de la fase 1 (descoberta i lectura): una
 * sola lògica per al servidor de desenvolupament i el build web
 * (tooling/vite/federacio-iaia.mjs) i per a esta CLI (un servidor NixOS o
 * qualsevol directori de destinació). Els documents els construïx
 * src/data/activitypub.js; ací només es recull QUÈ es publica.
 *
 * Fonts, totes del repositori i públiques (decisió 2 de l'orquestrador: cap
 * contingut inventat, cap dada de persona, cap fil del xat):
 *   · l'actor del projecte, «socdepoble» (Organization): les pàgines del
 *     sistema (SYSTEM_PAGES + PAGE_COPY) que la web ja publica amb head propi,
 *     amb la MATEIXA frontera que el manifest social
 *     (tooling/seo/build-social-manifest.mjs): publicMetadata i publicSeoRoute
 *     de tooling/wiki/lib/publication-policy.mjs, i fora /wikidepoble (és la
 *     llista de la Wiki, no cap pàgina de text). Cada pàgina és un Article amb
 *     el títol, l'entradeta en text pla com a summary (textPla de
 *     src/config/metadadesSocials.js, el de l'og:description; Mastodon mostra
 *     d'un Article el name, el summary i l'enllaç, no el content), sense
 *     content (el cos de la pàgina no es federa), la seua URL i la data que la pàgina ja mostra
 *     (PAGE_COPY.date: algunes són dates triades pel Mestre, no evidència de
 *     publicació; pageContent.js ho documenta una per una);
 *   · un actor per poble de src/sections/pobles/townsSeed.js amb pàgina pública
 *     (/pobles/<id>, la que el prerender ja publica), amb l'outbox BUIT: el
 *     repositori no té cap publicació real d'eixos pobles. Del seed només ix el
 *     nom: és MOCK_TOWNS (el disseny NLnet A §2 ho diu: demostració, no
 *     inquilins; la població no quadra ni amb el seu propi text i el
 *     created_at és inventat), i per això cap resum, població, comarca,
 *     coordenada ni imatge del seed es federa com si fora una dada real.
 *
 * API:
 *   recullActorsPublics({ arrel, origen, carrega }) → [{ slug, nom, resum, perfil, tipus, icona, elements }]
 *   preparaFederacio({ arrel, origen, carrega })   → { ap, origen, actors, fitxers, versio }
 *   origenDeLaPublicacio({ env, carrega })         → VITE_CANONICAL_URL o https://socdepoble.org (https sempre)
 *   entornDelBuild({ arrel, mode })                → les VITE_* que veu «vite build» (loadEnv de Vite)
 *   fitxersDelServidor({ ap, origen, actors, versio }) → els JRD de WebFinger per slug, les regles
 *                                                    d'nginx que els trien i NodeInfo, per a un
 *                                                    servidor amb nginx (mai per a Firebase)
 *   fitxersWebFingerEstatic({ ap, origen, actors }) → host-meta i el JRD dels actors principals,
 *                                                    per al lloc estàtic (Firebase; vegeu més avall)
 *   reglesFirebaseWebFinger({ ap, origen, actors }) → les reescriptures i capçaleres que
 *                                                    firebase.json ha de portar per a eixos fitxers
 *   escriuFederacio({ desti, fitxers, ap, reescriu }) → els camins escrits
 *   `carrega(rel)` importa un mòdul del repositori (per defecte, import() de
 *   <arrel>/<rel>; el servidor de desenvolupament hi passa ssrLoadModule per a
 *   llegir els canvis sense reiniciar).
 *
 * WebFinger en un lloc estàtic (P1-23, ordre del Mestre del 30-10-2026:
 * @socdepoble@socdepoble.org i @latorredelesmacanes@socdepoble.org s'han de
 * poder trobar des de Mastodon quan es desplegue a Firebase Hosting). Firebase
 * no encamina per la consulta: un fitxer a /.well-known/webfinger diria el
 * mateix per a qualsevol ?resource= i Mastodon seguiria el subject cap a un
 * altre compte. Per això /.well-known/webfinger torna 404 (firebase.json
 * l'exclou de la reescriptura de l'SPA) i Mastodon (app/lib/webfinger.rb,
 * body_from_webfinger → body_from_host_meta) llig /.well-known/host-meta i
 * demana la plantilla LRDD, /.well-known/webfinger/{uri}, amb {uri} substituït
 * sense codificar (acct:usuari@domini). firebase.json porta una reescriptura
 * explícita per compte (RE2, sense caixa, «:» i «@» tal qual o com a %3A i
 * %40) cap a .well-known/webfinger/<slug>.json: cap nom de fitxer amb «:» ni
 * «@». Només els actors principals (ACTORS_WEBFINGER_ESTATIC) i els seus àlies
 * (ALIES_WEBFINGER); els pobles de mostra no. Un compte sense reescriptura dona
 * 404, mai el JRD d'un altre.
 *
 * CLI (no l'enganxa cap build; el build web ja emet ap/ i el WebFinger estàtic pel connector):
 *   node tooling/seo/genera-federacio.mjs --desti DIR [--origen https://socdepoble.org] [--arrel .] [--servidor] [--reescriu]
 *   Escriu DIR/ap/**, DIR/.well-known/host-meta i el JRD dels actors principals
 *   (el mateix que el build web) i, amb --servidor, també DIR/.well-known/webfinger/<slug>.json
 *   de tots els actors, DIR/.well-known/webfinger.nginx (les regles que trien el JRD per
 *   $arg_resource; el mòdul NixOS les inclou), DIR/.well-known/nodeinfo i
 *   DIR/nodeinfo/2.1.json (Firebase no pot respondre WebFinger per paràmetre).
 *   Sense --origen, l'origen és el que
 *   veuria «vite build» (VITE_CANONICAL_URL de l'entorn o dels .env de l'arrel,
 *   loadEnv de Vite en mode production): el mateix que ja porta el ap/ del
 *   build. No esborra res: si DIR/ap o DIR/.well-known/webfinger ja tenen
 *   fitxers que no són del conjunt nou, s'atura sense escriure'n cap; i no
 *   reescriu cap fitxer que ja hi és amb un altre contingut (un altre origen,
 *   una altra versió) si no se li passa --reescriu.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { confinedFile, publicMetadata, publicSeoRoute } from '../wiki/lib/publication-policy.mjs';

export const FONTS = Object.freeze({
  activitypub: 'src/data/activitypub.js',
  pagines: 'src/config/systemPages.js',
  copy: 'src/sections/text/pageContent.js',
  pobles: 'src/sections/pobles/townsSeed.js',
  text: 'src/config/metadadesSocials.js',
  origen: 'src/config/origenPublic.js'
});
export const ACTOR_PROJECTE = Object.freeze({ slug: 'socdepoble', nom: 'Sóc de Poble', perfil: '/projecte' });
export const ICONA_PROJECTE = 'icona-app-512.png';
export const AVIS_FASE_1 = 'Federació en fase 1, només de lectura: este perfil i les seues publicacions es poden consultar, '
  + 'però encara no es pot seguir ni respondre des del Fedivers.';
/* Ordre del Mestre del 30-10-2026: @latorredelesmacanes, sense guions, també
   troba La Torre (activitypub.js, aliesWebFinger). */
export const ALIES_WEBFINGER = Object.freeze({ 'la-torre-de-les-macanes': Object.freeze(['latorredelesmacanes']) });
/* Els actors principals que el lloc estàtic (Firebase) respon per WebFinger
   amb host-meta i la plantilla LRDD (vegeu la capçalera). */
export const ACTORS_WEBFINGER_ESTATIC = Object.freeze([ACTOR_PROJECTE.slug, 'la-torre-de-les-macanes']);
export const NS_XRD = 'http://docs.oasis-open.org/ns/xri/xrd-1.0';
export const TIPUS_WEBFINGER_ESTATIC = Object.freeze({
  xrd: 'application/xrd+xml; charset=utf-8',
  jrd: 'application/jrd+json; charset=utf-8'
});
/* Els directoris que la CLI escriu i on vigila restes d'una generació anterior. */
const VIGILATS = Object.freeze(['ap', '.well-known/webfinger']);

const ARREL_PER_DEFECTE = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const carregaDe = (arrel) => (rel) => import(pathToFileURL(path.join(arrel, rel)).href);

/** La versió del package.json de l'arrel (NodeInfo). */
function versioDelPaquet(arrel) {
  const fitxer = confinedFile(arrel, path.join(arrel, 'package.json'));
  if (!fitxer) throw new Error('package.json absent o fora de l’arrel.');
  return JSON.parse(fs.readFileSync(fitxer, 'utf8')).version;
}

/**
 * Els actors públics del repositori (vegeu la capçalera), en ordre estable:
 * primer el projecte, després els pobles en l'ordre de townsSeed.js.
 */
export async function recullActorsPublics({ arrel = ARREL_PER_DEFECTE, origen, carrega = carregaDe(arrel) } = {}) {
  const [ap, { SYSTEM_PAGES }, { PAGE_COPY }, { MOCK_TOWNS }, { textPla }] = await Promise.all([
    carrega(FONTS.activitypub), carrega(FONTS.pagines), carrega(FONTS.copy), carrega(FONTS.pobles), carrega(FONTS.text)
  ]);
  const base = ap.normalitzaOrigen(origen);
  if (!Array.isArray(SYSTEM_PAGES) || !PAGE_COPY || typeof PAGE_COPY !== 'object' || !Array.isArray(MOCK_TOWNS)) {
    throw new Error('Fonts federades invàlides: SYSTEM_PAGES, PAGE_COPY o MOCK_TOWNS.');
  }
  const pla = (valor) => textPla(typeof valor === 'string' ? valor : '', Number.POSITIVE_INFINITY);
  const pagines = [];
  for (const pagina of SYSTEM_PAGES) {
    const copy = Object.hasOwn(PAGE_COPY, pagina?.key) ? PAGE_COPY[pagina.key] : null;
    if (!copy || pagina.key === 'wikidepoble' || !publicMetadata(copy) || !publicSeoRoute(pagina.href, pagina)) continue;
    const id = `pagina-${pagina.key}`;
    if (!ap.esSlugFederat(id)) throw new Error(`Clau de pàgina no federable: ${pagina.key}`);
    pagines.push({
      id,
      tipus: 'Article',
      nom: pla(copy.title),
      resum: pla(copy.lead || copy.subtitle),
      url: `${base}${pagina.href}`,
      publicat: copy.date ?? null,
      llengua: 'ca'
    });
  }
  const icona = confinedFile(arrel, path.join(arrel, 'public', ICONA_PROJECTE)) ? `${base}/${ICONA_PROJECTE}` : null;
  const projecte = {
    ...ACTOR_PROJECTE,
    tipus: 'Organization',
    resum: [pla(PAGE_COPY.projecte?.lead), AVIS_FASE_1],
    icona,
    elements: pagines
  };
  const pobles = MOCK_TOWNS.filter((poble) => poble && typeof poble === 'object' && publicMetadata(poble)).map((poble) => {
    if (!ap.esSlugFederat(poble.id) || ap.normalitzaSlugMunicipi(poble.id) !== poble.id) {
      throw new Error(`Identificador de poble no federable a townsSeed.js: ${String(poble.id).slice(0, 80)}`);
    }
    const nom = pla(poble.title);
    if (!nom) throw new Error(`El poble ${poble.id} no té nom.`);
    return {
      slug: poble.id,
      tipus: 'Organization',
      nom: `${nom} · Sóc de Poble`,
      resum: [`Pàgina pública de ${nom} a Sóc de Poble. No és el compte oficial de l’Ajuntament.`, AVIS_FASE_1],
      perfil: `/pobles/${poble.id}`,
      elements: [],
      ...(Object.hasOwn(ALIES_WEBFINGER, poble.id) ? { alies: [...ALIES_WEBFINGER[poble.id]] } : {})
    };
  });
  const actors = [projecte, ...pobles];
  // Un àlies que és el slug d'un altre actor (o que dos reclamen) atura: mai el JRD d'un compte per a un altre.
  ap.aliesWebFinger(actors);
  return actors;
}

/** Els actors i els seus fitxers ap/** per a un origen. */
export async function preparaFederacio({ arrel = ARREL_PER_DEFECTE, origen, carrega = carregaDe(arrel) } = {}) {
  const ap = await carrega(FONTS.activitypub);
  const base = ap.normalitzaOrigen(origen);
  const actors = await recullActorsPublics({ arrel, origen: base, carrega });
  return { ap, origen: base, actors, fitxers: ap.construeixFitxersFederats({ origen: base, actors }), versio: versioDelPaquet(arrel) };
}

/**
 * L'origen públic dels ids del build: VITE_CANONICAL_URL si el build en porta
 * (el mateix que src/config/origenPublic.js), si no ORIGEN_PUBLIC_PER_DEFECTE
 * (https://socdepoble.org). Un VITE_CANONICAL_URL que no és un origen https
 * net atura el build: uns ids federats falsos no es publiquen. Tampoc el
 * loopback (http://localhost…), que normalitzaOrigen sí que admet perquè és
 * l'origen del servidor de desenvolupament: un build és per a publicar-lo.
 */
export async function origenDeLaPublicacio({ env = {}, arrel = ARREL_PER_DEFECTE, carrega = carregaDe(arrel) } = {}) {
  const [ap, { ORIGEN_PUBLIC_PER_DEFECTE }] = await Promise.all([carrega(FONTS.activitypub), carrega(FONTS.origen)]);
  const canonic = typeof env.VITE_CANONICAL_URL === 'string' ? env.VITE_CANONICAL_URL.trim() : '';
  const origen = ap.normalitzaOrigen(canonic ? canonic.replace(/\/$/, '') : ORIGEN_PUBLIC_PER_DEFECTE);
  if (new URL(origen).protocol !== 'https:') throw new TypeError(`L'origen públic del build ha de ser https (VITE_CANONICAL_URL): ${origen}`);
  return origen;
}

/**
 * Les variables VITE_* que veu «vite build» (mode production per defecte):
 * les de l'entorn i les dels .env, .env.local, .env.<mode> i .env.<mode>.local
 * de l'arrel, amb loadEnv de Vite, el mateix que el connector del build rep a
 * configuracio.env. Així la CLI sense --origen no publica un origen diferent
 * del que el build ja ha posat a ap/**.
 */
export async function entornDelBuild({ arrel = ARREL_PER_DEFECTE, mode = 'production' } = {}) {
  const { loadEnv } = await import('vite');
  return loadEnv(mode, arrel, 'VITE_');
}

const escapaRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Un URL com a patró d'nginx sobre el valor CRU de $arg_resource: «:» i «/»
   tal qual o codificats (%3A, %2F, l'hex en qualsevol caixa: el que en fa
   encodeURIComponent), i la resta literal i AMB caixa (construeixWebFinger el
   compara amb ===). Cap «"», «$», «{» ni «;»: l'origen és normalitzaOrigen i el
   camí, slug i perfil validats per activitypub.js. */
const patroDUrl = (url) => Array.from(url, (caracter) => {
  if (caracter === ':') return '(?::|%3[Aa])';
  if (caracter === '/') return '(?:/|%2[Ff])';
  return escapaRegex(caracter);
}).join('');

/**
 * Les regles d'nginx que trien el JRD estàtic de cada actor pel valor CRU de
 * $arg_resource: acct:<slug>@<host> en qualsevol caixa (com el servidor de
 * desenvolupament, i com Mastodon, que compara el subject sense caixa i
 * pregunta per @Sella@… tal com ho escriu la persona) i amb «:» i «@» tal qual
 * o codificats (%3A, %40). Cap captura: el rewrite va a un camí fix i gixy no
 * hi pot vore cap HTTP splitting. El mòdul NixOS (flake.nix) les inclou a la
 * location de /.well-known/webfinger després de respondre 400 als recursos
 * malformats; el que no casa amb cap regla és 404.
 * Gauntlet 261030 (G8 de Gemini) · També l'URL de l'actor i la del perfil, com
 * construeixWebFinger de src/data/activitypub.js (el connector de
 * desenvolupament): exactes i amb caixa, amb l'esquema de l'origen (mai http
 * si l'origen és https), i amb «:» i «/» tal qual o codificats. Abans nginx en
 * donava 404 i el connector, 200. Dos actors amb la mateixa URL no tenen regla
 * possible (quin JRD és el bo no es pot triar) i aturen la generació. Un %XX
 * d'una altra lletra de l'URL només el resol el connector (nginx no descodifica
 * $arg_resource).
 * Àlies (ALIES_WEBFINGER, ordre del Mestre del 30-10-2026) · Una regla acct
 * més per àlies, cap al JRD del seu actor (subject canònic), com
 * construeixWebFinger i com les reescriptures de firebase.json.
 */
export function reglesNginxWebFinger({ ap, origen, actors }) {
  const base = ap.normalitzaOrigen(origen);
  const host = escapaRegex(new URL(base).host);
  const alies = ap.aliesWebFinger(actors);
  const linies = [
    "# Generat per tooling/seo/genera-federacio.mjs --servidor (P1-23): no l'edites.",
    '# WebFinger (RFC 7033): el JRD estatic de cada actor per $arg_resource: acct sense caixa; URL de l\'actor o del perfil, exacta.'
  ];
  const urlsVistes = new Set();
  for (const actor of [...actors].sort((a, b) => (a?.slug < b?.slug ? -1 : a?.slug > b?.slug ? 1 : 0))) {
    const slug = actor?.slug;
    if (!ap.esSlugFederat(slug)) throw new Error(`Slug no federable a les regles d'nginx: ${String(slug).slice(0, 80)}`);
    const urls = ap.urlsDeMunicipi(slug, { origen: base, perfil: actor.perfil });
    for (const url of [urls.actor, urls.perfil]) {
      if (urlsVistes.has(url)) throw new Error(`Dos actors amb la mateixa URL a WebFinger: ${url.slice(0, 120)}`);
      urlsVistes.add(url);
    }
    linies.push(
      `if ($arg_resource ~* "^acct(?::|%3a)${slug}(?:@|%40)${host}$") {`, `    rewrite ^ /.well-known/webfinger/${slug}.json? last;`, '}',
      `if ($arg_resource ~ "^(?:${patroDUrl(urls.actor)}|${patroDUrl(urls.perfil)})$") {`, `    rewrite ^ /.well-known/webfinger/${slug}.json? last;`, '}'
    );
    for (const [nom, desti] of alies) {
      if (desti !== slug) continue;
      linies.push(`if ($arg_resource ~* "^acct(?::|%3a)${nom}(?:@|%40)${host}$") {`, `    rewrite ^ /.well-known/webfinger/${slug}.json? last;`, '}');
    }
  }
  return `${linies.join('\n')}\n`;
}

/** El host-meta (RFC 6415, XRD) amb la plantilla LRDD de WebFinger per camí. */
export function construeixHostMeta({ ap, origen }) {
  const plantilla = `${ap.normalitzaOrigen(origen)}/.well-known/webfinger/{uri}`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + `<XRD xmlns="${NS_XRD}">\n`
    + `  <Link rel="lrdd" type="application/jrd+json" template="${ap.escapaHtml(plantilla)}"/>\n`
    + '</XRD>\n';
}

/* Els comptes que el lloc estàtic respon: cada actor principal i els seus àlies, en ordre estable. */
function comptesEstatics({ ap, actors }) {
  const alies = ap.aliesWebFinger(actors);
  return ACTORS_WEBFINGER_ESTATIC.flatMap((slug) => {
    if (!actors.some((actor) => actor?.slug === slug)) throw new Error(`L'actor principal ${slug} no és entre els actors publicats: WebFinger estàtic sense JRD.`);
    return [[slug, slug], ...[...alies].filter(([, desti]) => desti === slug)];
  });
}

/**
 * Per al lloc estàtic (Firebase Hosting, el build web): .well-known/host-meta
 * (text XRD) i el JRD de cada actor principal a
 * .well-known/webfinger/<slug>.json, el mateix JRD que construeixWebFinger dona
 * en dev i que el servidor NixOS servix. Un actor principal absent atura el
 * build (firebase.json hi reescriuria cap a un fitxer que no hi és).
 */
export function fitxersWebFingerEstatic({ ap, origen, actors }) {
  const base = ap.normalitzaOrigen(origen);
  const fitxers = new Map([['.well-known/host-meta', construeixHostMeta({ ap, origen: base })]]);
  // Un JRD per actor principal: els seus àlies hi reescriuen (reglesFirebaseWebFinger).
  for (const slug of new Set(comptesEstatics({ ap, actors }).map(([, desti]) => desti))) {
    const actor = actors.find((a) => a.slug === slug);
    const jrd = ap.construeixWebFinger(ap.urlsDeMunicipi(slug, { origen: base, perfil: actor.perfil }).acct, { origen: base, municipis: actors });
    if (!jrd) throw new Error(`Sense JRD per a ${slug}.`);
    fitxers.set(`.well-known/webfinger/${slug}.json`, jrd);
  }
  return new Map([...fitxers].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * Les regles de firebase.json per a fitxersWebFingerEstatic, derivades dels
 * mateixos actors (la prova exigix que firebase.json les porte tal qual):
 *   · rewrites: una per compte (actor principal o àlies), RE2 sobre el camí
 *     de la plantilla LRDD: sense caixa (com construeixWebFinger i nginx), amb
 *     «:» i «@» tal qual (Mastodon substituïx {uri} sense codificar) o com a
 *     %3A i %40 (un client que el codifica), cap al JRD del seu actor;
 *   · headers: application/xrd+xml i CORS * al host-meta; CORS * a TOT
 *     /.well-known/webfinger, en una regla sense Content-Type (RFC 7033 §5: el
 *     servidor MUST el posa a les respostes de WebFinger, i un 404 també n'és
 *     una: el de la consulta per paràmetre i el d'un compte que no hi és; així
 *     un client del navegador veu el 404 i no un error CORS opac, com amb el
 *     servidor de desenvolupament, federacio-iaia.mjs); i application/jrd+json
 *     NOMÉS als camins que tornen un JRD (un 404 no s'etiqueta). El CORS de
 *     WebFinger el posa una sola regla: cap clau repetida per a un mateix camí.
 *     Va després de la regla dels actius immutables (flake.nix pren la primera
 *     regla amb «regex» com la seua).
 */
export function reglesFirebaseWebFinger({ ap, origen, actors }) {
  const host = escapaRegex(new URL(ap.normalitzaOrigen(origen)).host);
  const comptes = comptesEstatics({ ap, actors });
  const acct = (usuari) => `(?i:acct(?::|%3a)${usuari}(?:@|%40)${host})`;
  const cors = { key: 'Access-Control-Allow-Origin', value: '*' };
  return {
    rewrites: comptes.map(([usuari, slug]) => ({
      regex: `^/\\.well-known/webfinger/${acct(usuari)}$`,
      destination: `/.well-known/webfinger/${slug}.json`
    })),
    headers: [
      { source: '/.well-known/host-meta', headers: [{ key: 'Content-Type', value: TIPUS_WEBFINGER_ESTATIC.xrd }, cors] },
      { regex: '^/\\.well-known/webfinger(?:/.*)?$', headers: [cors] },
      {
        regex: `^/\\.well-known/webfinger/(?:(?:${ACTORS_WEBFINGER_ESTATIC.join('|')})\\.json|${acct(`(?:${comptes.map(([usuari]) => usuari).join('|')})`)})$`,
        headers: [{ key: 'Content-Type', value: TIPUS_WEBFINGER_ESTATIC.jrd }]
      }
    ]
  };
}

/**
 * Per a un servidor amb nginx (el mòdul NixOS): el JRD de cada actor a
 * .well-known/webfinger/<slug>.json, les regles que l'escullen per
 * $arg_resource (.well-known/webfinger.nginx, un text, no JSON) i NodeInfo.
 * Mai per a Firebase: no executa regles per paràmetre, i un JRD fix a
 * /.well-known/webfinger diria el mateix per a tothom (el lloc estàtic té
 * fitxersWebFingerEstatic).
 */
export function fitxersDelServidor({ ap, origen, actors, versio }) {
  const base = ap.normalitzaOrigen(origen);
  const fitxers = new Map();
  for (const actor of actors) {
    const jrd = ap.construeixWebFinger(ap.urlsDeMunicipi(actor.slug, { origen: base, perfil: actor.perfil }).acct, { origen: base, municipis: actors });
    if (!jrd) throw new Error(`Sense JRD per a ${actor.slug}.`);
    fitxers.set(`.well-known/webfinger/${actor.slug}.json`, jrd);
  }
  fitxers.set('.well-known/webfinger.nginx', reglesNginxWebFinger({ ap, origen: base, actors }));
  fitxers.set('.well-known/nodeinfo', ap.construeixEnllacosNodeInfo({ origen: base }));
  fitxers.set('nodeinfo/2.1.json', ap.construeixNodeInfo({ origen: base, versio }));
  return new Map([...fitxers].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

const CAMI_RELATIU = /^(?:\.well-known\/|ap\/|nodeinfo\/)[A-Za-z0-9/._-]+$/;

function fitxersExistents(directori, prefix = '') {
  if (!fs.existsSync(directori)) return [];
  const estat = fs.lstatSync(directori);
  if (estat.isSymbolicLink() || !estat.isDirectory()) throw new Error(`No és un directori real: ${directori}`);
  const trobats = [];
  for (const entrada of fs.readdirSync(directori, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entrada.name}` : entrada.name;
    if (entrada.isDirectory()) trobats.push(...fitxersExistents(path.join(directori, entrada.name), rel));
    else trobats.push(rel);
  }
  return trobats;
}

/* Un document és JSON (serialitzaJson) o, com les regles d'nginx i el host-meta, ja un text. */
export const bytesDe = (ap, document) => (typeof document === 'string' ? document : ap.serialitzaJson(document));

const lstatONull = (cami) => {
  try { return fs.lstatSync(cami); } catch (fallada) { if (fallada?.code === 'ENOENT') return null; throw fallada; }
};

/* El fitxer que ja hi ha a <arrel>/<camí>, o null, sense seguir cap enllaç: un
   directori del mig que és un enllaç o un fitxer, o un final que és un enllaç
   o no és un fitxer, atura l'escriptura abans de començar. */
function fitxerExistent(arrel, cami) {
  let cursor = arrel;
  const trossos = cami.split('/');
  for (const tros of trossos.slice(0, -1)) {
    cursor = path.join(cursor, tros);
    const estat = lstatONull(cursor);
    if (!estat) return null;
    if (estat.isSymbolicLink() || !estat.isDirectory()) throw new Error(`Camí amb enllaç o fitxer al mig: ${cursor}`);
  }
  const fitxer = path.join(cursor, trossos.at(-1));
  const estat = lstatONull(fitxer);
  if (!estat) return null;
  if (estat.isSymbolicLink() || !estat.isFile()) throw new Error(`No es reescriu cap enllaç simbòlic ni res que no siga un fitxer: ${fitxer}`);
  return fitxer;
}

/**
 * Escriu cada document a <desti>/<camí>. Cap enllaç simbòlic al camí, cap
 * camí fora dels tres prefixos, cap esborrat; s'atura abans d'escriure'n cap
 * si ja hi ha fitxers federats que no són del conjunt nou (una generació
 * anterior amb un altre poble) o, sense `reescriu`, si un fitxer del conjunt
 * ja hi és amb uns altres bytes (un altre origen, una altra versió: el ap/ que
 * el build ja ha emés no es canvia en silenci). Torna els camins escrits,
 * ordenats.
 */
export function escriuFederacio({ desti, fitxers, ap, reescriu = false }) {
  const arrel = path.resolve(desti);
  const estat = fs.lstatSync(arrel);
  if (estat.isSymbolicLink() || !estat.isDirectory()) throw new Error(`El destí ha de ser un directori real: ${arrel}`);
  const camins = [...fitxers.keys()];
  for (const cami of camins) {
    if (!CAMI_RELATIU.test(cami) || cami.split('/').some((tros) => tros === '..' || tros === '.' || tros === '')) {
      throw new Error(`Camí federat invàlid: ${cami}`);
    }
  }
  const nous = new Set(camins);
  const restes = VIGILATS.flatMap((vigilat) => fitxersExistents(path.join(arrel, vigilat)).map((rel) => `${vigilat}/${rel}`))
    .filter((rel) => !nous.has(rel)).sort();
  if (restes.length) throw new Error(`Hi ha fitxers federats d'una generació anterior (no s'esborra res): ${restes.join(', ')}`);
  const canviats = camins.filter((cami) => {
    const fitxer = fitxerExistent(arrel, cami);
    return Boolean(fitxer) && !reescriu && fs.readFileSync(fitxer, 'utf8') !== bytesDe(ap, fitxers.get(cami));
  }).sort();
  if (canviats.length) {
    throw new Error(`Hi ha fitxers federats amb un altre contingut (un altre origen o una altra versió); sense --reescriu no se'n reescriu cap: ${canviats.join(', ')}`);
  }
  for (const cami of camins.sort()) {
    let cursor = arrel;
    const trossos = cami.split('/');
    for (const tros of trossos.slice(0, -1)) {
      cursor = path.join(cursor, tros);
      if (fs.existsSync(cursor)) {
        const e = fs.lstatSync(cursor);
        if (e.isSymbolicLink() || !e.isDirectory()) throw new Error(`Camí amb enllaç o fitxer al mig: ${cursor}`);
      } else {
        fs.mkdirSync(cursor);
      }
    }
    const fitxer = path.join(cursor, trossos.at(-1));
    const descriptor = fs.openSync(fitxer, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW, 0o644);
    try { fs.writeFileSync(descriptor, bytesDe(ap, fitxers.get(cami))); } finally { fs.closeSync(descriptor); }
  }
  return camins;
}

function arguments_(argv) {
  const opcions = { servidor: false, reescriu: false };
  for (let i = 0; i < argv.length; i += 1) {
    const clau = argv[i];
    if (clau === '--servidor') { opcions.servidor = true; continue; }
    if (clau === '--reescriu') { opcions.reescriu = true; continue; }
    // Una opció repetida (--desti a --desti b) és un error, no «l'última guanya».
    if (!['--desti', '--origen', '--arrel'].includes(clau) || !argv[i + 1] || opcions[clau.slice(2)]) {
      throw new Error('Ús: node tooling/seo/genera-federacio.mjs --desti DIR [--origen https://socdepoble.org] [--arrel .] [--servidor] [--reescriu]');
    }
    opcions[clau.slice(2)] = argv[i + 1];
    i += 1;
  }
  if (!opcions.desti) throw new Error('Cal --desti DIR.');
  return opcions;
}

async function main(argv) {
  const opcions = arguments_(argv);
  const arrel = path.resolve(opcions.arrel ?? ARREL_PER_DEFECTE);
  const carrega = carregaDe(arrel);
  const origen = opcions.origen ?? await origenDeLaPublicacio({ env: await entornDelBuild({ arrel }), arrel, carrega });
  const preparat = await preparaFederacio({ arrel, origen, carrega });
  // El mateix que el build web (ap/** i el WebFinger estàtic) i, amb --servidor, el del servidor (els JRD dels principals, iguals).
  const fitxers = new Map([
    ...preparat.fitxers, ...fitxersWebFingerEstatic(preparat), ...(opcions.servidor ? fitxersDelServidor(preparat) : [])
  ]);
  const escrits = escriuFederacio({ desti: opcions.desti, fitxers, ap: preparat.ap, reescriu: opcions.reescriu });
  process.stdout.write(`${JSON.stringify({ origen: preparat.origen, actors: preparat.actors.map((a) => a.slug), fitxers: escrits.length }, null, 2)}\n`);
}

/* El camí real: cridada per un enllaç simbòlic, la CLI també s'executa (abans
   eixia amb 0 sense escriure res, i una recepta ho hauria donat per bo). */
const esLaCli = () => {
  try { return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
};

if (esLaCli()) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
