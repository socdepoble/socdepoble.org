#!/usr/bin/env node
/** P1-61 (Fase 2, pla 261028_1526) · El <head> social estàtic de cada ruta
 * pública per a Firebase Hosting, sense JavaScript al navegador (WhatsApp,
 * Telegram i la resta de rastrejadors lligen l'HTML tal com ix del servidor).
 *
 *   node tooling/seo/prerender-social.mjs --root . --dist dist --origin https://socdepoble.org [--snapshot JSON]
 *
 * Després de vite build (npm run build:social, l'últim pas de npm run build;
 * mai a build:natiu ni a build:wp):
 *   1. Llig dist/index.html (fitxer regular, com a molt 1 MiB) i en guarda el
 *      sha256; prepareShell en lleva el head de la ruta i hi deixa un forat.
 *   2. Les metadades són les de buildSocialManifest (estricte): les mateixes
 *      regles que el client (metadadesSocials.js i seoWiki.js), més les
 *      publicacions públiques de publicSnapshot (--snapshot JSON; QA-01 de
 *      Codex, 261028), que ixen a dist/<secció>/<id>/index.html.
 *   3. Escriu dist/<ruta>/index.html per a cada ruta sense consulta, per a
 *      cada àlies (el canonical és el del destí) i, per a cada document
 *      públic de la Wiki, la forma de camí dist/wikidepoble/<id>/index.html
 *      (decisió 2 del Mestre), amb canonical ?item=<id> i, d'og:url, la
 *      seua adreça: Facebook, Messenger i LinkedIn seguixen l'og:url i
 *      prenen la targeta d'on acaba, i ?item=<id> servix la llista.
 *      dist/wikidepoble/index.html també es servix per a /wikidepoble?item=…
 *      (Firebase no mira la consulta): porta el head de la llista SENSE
 *      canonical ni og:url, i seoHead el purga en el primer registre.
 *   4. Cada directori que crea i que no és cap ruta (dist/page/, dist/events/)
 *      porta una còpia exacta de dist/index.html: Firebase no reescriu cap a
 *      l'SPA quan el directori existix, i sense índex donaria 404.
 *   5. og:image ha de ser un fitxer de dist/ amb bytes d'imatge: el MIME i les
 *      mides es lligen dels bytes (PNG, JPEG o WebP); una imatge absent, que
 *      no és imatge o 'bloquejada' és porta roja. Més de 600 KB, un avís.
 * Refusa camins que isquen de dist/, segments amb punts o codis %, cap
 * directori del camí que siga un enllaç simbòlic (tampoc el de la ruta), i
 * sobreescriure cap fitxer; no toca mai dist/index.html (en comprova el sha al
 * final) i cada fitxer escrit conserva els mateixos script i link que ell.
 * Abans d'escriure res ho valida tot. Imprimix un rebut JSON i ix amb 1 si falla.
 * Firebase: el firebase.json de l'arrel ha de portar «trailingSlash: false»
 * (/projecte servix dist/projecte/index.html, sense 301) i cap «cleanUrls:
 * true»; si no, porta roja abans de llegir res. La reescriptura de l'SPA, l'última.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {ATRIBUT_SSR} from '../../src/config/imatgeSocial.js';
import {buildSocialManifest, llegixSnapshot} from './build-social-manifest.mjs';
import {prepareShell} from './prepare-social-shell.mjs';
import {renderSocialHead, SOCIAL_SLOT} from './social-edge.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const MAX_SHELL = 1024 * 1024;
const AVIS_IMATGE = 600 * 1024;
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]{0,179}$/;
/* Les rutes el fitxer de les quals també es servix a altres URL. */
const SENSE_CANONICAL = new Set(['/wikidepoble']);

/** El MIME i les mides d'una imatge, llegits dels seus bytes; null si no ho és. */
export function sniffImage(bytes) {
  const b = Buffer.from(bytes);
  if (b.length >= 24 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    && b.subarray(12, 16).toString('latin1') === 'IHDR') {
    return {type: 'image/png', width: b.readUInt32BE(16), height: b.readUInt32BE(20)};
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const marker = b[i + 1];
      if (marker === 0xff) { i += 1; continue; }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const size = b.readUInt16BE(i + 2);
      if (size < 2) return null;
      // SOFn (llevat de DHT, JPG i DAC): l'alçària i l'amplària del quadre.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return {type: 'image/jpeg', width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5)};
      }
      if (marker === 0xda || marker === 0xd9) return null;
      i += 2 + size;
    }
    return null;
  }
  if (b.length >= 30 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') {
    const chunk = b.subarray(12, 16).toString('latin1');
    if (chunk === 'VP8 ') return {type: 'image/webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff};
    if (chunk === 'VP8L' && b[20] === 0x2f) {
      const bits = b.readUInt32LE(21);
      return {type: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1};
    }
    if (chunk === 'VP8X') return {type: 'image/webp', width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1};
  }
  return null;
}

/* Un fitxer regular dins d'arrel, sense cap enllaç simbòlic pel camí; null si no. */
function confined(root, candidate) {
  const rel = path.relative(root, candidate);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  let cursor = root;
  const parts = rel.split(path.sep);
  for (let i = 0; i < parts.length; i += 1) {
    cursor = path.join(cursor, parts[i]);
    let stat;
    try { stat = fs.lstatSync(cursor); } catch { return null; }
    if (stat.isSymbolicLink()) return null;
    if (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile()) return null;
  }
  return cursor;
}

/** Revisió adversarial (261028) · Els fitxers dist/<ruta>/index.html només
 *  són les rutes netes amb «trailingSlash: false»: sense, Firebase redirigix
 *  /projecte a /projecte/ (301) per a cada ruta, i l'SPA no les casa totes;
 *  amb cleanUrls no s'ha provat. Res no lligava el prerender al firebase.json
 *  que desplega (el de l'arrel): ara, cada lloc de hosting, o error. */
export function comprovaFirebaseHosting(root) {
  const fitxer = confined(root, path.join(root, 'firebase.json'));
  if (!fitxer) throw new Error('firebase.json absent o no regular: el prerender necessita «trailingSlash: false».');
  let config;
  try { config = JSON.parse(fs.readFileSync(fitxer, 'utf8')); } catch { throw new Error('firebase.json no és JSON.'); }
  const llocs = [config?.hosting].flat();
  if (llocs.some(lloc => !lloc || typeof lloc !== 'object' || lloc.trailingSlash !== false || lloc.cleanUrls === true)) {
    throw new Error('firebase.json: cada hosting ha de portar «trailingSlash: false» i cap «cleanUrls: true» (sense, /projecte fa 301 a /projecte/).');
  }
}

/* Els script src i link href d'un HTML, per a comparar-los amb els del shell. */
function recursos(document) {
  return {
    scripts: [...document.querySelectorAll('script[src]')].map(n => n.getAttribute('src')).sort(),
    links: [...document.querySelectorAll('link[href]')].filter(n => !/\bcanonical\b/i.test(n.getAttribute('rel') || ''))
      .map(n => `${n.getAttribute('rel')} ${n.getAttribute('href')}`).sort()
  };
}

/** El fitxer d'una ruta servida dins de dist/ (dist/<ruta>/index.html), o error:
 *  cada segment és un nom net (lletres, xifres, '-' i '_'; cap punt ni codi %). */
export function rutaEscrivible(distDir, served) {
  const segments = String(served).split('/').slice(1);
  if (!String(served).startsWith('/') || !segments.length || segments.some(segment => !SEGMENT.test(segment))) throw new Error(`Ruta social no escrivible: ${served}`);
  const target = path.join(distDir, ...segments, 'index.html');
  const rel = path.relative(distDir, target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || rel === 'index.html') throw new Error(`Camí fora de dist/: ${served}`);
  return target;
}

export async function prerenderSocial({root, dist = 'dist', origin, policyRoot = root, publicSnapshot = [], JSDOM: JSDOMArg = null}) {
  if (!root || !origin) throw new Error('root i origin són obligatoris.');
  root = fs.realpathSync(root);
  comprovaFirebaseHosting(root);
  const distDir = path.resolve(root, dist);
  const distStat = fs.lstatSync(distDir);
  if (!distStat.isDirectory() || distStat.isSymbolicLink()) throw new Error('dist ha de ser un directori real.');
  const originUrl = new URL(origin);
  if (originUrl.protocol !== 'https:' || originUrl.href !== `${originUrl.origin}/`) throw new Error('origin ha de ser un origen HTTPS net.');
  origin = originUrl.origin;
  const JSDOM = JSDOMArg || createRequire(path.join(root, 'package.json'))('jsdom').JSDOM;
  const shellFile = confined(distDir, path.join(distDir, 'index.html'));
  if (!shellFile || fs.statSync(shellFile).size > MAX_SHELL) throw new Error('dist/index.html absent, no regular o massa gran.');
  const shellBytes = fs.readFileSync(shellFile);
  const shellSha = sha(shellBytes);
  const html = shellBytes.toString('utf8');
  const shell = prepareShell(html, JSDOM);
  if (shell.template.split(SOCIAL_SLOT).length !== 2) throw new Error('El shell no té un únic forat social.');
  const shellDom = new JSDOM(html);
  const recursosDelShell = recursos(shellDom.window.document);
  shellDom.window.close();
  const {manifest, evidence} = await buildSocialManifest({root, origin, policyRoot, publicSnapshot, estricte: true});
  const warnings = [];
  const images = new Map();
  /* La imatge d'una ruta, comprovada sobre dist/ (el que es desplega): mateix
     origen i https, un fitxer de dist/assets amb bytes d'imatge. */
  function imageOf(key, image) {
    const url = new URL(image.url);
    if (url.protocol !== 'https:' || url.origin !== origin || url.search || url.hash || !url.pathname.startsWith('/assets/')) {
      throw new Error(`Imatge social fora de l’origen a ${key}: ${image.url}`);
    }
    if (!images.has(url.pathname)) {
      let rel;
      try { rel = decodeURIComponent(url.pathname); } catch { rel = null; }
      const file = rel && !rel.split('/').some(part => part === '..' || part === '.') ? confined(distDir, path.join(distDir, rel)) : null;
      if (!file) throw new Error(`Imatge social absent de dist/ a ${key}: ${url.pathname}`);
      const bytes = fs.readFileSync(file);
      const sniffed = sniffImage(bytes);
      if (!sniffed || !sniffed.width || !sniffed.height) throw new Error(`El fitxer d’og:image no és cap imatge PNG, JPEG ni WebP a ${key}: ${url.pathname}`);
      if (bytes.length > AVIS_IMATGE) warnings.push(`${url.pathname}: ${bytes.length} B (més de 600 KB; WhatsApp pot no pintar-la)`);
      if (image.type && image.type !== sniffed.type) warnings.push(`${url.pathname}: declarada ${image.type}, els bytes diuen ${sniffed.type}`);
      images.set(url.pathname, sniffed);
    }
    return {url: url.href, alt: image.alt, ...images.get(url.pathname)};
  }
  /* Totes les pàgines, abans d'escriure'n cap: [camí servit, clau del manifest,
     forma de camí d'un document]. */
  const pages = [];
  for (const key of Object.keys(manifest.routes)) {
    if (!key.includes('?')) pages.push([key, key, false]);
    else {
      const id = new URLSearchParams(key.split('?')[1]).get('item');
      if (!key.startsWith('/wikidepoble?') || !SEGMENT.test(id || '')) throw new Error(`Clau social sense forma de camí: ${key}`);
      pages.push([`/wikidepoble/${id}`, key, true]);
    }
  }
  for (const [from, to] of Object.entries(manifest.aliases)) {
    if (from.includes('?')) throw new Error(`Àlies amb consulta: ${from}`);
    pages.push([from, to, false]);
  }
  const plan = new Map();
  for (const [served, key, formaDeCami] of pages) {
    const target = rutaEscrivible(distDir, served);
    const rel = path.relative(distDir, target);
    if (plan.has(target)) throw new Error(`Ruta social duplicada: ${served}`);
    try { fs.lstatSync(target); throw new Error(`Ja existix i no se sobreescriu: ${rel}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const entry = manifest.routes[key];
    if (!entry || entry.index !== true) throw new Error(`Ruta social sense metadades: ${served}`);
    const metadata = {...entry, image: imageOf(served, entry.image)};
    // La forma de camí d'un document: canonical ?item=<id>, og:url la seua adreça.
    const ogUrl = formaDeCami ? new URL(served, origin).href : null;
    const head = renderSocialHead(metadata, origin, {marca: ATRIBUT_SSR, canonical: !SENSE_CANONICAL.has(key), ogUrl});
    plan.set(target, {served, key, ogUrl: SENSE_CANONICAL.has(key) ? null : ogUrl || entry.canonical,
      canonical: SENSE_CANONICAL.has(key) ? null : entry.canonical, html: shell.template.replace(SOCIAL_SLOT, () => head)});
  }
  /* Cap directori del camí, tampoc el de la mateixa ruta, no pot ser un enllaç
     simbòlic ni un fitxer: l'escriptura el seguiria fora de dist/ (revisió
     adversarial, 261028: abans, el de la ruta no es mirava). Els que es
     crearan i no són cap ruta porten el shell tal qual. */
  const fills = [];
  for (const target of plan.keys()) {
    let dir = path.dirname(target);
    while (dir !== distDir && path.relative(distDir, dir) && !path.relative(distDir, dir).startsWith('..')) {
      const index = path.join(dir, 'index.html');
      let exists = false;
      try { const stat = fs.lstatSync(dir); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`No és un directori real: ${path.relative(distDir, dir)}`); exists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (!exists && !plan.has(index) && !fills.includes(index)) fills.push(index);
      dir = path.dirname(dir);
    }
  }
  /* Escriure: cap fitxer existent no se sobreescriu ('wx'), i el directori de
     cada fitxer, ja creat, és dins de dist/ també amb els enllaços resolts. */
  const distReal = fs.realpathSync(distDir);
  for (const [target, {html: page}] of plan) {
    const dir = path.dirname(target);
    fs.mkdirSync(dir, {recursive: true});
    if (fs.realpathSync(dir) !== path.join(distReal, path.relative(distDir, dir))) throw new Error(`Camí fora de dist/: ${path.relative(distDir, target)}`);
    fs.writeFileSync(target, page, {flag: 'wx'});
  }
  for (const index of fills) fs.writeFileSync(index, shellBytes, {flag: 'wx'});
  // Comprovacions finals sobre el que hi ha al disc.
  if (sha(fs.readFileSync(shellFile)) !== shellSha) throw new Error('dist/index.html ha canviat durant el prerender.');
  for (const [target, {served, key, ogUrl, canonical}] of plan) {
    const dom = new JSDOM(fs.readFileSync(target, 'utf8'));
    const d = dom.window.document;
    const count = selector => d.querySelectorAll(selector).length;
    const expected = SENSE_CANONICAL.has(key) ? 0 : 1;
    for (const [selector, n] of [['title', 1], ['meta[name="description"]', 1], ['meta[property="og:title"]', 1], ['meta[property="og:image"]', 1],
      ['meta[property="og:site_name"]', 1], ['link[rel="canonical"]', expected], ['meta[property="og:url"]', expected], ['meta[name="robots"]', 0]]) {
      if (count(selector) !== n) throw new Error(`${served}: ${selector} ×${count(selector)} (n'esperava ${n})`);
    }
    if (d.querySelector('meta[property="og:site_name"]').hasAttribute(ATRIBUT_SSR)) throw new Error(`${served}: og:site_name no és de la ruta`);
    if ((d.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null) !== ogUrl
      || (d.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null) !== canonical) throw new Error(`${served}: og:url o canonical no són els esperats`);
    if (JSON.stringify(recursos(d)) !== JSON.stringify(recursosDelShell)) throw new Error(`${served}: els script i link no són els del shell`);
    dom.window.close();
  }
  for (const index of fills) if (sha(fs.readFileSync(index)) !== shellSha) throw new Error(`Còpia del shell distinta: ${index}`);
  const relDist = file => path.relative(distDir, file).split(path.sep).join('/');
  return {
    valid: true, origin, shellSha, manifestHash: evidence.hashManifest,
    routesWritten: [...plan.values()].filter(p => !Object.hasOwn(manifest.aliases, p.served)).map(p => p.served).sort(),
    aliases: Object.entries(manifest.aliases).map(([from, to]) => ({from, to})),
    dirsFilled: fills.map(relDist).sort(),
    warnings
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i];
    if (!['--root', '--dist', '--origin', '--snapshot'].includes(k) || !argv[i + 1] || args[k]) throw new Error('Ús: --root RUTA --dist dist --origin https://socdepoble.org [--snapshot JSON]');
    args[k] = argv[i + 1];
  }
  const publicSnapshot = args['--snapshot'] ? llegixSnapshot(args['--snapshot']) : [];
  return {root: args['--root'], dist: args['--dist'] || 'dist', origin: args['--origin'], publicSnapshot};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Dins de la promesa: un ús o un snapshot dolents també ixen com a rebut JSON.
  Promise.resolve().then(() => prerenderSocial(parseArgs(process.argv.slice(2))))
    .then(receipt => { process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`); })
    .catch(error => { console.error(JSON.stringify({valid: false, error: error.message})); process.exitCode = 1; });
}
