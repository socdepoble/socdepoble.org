#!/usr/bin/env node
/**
 * tractor-cobertura-social.mjs — TOTA RUTA PÚBLICA DEL ROUTER TÉ OPENGRAPH O UN MOTIU
 *
 * PREMISSA (P0-SEO-UNIVERSAL, ordre del Mestre del 13-11-2026): compartir
 * /empresa/olidelatorre a WhatsApp donava la targeta genèrica perquè cap porta
 * comparava el Router amb el manifest social. Els rastrejadors no executen
 * JavaScript: una ruta sense dist/<ruta>/index.html rep el head genèric.
 *
 * QUÈ FA (només llig, sense xarxa):
 *   1. Trau la taula de rutes del Router per AST (tooling/seo/rutes-del-router.mjs):
 *      App.jsx, RutaApps.jsx i els manifests d'apps; mai una llista escrita a mà.
 *   2. Construïx el manifest social de l'arbre, sense xarxa i estricte
 *      (tooling/seo/build-social-manifest.mjs), i els camins que el prerender
 *      escriuria (prerender-social.mjs · camisServits).
 *   3. El torna a construir amb un snapshot SINTÈTIC d'una entitat i d'un grup:
 *      cada família de la fitxa pública ha de tindre el camí del slug i el de l'id.
 *   4. Aplica les lleis S1–S9 (tooling/seo/cobertura-router.mjs) amb les
 *      exempcions de tooling/seo/exempcions-socials.mjs.
 * Ix amb 1 si qualsevol ruta pública no té OpenGraph específic ni exempció amb motiu.
 *
 * ÚS:  node tooling/gates/tractor-cobertura-social.mjs [--arrel=.] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {esMain} from '../lib/arrel.mjs';
import {buildSocialManifest} from '../seo/build-social-manifest.mjs';
import {coberturaDelRouter} from '../seo/cobertura-router.mjs';
import {EXEMPCIONS_SOCIALS} from '../seo/exempcions-socials.mjs';
import {camisServits} from '../seo/prerender-social.mjs';
import {extrauRutes} from '../seo/rutes-del-router.mjs';

const ORIGEN = 'https://socdepoble.org';
const POLITICA = 'tooling/wiki/lib/publication-policy.mjs';
const PLUGINS = 'src/sections/plugins/registrePlugins.js';
const CONSOLA = 'src/sections/consola/seoConsola.js';
const PAGINES = 'src/sections/text/pageContent.js';
/* El snapshot sintètic de S7: una entitat i un grup amb slug i id, sense cap dada real. */
export const FITXES_SINTETIQUES = Object.freeze([
  Object.freeze({sectionId: 'perfil', id: 'aaaaaaaa-0000-4000-8000-000000000001', slug: 'entitat-sintetica-de-la-porta', tipus: 'entitat', visibility: 'public', status: 'published',
    title: 'Entitat sintètica de la Porta', description: 'Una fitxa de prova de la cobertura social.', image: null, imageAlt: ''}),
  Object.freeze({sectionId: 'perfil', id: 'aaaaaaaa-0000-4000-8000-000000000002', slug: 'grup-sintetic-de-la-porta', tipus: 'grup', visibility: 'public', status: 'published',
    title: 'Grup sintètic de la Porta', description: 'Un grup de prova de la cobertura social.', image: null, imageAlt: ''})
]);

/* Els literals de `const NOM = new Set([...])` d'un fitxer, per AST. */
function literalsDelSet(root, rel, nom, parse) {
  const programa = parse(fs.readFileSync(path.join(root, rel), 'utf8'), {sourceType: 'module'}).program;
  for (const node of programa.body) {
    const decl = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
    if (decl?.type !== 'VariableDeclaration') continue;
    for (const d of decl.declarations) {
      const llista = d.id.name === nom && d.init?.type === 'NewExpression' ? d.init.arguments[0] : null;
      if (llista?.type === 'ArrayExpression' && llista.elements.every(e => e?.type === 'StringLiteral')) return llista.elements.map(e => e.value);
    }
  }
  throw new Error(`${rel}: no s'ha trobat la llista ${nom}.`);
}

/* Els ids dels plugins del registre, per AST (el fitxer importa el router i no es carrega des de Node). */
function idsDePlugins(root, parse) {
  const fitxer = path.join(root, PLUGINS);
  if (!fs.existsSync(fitxer)) return [];
  const ids = [];
  const visita = node => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'plugin' && node.arguments[0]?.type === 'ObjectExpression') {
      const id = node.arguments[0].properties.find(p => p.type === 'ObjectProperty' && !p.computed && (p.key.name || p.key.value) === 'id');
      if (id?.value.type === 'StringLiteral') ids.push(id.value.value);
    }
    for (const clau of Object.keys(node)) {
      const valor = node[clau];
      if (Array.isArray(valor)) valor.forEach(visita);
      else if (valor && typeof valor.type === 'string') visita(valor);
    }
  };
  visita(parse(fs.readFileSync(fitxer, 'utf8'), {sourceType: 'module'}).program);
  return ids;
}

/** La Porta sobre un arbre: { resultat, router, manifest } (resultat és el de coberturaDelRouter). */
export async function cobertura({root, exempcions = EXEMPCIONS_SOCIALS} = {}) {
  root = fs.realpathSync(root);
  const {parse} = createRequire(path.join(root, 'package.json'))('@babel/parser');
  const importa = rel => import(pathToFileURL(path.join(root, rel)).href);
  const [navegacio, {publicSeoRoute}, {CAP_SOCIAL_BASE}] = await Promise.all(['src/config/navigation.js', POLITICA, 'src/config/imatgeSocial.js'].map(importa));
  const router = await extrauRutes({root, moduls: {navegacio}});
  /* Amb un Router que no es pot llegir, el manifest tampoc es construïx: la Porta ho diu amb les infraccions de l'extractor. */
  if (router.infraccions.length) {
    return {router, manifest: null, resultat: {cobertes: [], exemptes: [], pendents: [], diferenciaDePrivades: [],
      infraccions: router.infraccions.map(i => ({llei: i.llei || 'S4', detall: i.detall}))}};
  }
  const {manifest} = await buildSocialManifest({root, origin: ORIGEN, estricte: true});
  const sintetic = await buildSocialManifest({root, origin: ORIGEN, estricte: true, publicSnapshot: FITXES_SINTETIQUES.map(f => ({...f}))});
  const client = new Set(router.privades);
  const servidor = literalsDelSet(root, POLITICA, 'PRIVATE_ROUTES', parse);
  const indexable = cami => publicSeoRoute(cami) && !client.has(String(cami).replace(/^\/+/, '').split(/[/?#]/)[0]);
  /* Els universos d'instàncies que viuen al repositori (S8). */
  const instancies = [];
  const redireccionsDePagina = {};
  const {PAGE_COPY} = await importa(PAGINES);
  const clausDePagina = new Set([...Object.keys(PAGE_COPY), ...Object.keys(navegacio.PAGE_ROUTE_MAP || {})]);
  for (const clau of [...clausDePagina].sort()) {
    instancies.push({cami: `/page/${clau}`, familia: '/page/:slug'});
    const desti = navegacio.resolvePageSlugPath(clau);
    if (desti) redireccionsDePagina[`/page/${clau}`] = desti;
  }
  for (const id of idsDePlugins(root, parse)) instancies.push({cami: `/plugin/${id}`, familia: '/plugin/:id'});
  if (fs.existsSync(path.join(root, CONSOLA))) {
    const {rutesPubliquesDeLaConsola} = await importa(CONSOLA);
    for (const {ruta} of rutesPubliquesDeLaConsola({origen: ORIGEN, permesos: []})) instancies.push({cami: ruta, familia: '/consola/*'});
  }
  const resultat = coberturaDelRouter({router, manifest, camins: camisServits(manifest), exempcions, indexable,
    privades: {client: [...client], servidor}, universos: {instancies, redireccionsDePagina},
    sintetic: {camins: camisServits(sintetic.manifest), fitxes: FITXES_SINTETIQUES.map(({slug, id}) => ({slug, id}))}, generic: {title: CAP_SOCIAL_BASE.title, description: CAP_SOCIAL_BASE.description}});
  return {router, manifest, resultat, instancies: instancies.length};
}

function informe({router, manifest, resultat, instancies = 0}) {
  const linies = [];
  linies.push('PORTA · Cobertura social del Router');
  linies.push(`  Router: ${router.rutes.length} rutes en ${router.fitxers.length} fitxer(s) (${router.fitxers.join(', ')}); ${router.apps.length} apps; ${router.seccionsDeDetall.length} seccions de detall; famílies de la fitxa pública: ${router.families.join(', ') || 'cap'}.`);
  if (manifest) linies.push(`  Manifest social: ${Object.keys(manifest.routes).length} rutes i ${Object.keys(manifest.aliases).length} àlies; ${instancies} instàncies del repositori comprovades.`);
  linies.push(`  Cobertes: ${resultat.cobertes.length} · Exemptes: ${resultat.exemptes.length} · Pendents: ${resultat.pendents.length} · Infraccions: ${resultat.infraccions.length}`);
  linies.push('');
  linies.push('  COBERTES (ruta · camins servits · mostra)');
  for (const c of resultat.cobertes) linies.push(`    ${c.ruta.padEnd(28)} ${String(c.camins).padStart(4)}  ${c.mostra}`);
  linies.push('');
  linies.push('  EXEMPTES (ruta · classe · motiu)');
  for (const e of resultat.exemptes) linies.push(`    ${e.ruta.padEnd(28)} ${e.classe.padEnd(11)} ${e.desti ? `→ ${e.desti} · ` : ''}${e.motiu}`);
  linies.push('');
  linies.push('  PENDENTS (deute declarat: ruta · revisió · motiu)');
  for (const e of resultat.pendents) linies.push(`    ${e.ruta.padEnd(28)} ${String(e.revisio).padEnd(9)} ${e.motiu}`);
  linies.push('');
  linies.push(`  Sense indexar al client i no al servidor (useSEO.PRIVATE − PRIVATE_ROUTES): ${resultat.diferenciaDePrivades.join(', ') || 'cap'}`);
  if (resultat.infraccions.length) {
    linies.push('');
    linies.push('  INFRACCIONS');
    for (const i of resultat.infraccions) linies.push(`    ✖ ${i.llei} · ${i.detall}`);
  }
  linies.push('');
  linies.push(resultat.infraccions.length ? `PORTA ROJA · ${resultat.infraccions.length} infracció/ns: tota ruta pública ha de tindre OpenGraph específic o una exempció amb motiu.`
    : 'PORTA VERDA · Tota ruta pública del Router té OpenGraph específic o una exempció declarada amb motiu.');
  return linies.join('\n');
}

async function main(argv) {
  const arrel = (argv.find(a => a.startsWith('--arrel=')) || '').slice('--arrel='.length) || '.';
  const dades = await cobertura({root: path.resolve(arrel)});
  if (argv.includes('--json')) process.stdout.write(`${JSON.stringify(dades.resultat, null, 2)}\n`);
  else process.stdout.write(`${informe(dades)}\n`);
  return dades.resultat.infraccions.length ? 1 : 0;
}

if (esMain(import.meta.url)) {
  main(process.argv.slice(2)).then(codi => { process.exitCode = codi; }).catch(error => { console.error(`PORTA ROJA · ${error.message}`); process.exitCode = 1; });
}
