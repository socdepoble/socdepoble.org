#!/usr/bin/env node
/** P1-61 (Fase 2, pla 261028_1526) · El <head> social estàtic de cada ruta
 * pública per a Firebase Hosting, sense JavaScript al navegador (WhatsApp,
 * Telegram i la resta de rastrejadors lligen l'HTML tal com ix del servidor).
 *
 *   node tooling/seo/prerender-social.mjs --root . --dist dist --origin https://socdepoble.org [--snapshot JSON] [--mode production]
 *
 * Després de vite build (npm run build:social, l'últim pas de npm run build;
 * mai a build:natiu ni a build:wp), darrere de projeccio-publica.mjs, que
 * escriu el --snapshot (QA-H04):
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
 *      QA-H04 · O una foto del bucket públic «mitjans» de Storage del Supabase del
 *      mateix build (imageOrigins; a la CLI, VITE_SUPABASE_URL, només amb --snapshot):
 *      no és a dist/, i abans d'escriure res se'n fa un GET fitat (termini,
 *      cap redirecció, 600 KB com a molt) que ha de tornar 200, un MIME PNG,
 *      JPEG o WebP i els mateixos bytes; si no, la CLI bloqueja la release.
 *      L’API conserva la reserva per a diagnòstic, excepte amb strictRemoteImages.
 * Refusa camins que isquen de dist/, segments amb punts o codis %, dues rutes
 * que només es distingixen per les majúscules (en APFS, el mateix fitxer), cap
 * directori del camí que siga un enllaç simbòlic (tampoc el de la ruta), i
 * sobreescriure cap fitxer; no toca mai dist/index.html (en comprova el sha al
 * final) i cada fitxer escrit conserva els mateixos script i link que ell.
 * Abans d'escriure res ho valida tot. Imprimix un rebut JSON i ix amb 1 si falla.
 * Firebase: el firebase.json de l'arrel ha de portar «trailingSlash: false»
 * (/projecte servix dist/projecte/index.html, sense 301) i cap «cleanUrls:
 * true»; si no, porta roja abans de llegir res. La reescriptura de l'SPA, l'última.
 *
 * P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026):
 *   · IMATGES REMOTES, SEMPRE DEL PROPI ORIGEN. Una foto del bucket públic ja no
 *     va al <head> amb la seua URL de Storage (WebP, pes lliure i l'identificador
 *     de qui la puja al camí): es baixa (GET fitat, 5 MiB, dos intents només per
 *     a xarxa, 429 o 5xx), es convertix a un JPEG baseline NOU de 1200x630 i
 *     300.000 B com a molt (jpeg-social.mjs: Pillow aïllat) i s'escriu a
 *     dist/assets/og/<24 hex del sha256 dels bytes finals>.jpg. Dos URL amb els
 *     mateixos bytes, un sol fitxer. Cap HTML de dist/ porta l'origen de Supabase
 *     (es comprova al final).
 *   · POLÍTICA DE FALLADA PER RUTA, no per URL (evidence.origens del manifest).
 *     Infraestructura (xarxa, 429, 5xx, termini, cap convertidor aïllat): atura
 *     la release sempre. Defecte de dada (404, MIME, mides, pes, no hi cap): en
 *     una ruta editorial, porta roja com sempre; en una ruta veïnal (una entitat
 *     del directori), la targeta genèrica i un avís: una dada d'un veí no atura
 *     mai la release. Sense strictRemoteImages (l'API de diagnòstic), tot avisa.
 *   · OPENGRAPH SENSE INDEXAR (/perfil, una publicació veïnal del Mur): meta
 *     robots, og:url i cap canonical. I el JSON-LD propi de cada ruta, marcat.
 *   · UN ÀLIES porta sempre el canonical i l'og:url del destí, també quan el
 *     destí és /wikidepoble (el fitxer de l'àlies només es servix a la seua URL).
 *   · REBUT EN FITXER (rebutFitxer; a la CLI, rebut-social.json al directori de
 *     --snapshot, mai dins de dist/ ni de public/): camins amb sha256, classe i
 *     origen, imatges materialitzades (la referència d'origen, només el seu
 *     hash), exclosos, conflictes, recomptes i el LOT VEÏNAL (camí, títol i
 *     descripció de cada fitxa veïnal) amb el seu hash. Amb SDP_SOCIAL_LOT_VEINAL
 *     definida i distinta d'eixe hash, ix amb 1 abans d'escriure res; sense ella,
 *     avisa «lot veïnal sense confirmar». L'eixida estàndard no imprimix cap URL
 *     remota.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {ATRIBUT_SSR, CAP_SOCIAL_BASE} from '../../src/config/imatgeSocial.js';
import {BASE_IMAGE, buildSocialManifest, CAMI_PUBLIC_DE_STORAGE, llegixSnapshot} from './build-social-manifest.mjs';
import {DefecteDeDada, detectaConvertidor, jpegSocial, LIMITS_DE_L_ORIGINAL, sniffImage} from './jpeg-social.mjs';
import {prepareShell} from './prepare-social-shell.mjs';
import {cosFitat, origensDImatge} from './projeccio-publica.mjs';
import {esSenseIndexar, esServible, renderSocialHead, SOCIAL_SLOT} from './social-edge.mjs';

export {sniffImage};

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const MAX_SHELL = 1024 * 1024;
const AVIS_IMATGE = 600 * 1024;
const MAX_IMATGES_REMOTES = 1000;
const TERMINI_IMATGE = 5000;
const INTENTS_IMATGE = 2;
const EN_PARALLEL = 6;
/* P0-SEO-UNIVERSAL · On viuen les imatges socials materialitzades, dins de dist/assets (una imatge
   retirada dona 404 i no l'HTML de l'SPA: la reescriptura de Firebase no toca /assets). */
export const DIR_OG = 'assets/og';
export const VARIABLE_LOT_VEINAL = 'SDP_SOCIAL_LOT_VEINAL';
export const NOM_DEL_REBUT = 'rebut-social.json';
const NOM_DEL_REBUT_DE_PROJECCIO = 'rebut-projeccio.json';
const TIPUS_D_IMATGE = new Set(['image/png', 'image/jpeg', 'image/webp']);
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]{0,179}$/;
/* Les rutes el fitxer de les quals també es servix a altres URL. */
const SENSE_CANONICAL = new Set(['/wikidepoble']);

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

/** Els camins que el prerender escriu per a un manifest: [{servit, clau, formaDeCami, alies}].
 *  El mateix càlcul per al prerender i per a la Porta de cobertura (cobertura-router.mjs):
 *  cada ruta sense consulta, la forma de camí de cada document de la Wiki i cada àlies. */
export function camisServits(manifest) {
  const camins = [];
  for (const key of Object.keys(manifest.routes)) {
    if (!key.includes('?')) camins.push({servit: key, clau: key, formaDeCami: false, alies: false});
    else {
      const id = new URLSearchParams(key.split('?')[1]).get('item');
      if (!key.startsWith('/wikidepoble?') || !SEGMENT.test(id || '')) throw new Error(`Clau social sense forma de camí: ${key}`);
      camins.push({servit: `/wikidepoble/${id}`, clau: key, formaDeCami: true, alies: false});
    }
  }
  for (const [from, to] of Object.entries(manifest.aliases)) {
    if (from.includes('?')) throw new Error(`Àlies amb consulta: ${from}`);
    camins.push({servit: from, clau: to, formaDeCami: false, alies: true});
  }
  return camins;
}

/* El fitxer del rebut: un .json fora de dist/ (el que es desplega) i de public/ (Vite el copia a dist/). */
function fitxerDelRebut(root, fitxer) {
  if (typeof fitxer !== 'string' || !fitxer.endsWith('.json')) throw new Error('El rebut ha de ser un fitxer .json.');
  let real = path.resolve(fitxer);
  try { real = path.join(fs.realpathSync(path.dirname(real)), path.basename(real)); } catch { /* el directori es crearà */ }
  for (const prohibit of ['dist', 'public']) {
    const rel = path.relative(path.resolve(root, prohibit), real);
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) throw new Error(`El rebut no pot ser dins de ${prohibit}/.`);
  }
  return real;
}

export async function prerenderSocial({root, dist = 'dist', origin, policyRoot = root, publicSnapshot = [], imageOrigins = [],
  fetchImpl = globalThis.fetch, JSDOM: JSDOMArg = null, strictRemoteImages = false, convertidor = null, rebutFitxer = null,
  lotVeinalConfirmat = undefined, rebutDeProjeccio = null, pausa = ms => new Promise(resolve => setTimeout(resolve, ms))}) {
  if (!root || !origin) throw new Error('root i origin són obligatoris.');
  root = fs.realpathSync(root);
  comprovaFirebaseHosting(root);
  const distDir = path.resolve(root, dist);
  const distStat = fs.lstatSync(distDir);
  if (!distStat.isDirectory() || distStat.isSymbolicLink()) throw new Error('dist ha de ser un directori real.');
  const originUrl = new URL(origin);
  if (originUrl.protocol !== 'https:' || originUrl.href !== `${originUrl.origin}/`) throw new Error('origin ha de ser un origen HTTPS net.');
  origin = originUrl.origin;
  const fitxerRebut = rebutFitxer ? fitxerDelRebut(root, rebutFitxer) : null;
  // Un rebut vell no sobreviu mai a una fallada: s'esborra abans de fer res.
  if (fitxerRebut) fs.rmSync(fitxerRebut, {force: true});
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
  const {manifest, evidence} = await buildSocialManifest({root, origin, policyRoot, publicSnapshot, imageOrigins, estricte: true, strictSnapshot: strictRemoteImages});
  const origens = evidence.origens || {};
  const esVeinal = key => origens[key] === 'veinal';
  const warnings = [];
  const images = new Map();
  /* P0-SEO-UNIVERSAL · El lot veïnal: el que el build cou en estàtic de les dades dels veïns (camí,
     títol i descripció), amb el seu hash. Es comprova ABANS d'escriure res. */
  const fitxesVeinals = Object.entries(manifest.routes).filter(([key]) => esVeinal(key))
    .map(([cami, entry]) => ({cami, title: entry.title, description: entry.description})).sort((a, b) => a.cami.localeCompare(b.cami));
  const lotVeinal = {hash: sha(JSON.stringify(fitxesVeinals)), fitxes: fitxesVeinals};
  if (lotVeinalConfirmat !== undefined && lotVeinalConfirmat !== lotVeinal.hash) {
    throw new Error(`El lot veïnal no és el confirmat (${VARIABLE_LOT_VEINAL}): reviseu el rebut i confirmeu el hash ${lotVeinal.hash}.`);
  }
  if (lotVeinalConfirmat === undefined && fitxesVeinals.length) warnings.push(`lot veïnal sense confirmar: ${fitxesVeinals.length} fitxa/es (hash ${lotVeinal.hash})`);
  /* QA-H04 i P0-SEO-UNIVERSAL · Les fotos remotes (el bucket públic de Storage, imageOrigins): cada una
     baixada una vegada, fitada i CONVERTIDA abans d'escriure res. El resultat és la imatge del propi
     origen ({url, type, width, height}); si no es pot servir, null (la targeta genèrica) i un avís, o
     porta roja segons la política de la ruta. */
  const remotes = new Map();
  const esRemota = url => url.protocol === 'https:' && url.origin !== origin && imageOrigins.includes(url.origin)
    && !url.search && !url.hash && !url.username && !url.password && CAMI_PUBLIC_DE_STORAGE.test(url.pathname);
  /* Qui fa servir cada foto: les rutes editorials i les veïnals (la política és de la ruta). */
  const usos = new Map();
  for (const [key, entry] of Object.entries(manifest.routes)) {
    const url = new URL(entry.image.url);
    if (!esRemota(url)) continue;
    if (!usos.has(url.href)) usos.set(url.href, {editorials: [], veinals: []});
    usos.get(url.href)[esVeinal(key) ? 'veinals' : 'editorials'].push(key);
  }
  const rutesDe = href => [...usos.get(href).editorials, ...usos.get(href).veinals];
  /* El convertidor, només si cal i una sola vegada (injectable a les proves). */
  let convertidorLlest = null, propi = null;
  const convertidorDe = () => (convertidorLlest ||= convertidor ? Promise.resolve(convertidor) : detectaConvertidor().then(c => (propi = c)));
  const ogPla = new Map(); // nom del fitxer → bytes finals
  async function baixa(href) {
    let darrer = null;
    for (let intent = 1; intent <= INTENTS_IMATGE; intent += 1) {
      let resposta = null, transitori = true;
      try {
        resposta = await fetchImpl(href, {method: 'GET', redirect: 'error', headers: {Accept: 'image/png,image/jpeg,image/webp'}, signal: AbortSignal.timeout(TERMINI_IMATGE)});
        const tipus = (resposta.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        if (resposta.status !== 200) {
          transitori = resposta.status === 429 || resposta.status >= 500;
          throw transitori ? new Error(`HTTP ${resposta.status}`) : new DefecteDeDada(`HTTP ${resposta.status}`);
        }
        transitori = false;
        if (!TIPUS_D_IMATGE.has(tipus)) throw new DefecteDeDada(`MIME ${tipus || 'absent'}`);
        let bytes;
        try { bytes = await cosFitat(resposta, LIMITS_DE_L_ORIGINAL.bytes); } catch (error) { throw new DefecteDeDada(error.message); }
        resposta = null;
        const sniffed = sniffImage(bytes);
        if (!sniffed || !sniffed.width || !sniffed.height) throw new DefecteDeDada('els bytes no són cap imatge PNG, JPEG ni WebP');
        if (sniffed.type !== tipus) throw new DefecteDeDada(`declarada ${tipus}, els bytes diuen ${sniffed.type}`);
        return bytes;
      } catch (error) {
        await resposta?.body?.cancel?.().catch(() => {});
        darrer = error;
        if (error instanceof DefecteDeDada || !transitori || intent === INTENTS_IMATGE) break;
        await pausa(400 * intent);
      }
    }
    throw darrer;
  }
  async function materialitza(href) {
    try {
      const original = await baixa(href);
      const social = await jpegSocial(original, {convertidor: await convertidorDe()});
      const nom = `${sha(social.bytes).slice(0, 24)}.jpg`;
      if (!ogPla.has(nom)) ogPla.set(nom, social.bytes);
      return {estat: 'servida', nom, url: new URL(`/${DIR_OG}/${nom}`, origin).href, type: social.type, width: social.width, height: social.height, bytes: social.bytes.length};
    } catch (error) {
      return {estat: error instanceof DefecteDeDada ? 'defecte' : 'infraestructura', motiu: String(error?.message || error).split(href).join('[imatge]')};
    }
  }
  /* El sostre: les editorials primer (passar-lo amb elles és error); una veïnal de més, la targeta genèrica. */
  const editorials = [...usos].filter(([, us]) => us.editorials.length).map(([href]) => href).sort();
  const veinals = [...usos].filter(([, us]) => !us.editorials.length).map(([href]) => href).sort();
  if (editorials.length > MAX_IMATGES_REMOTES) throw new Error(`Més de ${MAX_IMATGES_REMOTES} imatges remotes editorials: el build no les pot verificar totes.`);
  const hrefsRemots = [...editorials, ...veinals];
  for (const href of hrefsRemots.slice(MAX_IMATGES_REMOTES)) {
    remotes.set(href, {estat: 'sostre', motiu: `més de ${MAX_IMATGES_REMOTES} imatges remotes`});
  }
  const pendents = hrefsRemots.slice(0, MAX_IMATGES_REMOTES);
  try {
    await Promise.all(Array.from({length: Math.min(EN_PARALLEL, pendents.length)}, async () => {
      for (let href = pendents.shift(); href !== undefined; href = pendents.shift()) remotes.set(href, await materialitza(href));
    }));
  } finally {
    propi?.tanca?.();
  }
  for (const [href, remota] of remotes) {
    if (remota.estat === 'servida') continue;
    const {editorials: deLEditorial} = usos.get(href);
    const rutes = rutesDe(href).join(', ');
    if (strictRemoteImages && remota.estat === 'infraestructura') {
      throw new Error(`La infraestructura d’imatges ha fallat a ${rutes} (${remota.motiu}): la release no pot eixir sense les fotos.`);
    }
    if (strictRemoteImages && deLEditorial.length) {
      throw new Error(`La primera imatge remota de ${deLEditorial.join(', ')} no es pot servir (${remota.motiu}): la release no pot substituir-la pel logotip.`);
    }
    warnings.push(`${rutes}: ${remota.motiu}; la targeta genèrica`);
  }
  const reserva = {url: new URL(BASE_IMAGE, origin).href, alt: CAP_SOCIAL_BASE.image.alt};
  /* La imatge d'una ruta, comprovada sobre dist/ (el que es desplega): mateix
     origen i https, un fitxer de dist/assets amb bytes d'imatge; o una remota
     ja materialitzada (del propi origen), o, si no ho és, la targeta genèrica. */
  function imageOf(key, image) {
    const url = new URL(image.url);
    if (esRemota(url) && remotes.has(url.href)) {
      const remota = remotes.get(url.href);
      return remota.estat === 'servida' ? {url: remota.url, alt: image.alt, type: remota.type, width: remota.width, height: remota.height} : imageOf(key, reserva);
    }
    if (url.protocol !== 'https:' || url.origin !== origin || url.search || url.hash || !url.pathname.startsWith('/assets/')) {
      throw new Error(`Imatge social fora de l’origen a ${key}: ${url.origin === origin ? image.url : '[una URL d’un altre origen]'}`);
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
  /* Revisió adversarial (QA-H04) · Duplicada també si només canvien les
     majúscules (/mur/Aplec i /mur/aplec): el disc del Mac (APFS) no les
     distingix, i el segon fitxer petava amb el dist/ ja a mitges. Ara, abans
     d'escriure res. */
  const plan = new Map();
  const plegades = new Map();
  for (const {servit: served, clau: key, formaDeCami, alies} of camisServits(manifest)) {
    const target = rutaEscrivible(distDir, served);
    const rel = path.relative(distDir, target);
    const plegada = rel.toLowerCase();
    if (plegades.has(plegada)) throw new Error(`Ruta social duplicada: ${served}${plegades.get(plegada) === served ? '' : ` (i ${plegades.get(plegada)}: sense majúscules, el mateix fitxer)`}`);
    plegades.set(plegada, served);
    try { fs.lstatSync(target); throw new Error(`Ja existix i no se sobreescriu: ${rel}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const entry = manifest.routes[key];
    if (!esServible(entry)) throw new Error(`Ruta social sense metadades: ${served}`);
    const metadata = {...entry, image: imageOf(served, entry.image)};
    // La forma de camí d'un document: canonical ?item=<id>, og:url la seua adreça.
    const ogUrl = formaDeCami ? new URL(served, origin).href : null;
    /* Un fitxer que es servix a més d'una URL (la llista de la Wiki) no porta canonical ni og:url; el
       d'un àlies només es servix a la seua adreça i porta sempre els del destí. */
    const senseCanonical = SENSE_CANONICAL.has(key) && !alies;
    const senseIndexar = esSenseIndexar(entry);
    const head = renderSocialHead(metadata, origin, {marca: ATRIBUT_SSR, canonical: !senseCanonical, ogUrl});
    plan.set(target, {served, key, alies, senseIndexar, ogUrl: senseCanonical ? null : ogUrl || entry.canonical,
      canonical: senseCanonical || senseIndexar ? null : entry.canonical, html: shell.template.replace(SOCIAL_SLOT, () => head)});
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
  /* P0-SEO-UNIVERSAL · Les imatges materialitzades: dist/assets/og/<hash>.jpg. El directori i cada
     avantpassat són directoris reals (cap enllaç simbòlic), i un fitxer que ja hi és només val si
     porta els mateixos bytes. Tot comprovat abans d'escriure res. */
  const ogDir = path.join(distDir, ...DIR_OG.split('/'));
  if (ogPla.size) {
    let cursor = distDir;
    for (const part of DIR_OG.split('/')) {
      cursor = path.join(cursor, part);
      try { const stat = fs.lstatSync(cursor); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`No és un directori real: ${path.relative(distDir, cursor)}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    for (const [nom, bytes] of ogPla) {
      if (!/^[a-f0-9]{24}\.jpg$/.test(nom)) throw new Error('Nom d’imatge social invàlid.');
      let previ = null;
      try { previ = fs.readFileSync(path.join(ogDir, nom)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (previ && !previ.equals(bytes)) throw new Error(`Ja existix i no se sobreescriu: ${DIR_OG}/${nom}`);
    }
  }
  /* Escriure: cap fitxer existent no se sobreescriu ('wx'), i el directori de
     cada fitxer, ja creat, és dins de dist/ també amb els enllaços resolts. */
  const distReal = fs.realpathSync(distDir);
  if (ogPla.size) {
    fs.mkdirSync(ogDir, {recursive: true});
    if (fs.realpathSync(ogDir) !== path.join(distReal, ...DIR_OG.split('/'))) throw new Error(`Camí fora de dist/: ${DIR_OG}`);
    for (const [nom, bytes] of ogPla) if (!fs.existsSync(path.join(ogDir, nom))) fs.writeFileSync(path.join(ogDir, nom), bytes, {flag: 'wx'});
  }
  for (const [target, {html: page}] of plan) {
    const dir = path.dirname(target);
    fs.mkdirSync(dir, {recursive: true});
    if (fs.realpathSync(dir) !== path.join(distReal, path.relative(distDir, dir))) throw new Error(`Camí fora de dist/: ${path.relative(distDir, target)}`);
    fs.writeFileSync(target, page, {flag: 'wx'});
  }
  for (const index of fills) fs.writeFileSync(index, shellBytes, {flag: 'wx'});
  // Comprovacions finals sobre el que hi ha al disc.
  if (sha(fs.readFileSync(shellFile)) !== shellSha) throw new Error('dist/index.html ha canviat durant el prerender.');
  for (const [nom, bytes] of ogPla) {
    const escrit = fs.readFileSync(path.join(ogDir, nom));
    const forma = sniffImage(escrit);
    if (!escrit.equals(bytes) || forma?.type !== 'image/jpeg' || forma.width !== 1200 || forma.height !== 630) throw new Error(`Imatge social materialitzada distinta: ${DIR_OG}/${nom}`);
  }
  const relDist = file => path.relative(distDir, file).split(path.sep).join('/');
  const escrits = [];
  for (const [target, {served, key, alies, senseIndexar, ogUrl, canonical}] of plan) {
    const text = fs.readFileSync(target, 'utf8');
    /* P0-SEO-UNIVERSAL · Cap HTML de dist/ porta l'origen de Storage: ni la URL d'una foto ni el seu camí. */
    for (const origenRemot of imageOrigins) if (text.includes(origenRemot)) throw new Error(`${served}: l'HTML porta una URL d'un altre origen`);
    const dom = new JSDOM(text);
    const d = dom.window.document;
    const count = selector => d.querySelectorAll(selector).length;
    const ambUrl = ogUrl === null ? 0 : 1;
    for (const [selector, n] of [['title', 1], ['meta[name="description"]', 1], ['meta[property="og:title"]', 1], ['meta[property="og:image"]', 1],
      ['meta[property="og:site_name"]', 1], ['link[rel="canonical"]', canonical === null ? 0 : 1], ['meta[property="og:url"]', ambUrl],
      ['meta[name="robots"]', senseIndexar ? 1 : 0], [`script[type="application/ld+json"][${ATRIBUT_SSR}]`, ambUrl]]) {
      if (count(selector) !== n) throw new Error(`${served}: ${selector} ×${count(selector)} (n'esperava ${n})`);
    }
    if (d.querySelector('meta[property="og:site_name"]').hasAttribute(ATRIBUT_SSR)) throw new Error(`${served}: og:site_name no és de la ruta`);
    if ((d.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null) !== ogUrl
      || (d.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null) !== canonical) throw new Error(`${served}: og:url o canonical no són els esperats`);
    if (ambUrl) {
      let dades = null;
      try { dades = JSON.parse(d.querySelector(`script[type="application/ld+json"][${ATRIBUT_SSR}]`).textContent); } catch { dades = null; }
      if (!dades || dades['@context'] !== 'https://schema.org' || typeof dades['@type'] !== 'string' || dades.url !== manifest.routes[key].canonical) throw new Error(`${served}: el JSON-LD de la ruta no és vàlid`);
    }
    if (JSON.stringify(recursos(d)) !== JSON.stringify(recursosDelShell)) throw new Error(`${served}: els script i link no són els del shell`);
    dom.window.close();
    escrits.push({cami: served, sha256: sha(text), bytes: Buffer.byteLength(text), classe: alies ? 'alies' : 'canonica', origen: origens[key] || 'editorial',
      ...(alies ? {desti: key} : null), ...(senseIndexar ? {senseIndexar: true} : null)});
  }
  for (const index of fills) {
    if (sha(fs.readFileSync(index)) !== shellSha) throw new Error(`Còpia del shell distinta: ${index}`);
    escrits.push({cami: `/${relDist(path.dirname(index))}`, sha256: shellSha, bytes: shellBytes.length, classe: 'farcit', origen: 'paquet'});
  }
  /* P0-SEO-UNIVERSAL · Coherència d'instàncies: cada fitxa del directori que el manifest ha admés té
     escrita la seua canònica i cada un dels seus àlies (és la regressió exacta d'este P0). */
  const escritsPerCami = new Set(escrits.map(e => e.cami));
  for (const fitxa of evidence.perfils?.canoniques || []) {
    if (!escritsPerCami.has(fitxa.ruta)) throw new Error(`La fitxa ${fitxa.ruta} no té el seu fitxer escrit.`);
    for (const [cami, desti] of Object.entries(manifest.aliases)) if (desti === fitxa.ruta && !escritsPerCami.has(cami)) throw new Error(`L’àlies ${cami} de ${fitxa.ruta} no té el seu fitxer escrit.`);
  }
  const imatges = [...ogPla].map(([nom, bytes]) => ({fitxer: `${DIR_OG}/${nom}`, sha256: sha(bytes), bytes: bytes.length,
    // La referència d'origen, només el seu hash: el rebut no porta mai una URL de Storage.
    refs: [...remotes].filter(([, remota]) => remota.estat === 'servida' && remota.nom === nom).map(([href]) => sha(href)).sort()})).sort((a, b) => a.fitxer.localeCompare(b.fitxer));
  const recomptes = {fitxers: escrits.length + imatges.length, bytes: escrits.reduce((n, e) => n + e.bytes, 0) + imatges.reduce((n, e) => n + e.bytes, 0),
    canoniques: escrits.filter(e => e.classe === 'canonica').length, alies: escrits.filter(e => e.classe === 'alies').length,
    farcits: fills.length, imatges: imatges.length};
  if (fitxerRebut) {
    const rebut = {schema: 'sdp.social-rebut.v1', origin, shellSha, manifestHash: evidence.hashManifest,
      camins: escrits.sort((a, b) => a.cami.localeCompare(b.cami)), imatges,
      perfils: evidence.perfils || null, projeccio: rebutDeProjeccio, recomptes, lotVeinal, avisos: warnings};
    fs.mkdirSync(path.dirname(fitxerRebut), {recursive: true});
    fs.writeFileSync(fitxerRebut, `${JSON.stringify(rebut, null, 2)}\n`);
  }
  return {
    valid: true, origin, shellSha, manifestHash: evidence.hashManifest,
    routesWritten: [...plan.values()].filter(p => !p.alies).map(p => p.served).sort(),
    aliases: Object.entries(manifest.aliases).map(([from, to]) => ({from, to})),
    dirsFilled: fills.map(relDist).sort(),
    // Les imatges materialitzades, amb l'adreça del propi origen (mai la de Storage).
    remoteImages: [...new Set([...remotes.values()].filter(remota => remota.estat === 'servida').map(remota => remota.url))].sort(),
    recomptes, lotVeinal: {hash: lotVeinal.hash, fitxes: fitxesVeinals.length},
    ...(evidence.perfils ? {perfils: {canoniques: evidence.perfils.canoniques.length, alies: evidence.perfils.alies, conflictes: evidence.perfils.conflictes.length}} : null),
    ...(fitxerRebut ? {rebut: path.relative(root, fitxerRebut)} : null),
    warnings
  };
}

async function parseArgs(argv, env = process.env) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i];
    if (!['--root', '--dist', '--origin', '--snapshot', '--mode'].includes(k) || !argv[i + 1] || args[k]) throw new Error('Ús: --root RUTA --dist dist --origin https://socdepoble.org [--snapshot JSON] [--mode production]');
    args[k] = argv[i + 1];
  }
  const publicSnapshot = args['--snapshot'] ? llegixSnapshot(args['--snapshot']) : [];
  // QA-H04 · Les fotos del bucket públic: l'origen de Supabase del mateix build, només si hi ha projecció.
  const imageOrigins = args['--snapshot'] && args['--root'] ? await origensDImatge({root: args['--root'], mode: args['--mode'] || 'production'}) : [];
  /* P0-SEO-UNIVERSAL · El rebut en fitxer, al costat del snapshot (fora de dist/ i de public/), amb el de
     la projecció si hi és; i el lot veïnal confirmat, si la variable està definida. */
  const dirSnapshot = args['--snapshot'] ? path.dirname(path.resolve(args['--snapshot'])) : null;
  let rebutDeProjeccio = null;
  if (dirSnapshot) {
    try { rebutDeProjeccio = JSON.parse(fs.readFileSync(path.join(dirSnapshot, NOM_DEL_REBUT_DE_PROJECCIO), 'utf8')); } catch { rebutDeProjeccio = null; }
  }
  return {root: args['--root'], dist: args['--dist'] || 'dist', origin: args['--origin'], publicSnapshot, imageOrigins, strictRemoteImages: true,
    rebutFitxer: dirSnapshot ? path.join(dirSnapshot, NOM_DEL_REBUT) : null, rebutDeProjeccio,
    lotVeinalConfirmat: typeof env[VARIABLE_LOT_VEINAL] === 'string' && env[VARIABLE_LOT_VEINAL] !== '' ? env[VARIABLE_LOT_VEINAL] : undefined};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Dins de la promesa: un ús o un snapshot dolents també ixen com a rebut JSON.
  Promise.resolve().then(() => parseArgs(process.argv.slice(2))).then(prerenderSocial)
    .then(receipt => { process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`); })
    .catch(error => { console.error(JSON.stringify({valid: false, error: error.message})); process.exitCode = 1; });
}
