#!/usr/bin/env node
/** QA-H04 (verificació QA local, 261029; pla 261028_1526, P1-61 Fase 2) · La
 * projecció pública sanejada de les publicacions remotes, el --snapshot del
 * prerender social. El primer pas de npm run build:social:
 *
 *   node tooling/seo/projeccio-publica.mjs --root . --origin https://socdepoble.org --out node_modules/.cache/sdp-social/snapshot.json
 *   node tooling/seo/prerender-social.mjs … --snapshot node_modules/.cache/sdp-social/snapshot.json
 *
 * D'on ixen: el que veu un visitant anònim de /mur, /mercat i /calendari és
 * app_content (claus feedPosts, marketItems i events del poble; RLS «app_content
 * lectura publica», 2610101900). Les publicacions dels veïns
 * (section_submissions) només les llig qui és del poble (is_town_member exigix
 * sessió, 2609080000): per a l'anònim no n'hi ha cap i no s'hi pregunta.
 * Com les llig: les VITE_* del build (loadEnv de Vite, mode production, com
 * vite build, i les del procés manen), només la clau anon o publishable
 * (validatePublicCredentials, la mateixa guarda del client: mai service_role) i
 * el poble de VITE_TENANT_ID. Una petició per clau, amb columnes explícites
 * (key,payload) i limit=1 (la clau primària és poble i clau: cap paginació
 * més), termini, un reintent per a errors transitoris, cap redirecció i un
 * sostre de bytes per resposta. Mai imprimix l'URL ni la clau.
 * Les regles del client anònim: llistaDe i mergeById (content.js ·
 * loadSections), i el títol, la descripció i la primera imatge del detall
 * (metadadesDeDetall; el Mur, ací, el de detailSectionMeta.jsx), amb l'origen
 * públic i la URL de Supabase: una foto del bucket públic «mitjans» ix absoluta;
 * una de bloquejada (privada, signada, d’un altre origen), cap en l’API;
 * la CLI refusa la release perquè no pot posar-hi el logotip.
 * Només ix el que és públic i publicat: visibility absent o 'public' i un
 * status absent o publicat (publicMetadata, la regla de les llavors, més
 * l'estat; un status null no ho és), un id net (el de les llavors) i cap
 * possible secret, ni al títol ni a la descripció (plainText del manifest).
 * Dos ids de la mateixa secció que només canvien en majúscules serien el
 * mateix fitxer en un disc del Mac (APFS): n'ix el primer, i la resta es
 * compta (duplicades) i s'avisa; una dada no bloqueja la release. Cada
 * element és EXACTAMENT
 *   {sectionId,id,visibility:'public',status:'published',title,description,image,imageAlt}
 * amb text pla fitat (160/300/160; la imatge, una URL o null), ordenat per
 * secció i id. Com a molt 8 MiB (el sostre de llegixSnapshot), escrit de
 * manera atòmica fora de dist/ i de public/.
 * Política de fallada: el dist/ de qualsevol npm run build es pot desplegar,
 * i un OpenGraph remot incomplet no pot eixir en silenci. Una lectura que
 * falla (xarxa, termini, HTTP, JSON, mida, configuració) esborra el snapshot
 * anterior i ix amb 1: la cadena s'atura abans del prerender. L'única eixida
 * és explícita: SDP_SOCIAL_SENSE_REMOT=1 no pregunta res, escriu [] i ho avisa
 * ben alt (només el valor exacte «1»: «0» o «true» no hi valen). Un paquet en
 * mode seed o local no pinta cap publicació remota: [].
 * Retirada: cada build comença amb un dist/ net (vite build el buida) i el
 * prerender no sobreescriu res. Una publicació retirada o feta privada deixa
 * de tindre fitxer en el build següent; la pàgina vella continua servida
 * fins al pròxim build i desplegament. Desplegar un dist/ antic (la recepta
 * REST a mà, un arbre brut o caducat) la torna a publicar: res no lliga el
 * dist/ desplegat a l'edat del snapshot.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {publicMetadata} from '../wiki/lib/publication-policy.mjs';
import {CAP_SOCIAL_BASE, ORIGEN_SOCIAL_PER_DEFECTE, primeraImatgeSocial} from '../../src/config/imatgeSocial.js';
import {LIMIT_DESCRIPCIO, LIMIT_TITOL, metadadesDeDetall, textPla} from '../../src/config/metadadesSocials.js';
import {validatePublicCredentials} from '../../src/config/publicCredentials.js';
import {SECCIONS_PAGINABLES} from '../../src/data/contracte.js';
import {mergeById} from '../../src/data/mapejadorSeccions.js';
import {ID_DETALL, MAX_SNAPSHOT, plainText} from './build-social-manifest.mjs';

export const ESCAPADA = 'SDP_SOCIAL_SENSE_REMOT';
/* [clau d'app_content, secció]: feedPosts → mur, events → events, marketItems → mercat. */
export const CLAUS_PUBLIQUES = Object.freeze(Object.entries(SECCIONS_PAGINABLES).map(([seccio, clau]) => Object.freeze([clau, seccio])));
const MAX_RESPOSTA = 16 * 1024 * 1024;
const MAX_ELEMENTS = 10000;
const TERMINI = 5000;
const INTENTS = 2;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ESTATS_PUBLICATS = new Set(['published', 'publicat', 'publicada']);
const MODES = new Set(['remote', 'seed', 'local']);
const sha = text => createHash('sha256').update(text).digest('hex');
const espera = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Les VITE_* del build: les de loadEnv de Vite (els .env del mode i les del procés, que manen). */
export async function variablesDelBuild(root, mode = 'production') {
  const {loadEnv} = await import('vite');
  return loadEnv(mode, root, 'VITE_');
}

/** El backend del paquet, validat com al client (capaDelPaquet i runtime.js),
 *  o error. En mode seed o local no cal cap credencial: cap publicació remota. */
export function entornDelBuild(env) {
  const net = clau => (typeof env?.[clau] === 'string' ? env[clau].trim() : '');
  const dataMode = MODES.has(net('VITE_DATA_MODE')) ? net('VITE_DATA_MODE') : 'remote';
  if (dataMode !== 'remote') return {dataMode};
  const supabaseUrl = net('VITE_SUPABASE_URL'), anonKey = net('VITE_SUPABASE_ANON_KEY'), tenantId = net('VITE_TENANT_ID');
  if (!supabaseUrl || !anonKey) throw new Error('Falten VITE_SUPABASE_URL i/o VITE_SUPABASE_ANON_KEY per a la projecció pública.');
  // La guarda del client: un origen net i una clau anon o publishable (mai service_role ni sb_secret_).
  validatePublicCredentials(supabaseUrl, anonKey);
  if (!UUID.test(tenantId)) throw new Error('VITE_TENANT_ID absent o no és cap UUID: no se sap de quin poble és el contingut.');
  return {dataMode, supabaseUrl: new URL(supabaseUrl).origin, anonKey, tenantId};
}

/** Els orígens d'imatge que admet el prerender: el de Supabase del mateix
 *  build (VITE_SUPABASE_URL), si és un origen https net; si no, cap. */
export async function origensDImatge({root, mode = 'production', env = null} = {}) {
  const valors = env ?? await variablesDelBuild(root, mode);
  try {
    const url = new URL(String(valors.VITE_SUPABASE_URL ?? '').trim());
    if (url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) return [url.origin];
  } catch { /* cap origen */ }
  return [];
}

/** El cos d'una resposta, com a molt `maxim` bytes; si en porta més, error i lectura tallada. */
export async function cosFitat(resposta, maxim) {
  const declarat = Number(resposta.headers.get('content-length'));
  if (Number.isFinite(declarat) && declarat > maxim) throw new Error(`Resposta massa gran (${declarat} B; el sostre és ${maxim} B).`);
  const lector = resposta.body?.getReader?.();
  if (!lector) {
    const bytes = Buffer.from(await resposta.arrayBuffer());
    if (bytes.length > maxim) throw new Error(`Resposta massa gran (més de ${maxim} B).`);
    return bytes;
  }
  const trossos = [];
  let total = 0;
  for (;;) {
    const {done, value} = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxim) {
      await lector.cancel().catch(() => {});
      throw new Error(`Resposta massa gran (més de ${maxim} B).`);
    }
    trossos.push(Buffer.from(value));
  }
  return Buffer.concat(trossos);
}

/* Publicat per a l'anònim: la regla de les llavors (publicMetadata: visibility
   absent o 'public'; ni arxivat ni quarantena) i, a més, un status absent o
   publicat. Un esborrany, una pendent, una retirada o una privada no hi entren. */
export function esPublicada(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || !publicMetadata(item)) return false;
  return item.status === undefined || ESTATS_PUBLICATS.has(item.status);
}

/* El detall del Mur (detail/detailSectionMeta.jsx · getTitle i getSubtitle del
   Mur; la descripció del <head> d'ItemDetailSection és pagina.lead, l'entradilla
   d'elementDeSeccio.js, o getSubtitle). metadadesSocials.js només porta les
   seccions amb llavor: la mateixa forma que metadadesDeDetall. */
function metadadesDelMur(item, opcions) {
  return {
    title: textPla(item.title || 'Publicació', LIMIT_TITOL),
    description: textPla(item.entradilla || item.post_subtitle || item.description, LIMIT_DESCRIPCIO) || CAP_SOCIAL_BASE.description,
    imatge: primeraImatgeSocial('mur', item, opcions)
  };
}

/* L'id del detall (/<secció>/<id>), el de les llavors: un text net o un enter. */
function idDe(item) {
  const id = typeof item.id === 'number' && Number.isSafeInteger(item.id) && item.id >= 0 ? String(item.id) : item.id;
  return typeof id === 'string' && ID_DETALL.test(id) ? id : null;
}

/** Un element públic, projectat; o {motiu} si no n'ix cap. Mai copia el payload: només els huit camps. */
export function projectaElement(seccio, item, opcions) {
  if (!esPublicada(item)) return {motiu: 'privades'};
  const id = idDe(item);
  if (!id) return {motiu: 'id'};
  const meta = seccio === 'mur' ? metadadesDelMur(item, opcions) : metadadesDeDetall(seccio, item, opcions);
  try {
    const title = plainText(meta?.title, LIMIT_TITOL);
    const description = plainText(meta?.description, LIMIT_DESCRIPCIO);
    if (!title || !description) return {motiu: 'buides'};
    const image = meta.imatge?.estat === 'triada' ? meta.imatge.url : null;
    return {
      element: {sectionId: seccio, id, visibility: 'public', status: 'published', title, description, image, imageAlt: image ? title : ''},
      imatge: meta.imatge?.estat || 'absent'
    };
  } catch {
    // plainText refusa un possible secret o una entrada desmesurada: no es publica.
    return {motiu: 'secrets'};
  }
}

/* Una clau d'app_content del poble, amb el termini, el sostre i un reintent
   per a la xarxa, un 429 o un 5xx. */
async function llegixClau({supabaseUrl, anonKey, tenantId}, clau, {fetchImpl, termini, maxResposta, pausa}) {
  const url = new URL('/rest/v1/app_content', supabaseUrl);
  url.search = new URLSearchParams({select: 'key,payload', tenant_id: `eq.${tenantId}`, key: `eq.${clau}`, limit: '1'}).toString();
  let darrer = null;
  for (let intent = 1; intent <= INTENTS; intent += 1) {
    let transitori = true;
    try {
      const resposta = await fetchImpl(url.href, {
        method: 'GET', redirect: 'error', signal: AbortSignal.timeout(termini),
        headers: {apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json'}
      });
      if (resposta.status !== 200) {
        transitori = resposta.status === 429 || resposta.status >= 500;
        await resposta.body?.cancel?.().catch(() => {});
        throw new Error(`HTTP ${resposta.status} en llegir ${clau}.`);
      }
      transitori = false;
      if (!/\bjson\b/i.test(resposta.headers.get('content-type') || '')) throw new Error(`Resposta de ${clau} sense JSON.`);
      const files = JSON.parse((await cosFitat(resposta, maxResposta)).toString('utf8'));
      if (!Array.isArray(files) || files.length > 1 || (files[0] && files[0].key !== clau)) throw new Error(`Resposta de ${clau} amb un format inesperat.`);
      return files[0] ?? null;
    } catch (error) {
      darrer = error;
      if (!transitori || intent === INTENTS) break;
      await pausa(400 * intent);
    }
  }
  throw darrer;
}

/** La projecció: {snapshot, text, rebut}; `text` és el fitxer exacte (el sostre és el seu).
 *  `entorn` és el d'entornDelBuild. */
export async function projeccioPublica({entorn, origin = ORIGEN_SOCIAL_PER_DEFECTE, fetchImpl = globalThis.fetch,
  termini = TERMINI, maxResposta = MAX_RESPOSTA, maxSnapshot = MAX_SNAPSHOT, pausa = espera} = {}) {
  const originUrl = new URL(origin);
  if (originUrl.protocol !== 'https:' || originUrl.href !== `${originUrl.origin}/`) throw new Error('origin ha de ser un origen HTTPS net.');
  const rebut = {mode: entorn?.dataMode || 'remote', seccions: {}, publicades: 0};
  if (rebut.mode !== 'remote') return {snapshot: [], text: '[]\n', rebut: {...rebut, avis: `paquet en mode ${rebut.mode}: cap publicació remota`}};
  if (typeof fetchImpl !== 'function') throw new Error('Cap fetch disponible per a la projecció pública.');
  const opcions = {origen: originUrl.origin, supabaseUrl: entorn.supabaseUrl, permesos: []};
  const snapshot = [];
  for (const [clau, seccio] of CLAUS_PUBLIQUES) {
    const fila = await llegixClau(entorn, clau, {fetchImpl, termini, maxResposta, pausa});
    // llistaDe (autocuracio.js): el que no és una llista es pren buida, com el client.
    const llista = Array.isArray(fila?.payload) ? fila.payload : [];
    if (llista.length > MAX_ELEMENTS) throw new Error(`${clau}: ${llista.length} elements (el sostre és ${MAX_ELEMENTS}).`);
    const compte = {llegides: llista.length, publicades: 0, privades: 0, id: 0, buides: 0, secrets: 0, duplicades: 0, imatges: {triada: 0, bloquejada: 0, absent: 0}};
    if (fila && !Array.isArray(fila.payload)) compte.avis = 'el payload no és una llista: buida';
    const plegats = new Set();
    for (const item of mergeById(llista, [])) {
      const {element, imatge, motiu} = projectaElement(seccio, item, opcions);
      if (!element) { compte[motiu] += 1; continue; }
      // Sense majúscules, el mateix fitxer del dist/ (APFS): n'ix el primer.
      if (plegats.has(element.id.toLowerCase())) { compte.duplicades += 1; continue; }
      plegats.add(element.id.toLowerCase());
      compte.publicades += 1;
      compte.imatges[imatge] += 1;
      snapshot.push(element);
    }
    rebut.seccions[seccio] = compte;
  }
  snapshot.sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.id.localeCompare(b.id));
  const text = `${JSON.stringify(snapshot)}\n`;
  const bytes = Buffer.byteLength(text);
  if (bytes > maxSnapshot) throw new Error(`Snapshot públic massa gran (${bytes} B; el sostre és ${maxSnapshot} B).`);
  rebut.publicades = snapshot.length;
  if (!Object.values(rebut.seccions).some(compte => compte.llegides)) rebut.avis = 'cap fila pública per a este poble: comproveu VITE_TENANT_ID';
  return {snapshot, text, rebut: {...rebut, bytes, sha256: sha(text)}};
}

/* Un camí amb els enllaços resolts fins on existix (el fitxer i les carpetes noves, encara no). */
function camiReal(cami) {
  const resta = [];
  let cursor = path.resolve(cami);
  for (;;) {
    try { return path.join(fs.realpathSync(cursor), ...resta); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const pare = path.dirname(cursor);
    if (pare === cursor) return path.resolve(cami);
    resta.unshift(path.basename(cursor));
    cursor = pare;
  }
}

/* El fitxer de --out: un .json fora de dist/ (el que es desplega) i de public/ (Vite el copia a dist/). */
function fitxerDeSortida(root, out) {
  if (typeof out !== 'string' || !out.endsWith('.json')) throw new Error('--out ha de ser un fitxer .json.');
  const fitxer = camiReal(out);
  for (const prohibit of ['dist', 'public']) {
    const rel = path.relative(path.resolve(root, prohibit), fitxer);
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) throw new Error(`--out no pot ser dins de ${prohibit}/.`);
  }
  return fitxer;
}

/* Un snapshot vell no sobreviu mai a una fallada: s'esborra abans de llegir res. */
function esborraAnterior(fitxer) {
  let stat;
  try { stat = fs.lstatSync(fitxer); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (stat.isDirectory()) throw new Error('--out és un directori.');
  fs.unlinkSync(fitxer);
}

function escriuAtomic(fitxer, text) {
  fs.mkdirSync(path.dirname(fitxer), {recursive: true});
  const temporal = path.join(path.dirname(fitxer), `.${path.basename(fitxer)}.${randomBytes(6).toString('hex')}.tmp`);
  fs.writeFileSync(temporal, text, {flag: 'wx'});
  fs.renameSync(temporal, fitxer);
}

const AVIS_SENSE_REMOT = [
  '',
  `AVÍS · ${ESCAPADA}=1: este build NO porta cap publicació remota.`,
  '  /mur/<id>, /mercat/<id> i /events/<id> del servidor no tindran head propi: els',
  '  rastrejadors (WhatsApp, Telegram…) en rebran la targeta genèrica.',
  '  No el desplegueu com a release: torneu a compilar sense la variable.',
  ''
].join('\n');

/** La CLI; torna el codi d'eixida. Les dependències s'injecten a les proves. */
export async function main(argv, {env = process.env, entorn = null, fetchImpl = globalThis.fetch, pausa = espera,
  stdout = process.stdout, stderr = process.stderr} = {}) {
  let fitxer = null, clauAnon = '';
  try {
    const args = {};
    for (let i = 0; i < argv.length; i += 2) {
      const k = argv[i];
      if (!['--root', '--out', '--origin', '--mode'].includes(k) || !argv[i + 1] || args[k]) throw new Error('Ús: --root RUTA --out JSON [--origin https://socdepoble.org] [--mode production]');
      args[k] = argv[i + 1];
    }
    if (!args['--root'] || !args['--out']) throw new Error('Ús: --root RUTA --out JSON [--origin https://socdepoble.org] [--mode production]');
    const root = fs.realpathSync(args['--root']);
    fitxer = fitxerDeSortida(root, args['--out']);
    esborraAnterior(fitxer);
    if (env[ESCAPADA] === '1') {
      escriuAtomic(fitxer, '[]\n');
      stderr.write(`${AVIS_SENSE_REMOT}\n`);
      stdout.write(`${JSON.stringify({valid: true, senseRemot: true, publicades: 0, fitxer: path.relative(root, fitxer)}, null, 2)}\n`);
      return 0;
    }
    const backend = entorn ?? entornDelBuild(await variablesDelBuild(root, args['--mode'] || 'production'));
    clauAnon = backend.anonKey || '';
    const {text, rebut} = await projeccioPublica({entorn: backend, origin: args['--origin'] || ORIGEN_SOCIAL_PER_DEFECTE, fetchImpl, pausa});
    // Invariant P1-61: només l'absència real d'imatge permet el logotip.
    for (const [seccio, dades] of Object.entries(rebut.seccions)) {
      if (dades.imatges.bloquejada) throw new Error(`${seccio}: ${dades.imatges.bloquejada} primera imatge bloquejada; la release necessita una foto servible.`);
    }
    escriuAtomic(fitxer, text);
    if (rebut.avis) stderr.write(`AVÍS · projecció pública: ${rebut.avis}.\n`);
    for (const [seccio, {duplicades}] of Object.entries(rebut.seccions)) {
      if (duplicades) stderr.write(`AVÍS · projecció pública: ${seccio}, ${duplicades} id repetits si no es miren les majúscules; n'ix el primer.\n`);
    }
    stdout.write(`${JSON.stringify({valid: true, ...rebut, fitxer: path.relative(root, fitxer)}, null, 2)}\n`);
    return 0;
  } catch (error) {
    if (fitxer) { try { esborraAnterior(fitxer); } catch { /* ja s'informa de l'error */ } }
    // Cap secret a l'eixida: la clau no hi va mai, encara que un missatge la portara.
    const missatge = String(error?.message || error);
    stderr.write(`${JSON.stringify({valid: false, error: clauAnon ? missatge.split(clauAnon).join('[clau]') : missatge,
      ajuda: `La release no ix sense les publicacions remotes. Sense xarxa o sense backend, i sabent-ho: ${ESCAPADA}=1.`})}\n`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(codi => { process.exitCode = codi; });
}
