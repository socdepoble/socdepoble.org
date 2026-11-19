#!/usr/bin/env node
/** P1-29/P1-30 · contracte executable del marc no destructiu (#sdp-crop=).
 * Reutilitza el motor de crop, formats/límits, consumidors i classificadors del
 * cens. Només llig fonts fixades i public/assets; no consulta cap servidor ni
 * mou imatges. SHA-256 identifica bytes, mai igualtat visual o drets humans.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { arrel as resolArrel, arrelSegura, esMain, CAMINS } from '../lib/arrel.mjs';
import * as crop from '../../src/utils/enquadramentUrl.js';
import { FORMATS, ZOOM_MAX } from '../../src/components/universal/enquadrament/enquadrament.js';
import { PES_MAXIM_ENTRADA, COSTAT_MAXIM, PIXELS_MAXIMS, comprovaPes, comprovaDimensions } from '../../src/components/universal/enquadrament/limits.js';
import { creaMitjansLocal } from '../../src/data/local/mitjansLocal.js';
import { validaBackendImplementation } from '../../src/data/backendPort.js';
import { CONTRACTE_NUCLI } from '../../src/data/contracte.js';
import { imatgeDe, preparaDadesObertesMunicipi, exportaMunicipiOpenData, verificaPaquetOpenData } from '../../src/data/exportaMunicipiOpenData.js';
import { resolveAsset } from '../../src/config/assetResolver.js';
import { CENS_IMATGES, EXCLOSES, SVG_DOCUMENTATS_ARXIU, idDelCens } from '../../src/sections/multimedia/censImatges.js';
import { bessonaDe, bessonesDe } from '../../src/config/politicaDeMitjans.js';
import { CORRECCIONS_D_ALIES, contextDelCens, arrelDelCens, grupsDuplicats, classificaDuplicats, motiusTrencats } from '../media/duplicats_assets.mjs';

// Els tractors llegats resolen PROJECT_DIR en importar. Retenim l'error per
// poder informar-lo al CLI, fins i tot amb SDP_ARREL invàlid, sense stack cru.
let media, mediaError;
try {
  const [cens, formats] = await Promise.all([import('../media/cens_imatges.mjs'), import('../media/optimitzar_webp.mjs')]);
  media = { usosDe: cens.usosDe, extensions: formats.EXTENSIONS_IMATGE };
} catch (e) { mediaError = e; }

export const FONTS = Object.freeze([
  'src/utils/enquadramentUrl.js',
  'src/components/universal/enquadrament/enquadrament.js',
  'src/components/universal/enquadrament/limits.js',
  'src/data/local/mitjansLocal.js', 'src/data/supabase/storage.js',
  'src/data/backendPort.js', 'src/data/exportaMunicipiOpenData.js',
  'src/config/assetResolver.js', 'src/sections/multimedia/censImatges.js',
  'src/hooks/useEnquadramentDeImatge.js',
]);
const MARC = Object.freeze({ format: '16:9', zoom: 1.5, cx: .4, cy: .6 });
const REF = 'sdp-media://mitjans/poble/uid/avatars/foto.webp';
const FRAGMENT = '#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const error = (code, message) => Object.assign(new Error(message), { code });
const fold = (s) => s.normalize('NFKC').toLowerCase();
const FORBIDDEN = new Set(['01_produccio', '90_arxiu_historic', CAMINS.wiki, '.git'].map(fold));
const MAX_FILES = 4096, MAX_FILE_BYTES = 32 * 1024 * 1024, MAX_TOTAL_BYTES = 512 * 1024 * 1024;

function filePath(root, rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel) || /[\\\x00-\x1f]/.test(rel)
      || rel.split('/').some((p) => !p || p === '.' || p === '..' || FORBIDDEN.has(fold(p)))) throw error('CROP_PATH_INVALID', 'Ruta fora del perímetre de fonts/imatges.');
  let cursor = root;
  for (const part of rel.split('/')) {
    cursor = path.join(cursor, part);
    const stat = fs.lstatSync(cursor);
    if (stat.isSymbolicLink()) throw error('CROP_FILE_INVALID', `Symlink no admés: ${rel}`);
  }
  return cursor;
}

/** Pre-stat abans d'open: ni FIFO ni dispositius poden bloquejar la lectura. */
function readRegular(root, rel, max = MAX_FILE_BYTES) {
  const abs = filePath(root, rel), before = fs.lstatSync(abs);
  if (!before.isFile() || before.nlink !== 1 || before.size > max) throw error('CROP_FILE_INVALID', `Font no regular o massa gran: ${rel}`);
  if (![fs.constants.O_NONBLOCK, fs.constants.O_NOFOLLOW].every(Number.isInteger)) throw error('CROP_FILE_INVALID', 'Falten primitives de lectura segura.');
  const fd = fs.openSync(abs, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd);
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size !== before.size) throw error('CROP_FILE_CHANGED', `Font canviada: ${rel}`);
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const count = fs.readSync(fd, bytes, offset, bytes.length - offset, offset);
      if (!count) break;
      offset += count;
    }
    const extra = fs.readSync(fd, Buffer.alloc(1), 0, 1, before.size);
    const after = fs.fstatSync(fd), current = fs.lstatSync(filePath(root, rel));
    if (offset !== before.size || extra || after.nlink !== 1 || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs
        || current.dev !== before.dev || current.ino !== before.ino || current.nlink !== 1) throw error('CROP_FILE_CHANGED', `Font canviada durant la lectura: ${rel}`);
    return bytes;
  } finally { fs.closeSync(fd); }
}

/** Canaris amb consumidors reals. La injecció només servix a contraproves locals. */
export async function comprovaContracteEnquadrament({ motor = crop, creaMitjans = creaMitjansLocal } = {}) {
  const incidencies = [], proves = [];
  const check = async (codi, action) => {
    try { await action(); proves.push({ codi, valid: true }); }
    catch (e) { proves.push({ codi, valid: false }); incidencies.push({ codi, detall: e.message.slice(0, 350) }); }
  };
  await check('CROP_SERIALIZATION', () => {
    assert.equal(motor.ambEnquadrament(REF, MARC), REF + FRAGMENT);
    assert.deepEqual(motor.separaEnquadrament(REF + FRAGMENT), { base: REF, enquadrament: MARC });
    assert.equal(motor.llevaEnquadrament(REF + FRAGMENT), REF);
    assert.equal(motor.ambEnquadrament(REF + FRAGMENT, { ...MARC, format: 'original', zoom: 1 }), REF);
  });
  await check('CROP_NUMBERS', () => {
    assert.deepEqual(motor.enquadramentNet({ format: '4:3', zoom: '9', cx: '-1', cy: '.123456' }), { format: '4:3', zoom: 4, cx: 0, cy: .1235 });
    for (const bad of ['', null, false, { toString: 0, valueOf: 0 }]) assert.equal(motor.enquadramentNet({ ...MARC, zoom: bad }), null);
    assert.equal(motor.enquadramentNet({ ...MARC, format: '100:1' }), null);
    assert.equal(motor.enquadramentNet({ ...MARC, zoom: Infinity }), null);
  });
  await check('CROP_TRANSFER', () => {
    assert.equal(motor.conservaEnquadrament('https://media.example/foto.webp', REF + FRAGMENT), 'https://media.example/foto.webp' + FRAGMENT);
    assert.equal(motor.separaEnquadrament(REF + '#legacy').base, REF + '#legacy');
    assert.equal(motor.llevaEnquadrament(REF + '#sdp-crop=format=bad'), REF);
  });
  await check('CROP_FORMAT_REGISTRY', () => {
    assert.ok(Array.isArray(FORMATS) && FORMATS.length > 0);
    assert.equal(FORMATS[0].valor, '1:1');
    assert.equal(new Set(FORMATS.map((f) => f.valor)).size, FORMATS.length);
  });
  for (const format of FORMATS) for (const zoom of [1, 1.5, ZOOM_MAX]) {
    await check(`CROP_FORMAT_${format.valor}_${zoom}`, () => {
      const state = { ...MARC, format: format.valor, zoom };
      const url = motor.ambEnquadrament(REF, state), parsed = motor.separaEnquadrament(url);
      assert.equal(parsed.base, REF);
      assert.equal(motor.ratioDelMarc(format.valor, 4 / 3), format.ratio ?? 4 / 3);
      assert.equal(motor.mateixEnquadrament(state, parsed.enquadrament), true);
      const point = motor.posicioEnCaixa(state, 4 / 3, 1);
      assert.ok(point && [point.x, point.y, point.zoom].every(Number.isFinite));
      assert.ok(point.zoom >= 1);
    });
  }
  await check('CROP_PAINT_PRIMITIVES', () => {
    for (const value of [null, '', false, 0, 0n, '0']) {
      assert.deepEqual(motor.posicioEnCaixa(MARC, 1, 1, { alineacio: { x: value, y: value } }), { x: 10.67, y: 66, zoom: 2.6667 });
      assert.equal(motor.retallCssDelZoom({ zoom: 2, x: value, y: value }), 'inset(0% 50% 50% 0%)');
    }
    const bad = { toString: 0, valueOf: 0 };
    assert.equal(motor.ratioDelMarc(bad, 1), null);
    assert.equal(motor.retallCssDelZoom({ zoom: bad, x: 0, y: 0 }), null);
  });
  await check('CROP_INPUT_LIMITS', () => {
    assert.equal(comprovaPes({ size: PES_MAXIM_ENTRADA }), null);
    assert.equal(comprovaPes({ size: PES_MAXIM_ENTRADA + 1 }), 'pes');
    assert.equal(comprovaDimensions(5000, PIXELS_MAXIMS / 5000), null);
    assert.equal(comprovaDimensions(5000, PIXELS_MAXIMS / 5000 + 1), 'pixels');
    assert.equal(comprovaDimensions(COSTAT_MAXIM + 1, 1), 'pixels');
    assert.equal(ZOOM_MAX, motor.ZOOM_MAXIM_ENQUADRAMENT);
  });
  await check('CROP_HOST_RESOLVE', () => {
    const resolved = resolveAsset('/assets/canari.png' + FRAGMENT, '/paquet', '', 'gate');
    assert.equal(resolved, '/paquet/assets/canari.png?v=gate' + FRAGMENT);
  });
  let close = () => {}, sequence = 0, local, uploaded, originalHash;
  const original = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1kAAAAASUVORK5CYII=', 'base64');
  await check('CROP_BACKEND_SETUP', async () => {
    local = creaMitjans({ alTancar: (fn) => { close = fn; }, usuari: () => ({ id: 'gate' }), configuracio: { tenantId: 'gate' }, nouId: () => `canari-${++sequence}` });
    const core = Object.fromEntries(CONTRACTE_NUCLI.map((key) => [key, () => undefined]));
    local = validaBackendImplementation({ ...core, ...local }).candidate;
    originalHash = sha(original);
    uploaded = await local.uploadToStorage(new Blob([original], { type: 'image/png' }), { carpeta: 'notes' });
    assert.equal(uploaded.url, 'sdp-media://mitjans_privats/gate/gate/notes/canari-1.png');
  });
  await check('CROP_BACKEND_FRAGMENT', async () => {
    const result = await local.resolveAsset(motor.ambEnquadrament(uploaded.url, MARC));
    assert.deepEqual(motor.separaEnquadrament(result).enquadrament, MARC);
  });
  await check('CROP_ORIGINAL_HASH', async () => {
    for (const zoom of [1.5, 2, 4]) {
      const ref = motor.ambEnquadrament(uploaded.url, { ...MARC, zoom });
      const resolved = await local.resolveAsset(ref), base = motor.llevaEnquadrament(resolved);
      assert.ok(base.startsWith('data:image/png;base64,'));
      assert.equal(sha(Buffer.from(base.slice(base.indexOf(',') + 1), 'base64')), originalHash);
      assert.equal(motor.llevaEnquadrament(ref), uploaded.url);
    }
    assert.equal(sha(original), originalHash);
    assert.equal(sequence, 1, 'reenquadrar no puja ni genera un asset nou');
  });
  await check('CROP_PROMOTION', async () => {
    const framed = motor.ambEnquadrament(uploaded.url, MARC), promoted = await local.promoteToPublic(framed);
    assert.equal(promoted, framed.replace('mitjans_privats/', 'mitjans/'));
    assert.equal(await local.promoteToPublic(framed), promoted);
    assert.equal(await local.resolveAsset(promoted), await local.resolveAsset(framed));
    assert.equal(sequence, 1);
  });
  close();
  await check('CROP_OPEN_DATA', async () => {
    const image = '/assets/canari.png';
    assert.equal(imatgeDe(image + FRAGMENT), image);
    assert.equal(imatgeDe('https://media.example/storage/v1/object/public/mitjans/poble/foto.png' + FRAGMENT), 'sdp-media://mitjans/poble/foto.png');
    const input = { municipi: { slug: 'sella', nom: 'Sella' }, ara: '2026-11-18T00:00:00Z', entitats: [], agenda: [], memoria: [],
      noticies: [{ id: 'crop-canari', title: 'Canari', body: 'Original sencer.', poble_id: 'sella', author_entity_id: 'entitat-gate', copyright: 'CC BY 4.0', created_at: '2026-11-17T00:00:00Z', image_url: image + FRAGMENT }] };
    const prepared = preparaDadesObertesMunicipi(input);
    assert.equal(prepared.comptes.noticies, 1);
    const news = JSON.parse(prepared.fitxers.find((f) => f.nom === 'noticies.jsonld').text);
    assert.equal(news['@graph'][0].image, image);
    const exported = await exportaMunicipiOpenData(input, { subtle: webcrypto.subtle });
    const verified = await verificaPaquetOpenData(exported.zip, { subtle: webcrypto.subtle });
    assert.equal(verified.slug, 'sella');
    assert.ok(verified.fitxers > 0 && verified.recursos > 0);
    assert.ok(!prepared.fitxers.some((f) => f.text.includes('#sdp-crop=')));
  });
  return { valid: incidencies.length === 0, observacions: proves.length, proves, incidencies };
}

/** Inventari bounded; reutilitza identitat, referències i duplicats del cens. */
export function inspeccionaAssets(root, fonts = [], options = {}) {
  if (mediaError) throw mediaError;
  root = fs.realpathSync(root);
  const files = [], names = new Set();
  let total = 0, totalBytes = 0;
  const walk = (rel) => {
    const abs = filePath(root, rel), stat = fs.lstatSync(abs);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(abs).sort()) walk(`${rel}/${name}`);
      return;
    }
    if (!stat.isFile() || stat.nlink !== 1) throw error('CROP_FILE_INVALID', `Asset no regular: ${rel}`);
    if (++total > MAX_FILES) throw error('CROP_INVENTORY_LIMIT', 'Massa fitxers a public/assets.');
    if (!media.extensions.includes(path.extname(rel).toLowerCase())) return;
    const key = fold(rel);
    if (names.has(key)) throw error('CROP_ASSET_COLLISION', `Col·lisió de camins: ${rel}`);
    names.add(key);
    if (totalBytes + stat.size > MAX_TOTAL_BYTES) throw error('CROP_INVENTORY_LIMIT', 'Inventari superior a 512 MiB.');
    const bytes = readRegular(root, rel);
    totalBytes += bytes.length;
    files.push({ src: `/${rel.slice('public/'.length)}`, ruta: rel, bytes: bytes.length, sha256: sha(bytes) });
  };
  walk('public/assets');
  if (!files.length) throw error('CROP_EMPTY_ASSETS', 'Cap imatge observada; no es pot acreditar un inventari buit.');
  const bytes = files.reduce((n, f) => n + f.bytes, 0);
  if (bytes > MAX_TOTAL_BYTES) throw error('CROP_INVENTORY_LIMIT', 'Inventari superior a 512 MiB.');
  const originals = bessonesDe(files.map((f) => f.src.slice(1)));
  const ctx = contextDelCens({ presents: files.map((f) => f.src), cens: options.cens ?? CENS_IMATGES,
    excloses: options.excloses ?? EXCLOSES, svgs: options.svgs ?? SVG_DOCUMENTATS_ARXIU, correccions: options.correccions ?? CORRECCIONS_D_ALIES,
    bessonaDe: new Map(originals.map((f) => [`/${bessonaDe(f)}`, `/${f}`])) });
  const uses = media.usosDe(files.map((f) => ({ cami: f.src.slice(1) })), fonts);
  const entries = new Map((options.cens ?? CENS_IMATGES).map((e) => [e.src, e]));
  const detail = files.map((f) => {
    const arrelCens = arrelDelCens(f.src, ctx), entry = entries.get(arrelCens), svg = ctx.svgs[f.src];
    return { ...f, arrelCens, assetId: idDelCens(arrelCens), procedencia: entry ? { origen: entry.origen, ambit: entry.ambit, ...(entry.poble ? { poble: entry.poble } : {}) } : svg ? { ambit: svg.ambit } : null,
      usos: uses.get(f.src.slice(1)) };
  });
  const duplicates = classificaDuplicats(grupsDuplicats(files), ctx, { ...(options.pares ? { pares: options.pares } : {}), ...(options.acreditats ? { acreditats: options.acreditats } : {}) });
  return { imatges: files.length, bytes, referencies: detail.reduce((n, f) => n + f.usos.length, 0), ambProcedencia: detail.filter((f) => f.procedencia).length,
    duplicatsNoAcreditats: duplicates.filter((g) => g.acreditacio === 'no_acreditat').length,
    duplicats: duplicates, motiusTrencats: motiusTrencats(ctx), detall: detail,
    sha256Inventari: sha(JSON.stringify(files)) };
}

/** Internal worker body. Public certification always starts a fresh process. */
export async function executaVerificacioImatgesInterna({ arrel = arrelSegura() } = {}) {
  const runtimeRoot = resolArrel({ argv: [], env: {}, desDe: import.meta.url });
  const root = resolArrel({ arrel });
  // Canaries use this module's actual imported consumers, including transitive
  // dependencies outside FONTS. Matching only direct sources in another tree
  // cannot prove that tree's runtime. Execute its own gate to certify that tree.
  if (root !== runtimeRoot) throw error('CROP_RUNTIME_ROOT_MISMATCH', 'Executeu el tractor instal·lat dins de l’arrel que voleu verificar.');
  const sources = FONTS.map((rel) => {
    const bytes = readRegular(root, rel, 4 * 1024 * 1024);
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw error('CROP_UTF8_INVALID', `Font no UTF-8: ${rel}`); }
    return { fitxer: rel, text, bytes: bytes.length, sha256: sha(bytes) };
  });
  const assets = inspeccionaAssets(root, sources), canaris = await comprovaContracteEnquadrament();
  const incidencies = [...canaris.incidencies];
  if (!assets.referencies || !assets.ambProcedencia) incidencies.push({ codi: 'CROP_EMPTY_EVIDENCE' });
  if (assets.duplicatsNoAcreditats) incidencies.push({ codi: 'CROP_DUPLICATE_UNACCREDITED' });
  if (assets.motiusTrencats.length) incidencies.push({ codi: 'CROP_PROVENANCE_BROKEN' });
  for (const source of sources) if (sha(readRegular(root, source.fitxer)) !== source.sha256) throw error('CROP_FILE_CHANGED', `Font canviada durant els canaris: ${source.fitxer}`);
  // Relectura amb el mateix lector segur: el contracte mai acredita l'original si ha canviat.
  if (inspeccionaAssets(root, []).sha256Inventari !== assets.sha256Inventari) throw error('CROP_FILE_CHANGED', 'Els assets han canviat durant els canaris.');
  return { schema: 'sdp.imatges-enquadrament.v1', valid: incidencies.length === 0, arrel: root, incidencies, runtimeFresc: false,
    canaris, assets, fonts: sources.map((source) => ({ fitxer: source.fitxer, bytes: source.bytes, sha256: source.sha256 })),
    pixelsRenderitzats: false, purgaFeta: false, revisioHumanaDuplicatsFeta: false,
    limits: ['Canaris matemàtics i consumidors locals; no acredita píxels renderitzats, navegadors, servidor remot o política RLS.',
      'Els canaris acrediten només l’arrel del tractor carregat; per a una altra còpia cal executar el seu propi tractor.',
      'Cal un arbre estable: la verificació no és un snapshot atòmic davant editors concurrents de dependències transitives.',
      'Referències estàtiques de deu fonts declarades; no és un cens complet de tots els usos ni d’usos remots.',
      'SHA-256 prova bytes idèntics; no prova semblança visual, drets o la revisió humana pendent de duplicats (Mestre).',
      'L’exportació OpenData conserva la foto sencera i elimina el marc segons el seu contracte; no exporta el CSS.',
      'Inventari limitat a 4096 fitxers, 32 MiB per imatge i 512 MiB totals; fonts a 4 MiB. Cap purga ni alta al cens.'] };
}

const WORKER = `
try {
  const { executaVerificacioImatgesInterna } = await import(process.argv[1]);
  const report = await executaVerificacioImatgesInterna({ arrel: process.argv[2] });
  process.stdout.write(JSON.stringify(report));
} catch (e) {
  process.stderr.write(JSON.stringify({ code: e.code ?? 'CROP_READ_FAILED', error: e.message }));
  process.exitCode = 1;
}`;

/** A warm caller cannot substitute a cached consumer for the on-disk tree. */
export async function verificaImatgesEnquadrament({ arrel = arrelSegura() } = {}) {
  const runtimeRoot = resolArrel({ argv: [], env: {}, desDe: import.meta.url }), root = resolArrel({ arrel });
  if (root !== runtimeRoot) throw error('CROP_RUNTIME_ROOT_MISMATCH', 'Executeu el tractor instal·lat dins de l’arrel que voleu verificar.');
  const env = { ...process.env, SDP_ARREL: root };
  for (const key of ['NODE_OPTIONS', 'NODE_PATH', 'NODE_V8_COVERAGE']) delete env[key];
  const child = spawnSync(process.execPath, ['--input-type=module', '--eval', WORKER, import.meta.url, root], {
    cwd: root, env, encoding: 'utf8', timeout: 20000, maxBuffer: 8 * 1024 * 1024, killSignal: 'SIGKILL',
  });
  if (child.error) throw error('CROP_WORKER_FAILED', child.error.code === 'ETIMEDOUT' ? 'Temps de verificació esgotat.' : 'No s’ha pogut llegir la verificació del procés nou.');
  if (child.status !== 0) {
    let detail;
    try { detail = JSON.parse(child.stderr); } catch { /* Never treat an incomplete worker as success. */ }
    throw error(typeof detail?.code === 'string' ? detail.code : 'CROP_WORKER_FAILED', typeof detail?.error === 'string' ? detail.error : 'Procés de verificació interromput.');
  }
  let report;
  try { report = JSON.parse(child.stdout); } catch { throw error('CROP_WORKER_INVALID', 'Resposta de verificació invàlida.'); }
  if (report?.schema !== 'sdp.imatges-enquadrament.v1' || report.arrel !== root || typeof report.valid !== 'boolean'
      || !Array.isArray(report.incidencies) || !Number.isSafeInteger(report.canaris?.observacions) || report.canaris.observacions < 1
      || !Number.isSafeInteger(report.assets?.imatges) || report.assets.imatges < 1 || !Array.isArray(report.fonts) || report.fonts.length !== FONTS.length) {
    throw error('CROP_WORKER_INVALID', 'Falta evidència no buida del procés de verificació.');
  }
  return { ...report, runtimeFresc: true };
}

export async function main(argv = process.argv.slice(2), { sortida = console } = {}) {
  try {
    const seen = new Set();
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i], key = arg.startsWith('--arrel=') ? '--arrel' : arg;
      if (!['--json', '--arrel'].includes(key) || seen.has(key)) throw error('CROP_USAGE', 'Ús: tractor-imatges-enquadrament.mjs [--json] [--arrel CAMÍ]');
      seen.add(key);
      if (arg === '--arrel' && (!argv[++i] || argv[i].startsWith('--'))) throw error('CROP_USAGE', 'Falta el camí de --arrel.');
      if (arg === '--arrel=') throw error('CROP_USAGE', 'Falta el camí de --arrel.');
    }
    const report = await verificaImatgesEnquadrament({ arrel: resolArrel({ argv }) });
    sortida.log(JSON.stringify(report));
    return report.valid ? 0 : 1;
  } catch (e) { sortida.error(JSON.stringify({ valid: false, code: e.code ?? 'CROP_READ_FAILED', error: e.message })); return 1; }
}
if (esMain(import.meta.url)) process.exitCode = await main();
