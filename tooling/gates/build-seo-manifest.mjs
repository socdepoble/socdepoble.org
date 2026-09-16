#!/usr/bin/env node
/**
 * build-seo-manifest.mjs — el productor que faltava.
 *
 * `wordpress-plugin/dist/seo-routes.json` el consumien tres llocs
 * (sdp-seo.php:21, sdp-seo.php:360, tractor-consell.mjs:306) i no el generava
 * ningú. Sense ell, sdp_resolve_request() torna 404 dur en TOTES les rutes
 * React i el sitemap ix buit.
 *
 * Fonts (per ordre d'autoritat):
 *   1. src/config/sections.js        → rutes de llista (llegit per text: importa lucide-react)
 *   2. src/sections/<x>/*Seed.js     → rutes de detall (import dinàmic: són dades pures)
 *   3. sdp_route_pattern() a sdp-seo.php → sinònims que el rewrite accepta i el
 *      manifest ha de resoldre com a àlies, no com a 404.
 *
 * Pedra Seca: zero dependències, ESM, fail-closed.
 *
 *   node tooling/gates/build-seo-manifest.mjs            # dry-run, escriu a stdout
 *   node tooling/gates/build-seo-manifest.mjs --escriu   # escriu el fitxer
 *   node tooling/gates/build-seo-manifest.mjs --verifica # exit 1 si el disc no quadra
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as acorn from 'acorn';

import { arrelSegura, R } from '../lib/arrel.mjs';

const ARREL = arrelSegura();
const DESTI = R('wordpress-plugin/dist/seo-routes.json');
const AVUI = new Date().toISOString().slice(0, 10);

const problemes = [];
const fatal = (msg) => { problemes.push(msg); };

/* ────────────────────── 1 · Rutes de llista (sections.js) ────────────────────── */

const FONT_SECTIONS = R('src/config/sections.js');
if (!fs.existsSync(FONT_SECTIONS)) {
  console.error(`❌ [SEO] Falta ${path.relative(ARREL, FONT_SECTIONS)}. Sense la font canònica de rutes no genere res.`);
  process.exit(1);
}

const srcSections = fs.readFileSync(FONT_SECTIONS, 'utf8');

const ast = acorn.parse(srcSections, { ecmaVersion: 'latest', sourceType: 'module' });

const extractArrayElements = (node) => {
  if (node.type !== 'ArrayExpression') return [];
  return node.elements.filter(el => el && el.type === 'ObjectExpression').map(obj => {
    const section = {};
    for (const prop of obj.properties) {
      if (prop.type === 'Property' && prop.key.type === 'Identifier') {
        if (prop.value.type === 'Literal') {
          section[prop.key.name] = prop.value.value;
        } else if (prop.value.type === 'Identifier') {
          section[prop.key.name] = prop.value.name;
        }
      }
    }
    return section;
  });
};

const seccions = [];

for (const node of ast.body) {
  if (node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'VariableDeclaration') {
    for (const decl of node.declaration.declarations) {
      if (decl.id.type === 'Identifier' && (decl.id.name === 'SECTIONS' || decl.id.name === 'GESTORIA_SECTIONS')) {
        const items = extractArrayElements(decl.init);
        for (const s of items) {
          if (!s.id || !s.path) continue;
          seccions.push({
            id: s.id,
            ruta: s.path.replace(/^\//, ''),
            etiqueta: s.label || s.shortLabel || s.id,
            kind: s.kind || 'text'
          });
        }
      }
    }
  }
}

if (seccions.length < 15) {
  fatal(`El lector de sections.js no ha trobat suficients seccions (trobades: ${seccions.length}). El format ha canviat o el parseig ha fallat. El manifest eixiria trencat.`);
}

/* ────────────────────── 2 · Sinònims declarats al PHP ────────────────────── */

const FONT_PHP = R('wordpress-plugin/inc/sdp-seo.php');
let slugsPhp = [];
if (fs.existsSync(FONT_PHP)) {
  const bloc = /function sdp_route_pattern\(\)[\s\S]*?\$lists = array\(([\s\S]*?)\);/.exec(fs.readFileSync(FONT_PHP, 'utf8'));
  if (bloc) slugsPhp = [...bloc[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/* Sinònim → ruta canònica. El rewrite del PHP els accepta; sense àlies,
   sdp_resolve_request() els torna 404 en compte de redirigir. */
const ALIES_CANONIC = {
  chat: 'xat', chats: 'xat',
  events: 'mur', calendar: 'mur', calendari: 'mur',
  mapa: 'mur',
  connectivitat: 'dispositius',
  'el-projecte': 'projecte',
  ruta: 'roadmap',
  anima: 'ia', iaia: 'ia',
  accedir: 'login', 'crear-compte': 'login', registre: 'login',
  poblacio: 'pobles',
};

/* ────────────────────── 3 · Rutes de detall (seeds) ────────────────────── */

const SEEDS = [
  { fitxer: 'src/sections/pobles/townsSeed.js', exporta: 'MOCK_TOWNS', prefix: 'pobles', tipus: 'Place' },
  { fitxer: 'src/sections/mercat/marketSeed.js', exporta: 'MOCK_MARKET_ITEMS', prefix: 'mercat', tipus: 'Product' },
  { fitxer: 'src/sections/mur/eventsSeed.js', exporta: 'CALENDAR_EVENTS', prefix: 'events', tipus: 'Event' },
  { fitxer: 'src/sections/mur/feedSeed.js', exporta: 'MOCK_FEED', prefix: 'mur', tipus: 'Article' },
];

const avisos = [];

async function carregaDetalls() {
  const eixida = [];
  for (const seed of SEEDS) {
    const abs = R(seed.fitxer);
    if (!fs.existsSync(abs)) continue;
    let mod;
    try {
      mod = await import(pathToFileURL(abs).href);
    } catch (error) {
      fatal(`No s'ha pogut llegir ${seed.fitxer}: ${error.message.split('\n')[0]}`);
      continue;
    }
    const items = mod[seed.exporta];
    if (!Array.isArray(items)) {
      fatal(`${seed.fitxer} no exporta '${seed.exporta}' com a taula.`);
      continue;
    }
    /* Buit és legítim si la secció es nodrix de Supabase, però no és invisible:
       vol dir zero pàgines de detall indexables per a eixa secció. */
    if (items.length === 0) {
      avisos.push(`${seed.fitxer} → '${seed.exporta}' és buit: cap ruta de detall de '${seed.prefix}' serà indexable.`);
    }
    for (const item of items) {
      if (!item || item.id === undefined || item.id === null) continue;
      eixida.push({
        ruta: `${seed.prefix}/${encodeURIComponent(String(item.id))}`,
        titol: String(item.title || item.name || item.id),
        descripcio: retalla(item.description || item.content || item.subtitle || ''),
        imatge: item.image_url || item.avatar_url || null,
        tipus: seed.tipus,
      });
    }
  }
  return eixida;
}

function retalla(text, max = 155) {
  const net = String(text).replace(/\s+/g, ' ').trim();
  if (net.length <= max) return net;
  return `${net.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/* ─────────────────────────────── Construcció ─────────────────────────────── */

/* Les xarxes socials no pinten SVG a og:image. */
const IMATGE_DEFECTE = '/assets/system/ui/og-socdepoble-1200x630.png';

/* Rutes que existeixen però no volem a l'índex: privades o sense contingut propi. */
const NO_INDEXAR = new Set(['login', 'registre', 'perfil', 'control', 'connectar', 'cerca', 'dispositius', 'traduccions',
  'disseny', 'skills', 'ia', 'realitat']);

const manifest = { generat: AVUI, font: 'tooling/gates/build-seo-manifest.mjs', routes: {}, aliases: {} };

for (const s of seccions) {
  manifest.routes[s.ruta] = {
    status: 200,
    index: !NO_INDEXAR.has(s.ruta),
    title: s.etiqueta,
    description: retalla(`${s.etiqueta} · Sóc de Poble, la xarxa dels pobles valencians.`),
    image: IMATGE_DEFECTE,
    type: s.kind === 'text' ? 'WebPage' : 'CollectionPage',
    lastmod: AVUI,
  };
}

/* Rutes que el rewrite accepta i sections.js no declara: si no les registrem
   com a àlies o com a ruta, el PHP les torna 404 i el rewrite les hi envia. */
for (const slug of slugsPhp) {
  if (manifest.routes[slug] || manifest.aliases[slug]) continue;
  const canonic = ALIES_CANONIC[slug];
  if (canonic && manifest.routes[canonic]) {
    manifest.aliases[slug] = canonic;
    continue;
  }
  manifest.routes[slug] = {
    status: 200,
    index: !NO_INDEXAR.has(slug),
    title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
    description: retalla('Sóc de Poble, la xarxa dels pobles valencians.'),
    image: IMATGE_DEFECTE,
    type: 'WebPage',
    lastmod: AVUI,
  };
}

const detalls = await carregaDetalls();
for (const d of detalls) {
  manifest.routes[d.ruta] = {
    status: 200,
    index: true,
    title: d.titol,
    description: d.descripcio || retalla('Sóc de Poble, la xarxa dels pobles valencians.'),
    image: d.imatge || IMATGE_DEFECTE,
    type: d.tipus,
    lastmod: AVUI,
  };
}

/* ─────────────────────────────── Fail-closed ─────────────────────────────── */

const total = Object.keys(manifest.routes).length;
const indexables = Object.values(manifest.routes).filter((r) => r.index).length;

if (total < 10) {
  fatal(`Només ${total} rutes generades. Un manifest tan curt vol dir que una font ha fallat en silenci.`);
}
if (indexables === 0) {
  fatal('Cap ruta indexable. El sitemap eixiria buit i no publicaríem res.');
}

if (problemes.length > 0) {
  console.error('\n❌ [SEO] No escric el manifest. Un manifest incomplet és pitjor que cap:\n');
  for (const p of problemes) console.error(`   · ${p}`);
  console.error('');
  process.exit(1);
}

/* ─────────────────────────────── Eixides ─────────────────────────────── */

const json = `${JSON.stringify(manifest, null, 2)}\n`;

if (process.argv.includes('--verifica')) {
  if (!fs.existsSync(DESTI)) {
    console.error(`❌ [SEO] Falta ${path.relative(ARREL, DESTI)}. sdp_resolve_request() tornarà 404 en TOTES les rutes React.`);
    process.exit(1);
  }
  const disc = fs.readFileSync(DESTI, 'utf8');
  const igual = JSON.parse(disc)?.routes && Object.keys(JSON.parse(disc).routes).length === total;
  if (!igual) {
    console.error(`❌ [SEO] El manifest del disc té ${Object.keys(JSON.parse(disc).routes || {}).length} rutes i les fonts en donen ${total}. Ha derivat.`);
    process.exit(1);
  }
  console.log(`✅ [SEO] Manifest al dia: ${total} rutes (${indexables} indexables).`);
  process.exit(0);
}

function mostraAvisos() {
  if (avisos.length === 0) return;
  console.error('');
  for (const a of avisos) console.error(`⚠️  [SEO] ${a}`);
}

if (process.argv.includes('--escriu')) {
  fs.mkdirSync(path.dirname(DESTI), { recursive: true });
  fs.writeFileSync(DESTI, json, 'utf8');
  console.log(`✅ [SEO] Escrit ${path.relative(ARREL, DESTI)}`);
  console.log(`   ${total} rutes · ${indexables} indexables · ${Object.keys(manifest.aliases).length} àlies`);
  console.log(`   ${seccions.length} de sections.js · ${detalls.length} de detall · ${slugsPhp.length} slugs revisats del PHP`);
  mostraAvisos();
  process.exit(0);
}

console.log(json);
console.error(`\n(dry-run: ${total} rutes, ${indexables} indexables. Afig --escriu per a desar.)`);
