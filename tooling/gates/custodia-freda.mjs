#!/usr/bin/env node
/** D3 · Doble Custòdia Zero-Pes (v1.2.26, Pacte de les 8 Decisions, aprovat pel Mestre el 25-11-2026 a les 20:37 CET).
 *
 *  L'històric fred que ix de la Wiki viva no pesa al repositori, però mai no es perd. Té dues custòdies
 *  independents amb els mateixos bytes:
 *   1. Git: una etiqueta anotada (`git tag -a`) sobre l'últim commit que conté el fitxer al seu camí original.
 *      Qualsevol clon que tinga l'etiqueta el recupera amb `git show <tag>:<camí>`. Fins que el Mestre autoritze
 *      pujar-la al remot, les dues custòdies són en este disc.
 *   2. Disc: una còpia a `../_arxiu_wiki_de_poble/` (fora de Git), apuntada a `00_manifest_arxiu_fred.json`
 *      dins de la clau `doble_custodia_zero_pes`, sense reordenar res del que ja hi havia.
 *
 *  Ancoratge (Gauntlet 261126, lent A): `tooling/gates/custodia-freda.lock.json`, versionat, fixa cada entrada i
 *  l'objecte de cada etiqueta. Una entrada del bloqueig que falte o canvie al manifest, una etiqueta refeta o una
 *  etiqueta pre-poda absent fan roig. Esta peça només llig: comprova les dues custòdies i que els bytes coincidixen.
 *  `node tooling/gates/porta-olivera.mjs --custodia` la crida (també es pot cridar sola).
 *
 *  Entrada del manifest: { id, origen, tag, commit, blob, sha256, bytes, desti, data, motiu, autoritzat_per }.
 *  Eixida: 0 si totes les entrades tenen les dues custòdies íntegres; 1 si n'hi ha cap de trencada.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { esMain } from '../lib/arrel.mjs';
import { contenidorDe } from '../lib/contenidor.mjs';

export const CLAU_MANIFEST = 'doble_custodia_zero_pes';
export const NOM_MANIFEST = '00_manifest_arxiu_fred.json';
export const BLOQUEIG = 'tooling/gates/custodia-freda.lock.json';
const CAMPS_FIXATS = ['origen', 'tag', 'commit', 'blob', 'sha256', 'bytes', 'desti'];
const SHA256 = /^[a-f0-9]{64}$/;
const SHA1 = /^[a-f0-9]{40}$/;
const TAG = /^[a-z0-9][a-z0-9._-]{2,80}$/;

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
// Sense GIT_DIR ni companyes heretades: la custòdia es comprova sempre al repositori que se li diu.
const ENV_NET = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_(DIR|COMMON_DIR|WORK_TREE|INDEX_FILE)$/.test(k)));
const git = (arrel, args, opcions = {}) => execFileSync('git', ['-C', arrel, ...args], { maxBuffer: 256 * 1024 * 1024, env: ENV_NET(), stdio: ['ignore', 'pipe', 'pipe'], ...opcions });

/** L'arxiu fred per defecte és a `<contenidor>/_arxiu_wiki_de_poble` (també des d'un worktree enllaçat). */
export function arxiuPerDefecte(arrelRepo) {
  return path.join(contenidorDe(arrelRepo), '_arxiu_wiki_de_poble');
}

/** Dins de l'arxiu i sense symlinks ni hardlinks: cap entrada no pot fer llegir fora de la seua carpeta. */
function fitxerDeLArxiu(arxiu, rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel) || rel.split('/').some((s) => !s || s === '.' || s === '..')) return { error: `destí invàlid: ${rel}` };
  let cursor = arxiu;
  for (const tros of rel.split('/')) {
    cursor = path.join(cursor, tros);
    let estat;
    try { estat = fs.lstatSync(cursor); } catch { return { error: `la còpia freda no hi és: ${rel}` }; }
    if (estat.isSymbolicLink()) return { error: `la còpia freda passa per un symlink: ${rel}` };
  }
  const estat = fs.lstatSync(cursor);
  if (!estat.isFile() || estat.nlink !== 1) return { error: `la còpia freda no és un fitxer regular únic: ${rel}` };
  return { cami: cursor };
}

export function llegixManifest(arxiu) {
  const cami = path.join(arxiu, NOM_MANIFEST);
  if (!fs.existsSync(cami)) return { manifest: null, error: `${NOM_MANIFEST} no hi és a ${arxiu}` };
  try { return { manifest: JSON.parse(fs.readFileSync(cami, 'utf8')), error: null }; }
  catch (e) { return { manifest: null, error: `${NOM_MANIFEST} il·legible: ${e.message}` }; }
}

/** Comprova una entrada. Torna la llista d'errors (buida si les dues custòdies són íntegres). */
export function verificaEntrada(arrelRepo, arxiu, e) {
  const errors = [];
  if (!e || typeof e !== 'object') return ['entrada buida'];
  for (const [camp, prova] of [['id', (v) => typeof v === 'string' && v.trim()], ['origen', (v) => typeof v === 'string' && v && !v.startsWith('/') && !v.split('/').includes('..')],
    ['tag', (v) => TAG.test(v ?? '')], ['commit', (v) => SHA1.test(v ?? '')], ['blob', (v) => SHA1.test(v ?? '')], ['sha256', (v) => SHA256.test(v ?? '')],
    ['bytes', (v) => Number.isInteger(v) && v >= 0], ['desti', (v) => typeof v === 'string' && v], ['motiu', (v) => typeof v === 'string' && v.trim()], ['autoritzat_per', (v) => typeof v === 'string' && v.trim()]]) {
    if (!prova(e[camp])) errors.push(`camp ${camp} invàlid`);
  }
  if (errors.length) return errors;
  // Custòdia 1: Git (etiqueta anotada, commit i blob exactes, bytes idèntics).
  try {
    const tipus = git(arrelRepo, ['cat-file', '-t', `refs/tags/${e.tag}`], { encoding: 'utf8' }).trim();
    if (tipus !== 'tag') errors.push(`l'etiqueta ${e.tag} no és anotada (${tipus})`);
    const commit = git(arrelRepo, ['rev-parse', '--verify', `refs/tags/${e.tag}^{commit}`], { encoding: 'utf8' }).trim();
    if (commit !== e.commit) errors.push(`l'etiqueta ${e.tag} apunta a ${commit}, no a ${e.commit}`);
    const blob = git(arrelRepo, ['rev-parse', '--verify', `${e.commit}:${e.origen}`], { encoding: 'utf8' }).trim();
    if (blob !== e.blob) errors.push(`${e.origen} a ${e.commit.slice(0, 9)} és el blob ${blob}, no ${e.blob}`);
    else {
      const bytes = git(arrelRepo, ['cat-file', 'blob', blob]);
      if (sha256(bytes) !== e.sha256 || bytes.length !== e.bytes) errors.push(`el blob de Git no té el SHA-256 i la mida del manifest`);
    }
  } catch (err) { errors.push(`custòdia Git il·legible per a ${e.tag}: ${String(err.stderr || err.message).trim().split('\n')[0]}`); }
  // Custòdia 2: disc (còpia freda regular, mateixos bytes).
  const { cami, error } = fitxerDeLArxiu(arxiu, e.desti);
  if (error) errors.push(error);
  else {
    const bytes = fs.readFileSync(cami);
    if (sha256(bytes) !== e.sha256 || bytes.length !== e.bytes) errors.push(`la còpia freda ${e.desti} no té el SHA-256 i la mida del manifest`);
  }
  return errors;
}

export function llegixBloqueig(arrelRepo) {
  const cami = path.join(arrelRepo, BLOQUEIG);
  if (!fs.existsSync(cami)) return { bloqueig: null, error: `${BLOQUEIG} no hi és: la custòdia no té ancoratge versionat` };
  try {
    const b = JSON.parse(fs.readFileSync(cami, 'utf8'));
    if (b?.schema !== 'sdp.custodia-freda.lock.v1' || !Array.isArray(b.entrades) || !Array.isArray(b.etiquetes)) throw new Error('esquema');
    return { bloqueig: b, error: null };
  } catch { return { bloqueig: null, error: `${BLOQUEIG} no és un bloqueig sdp.custodia-freda.lock.v1` }; }
}

const objecteDeLEtiqueta = (arrel, tag) => { try { return git(arrel, ['rev-parse', '--verify', `refs/tags/${tag}`], { encoding: 'utf8' }).trim(); } catch { return null; } };

/** El que el bloqueig fixa ha de ser al manifest sense canvis, i cada etiqueta ha de ser l'objecte fixat. */
function errorsDelBloqueig(arrelRepo, bloqueig, llista) {
  const errors = [];
  const perId = new Map((Array.isArray(llista) ? llista : []).map((e) => [e?.id, e]));
  for (const b of bloqueig.entrades) {
    const e = perId.get(b.id);
    if (!e) { errors.push(`el bloqueig fixa ${b.id} i el manifest no el porta`); continue; }
    for (const camp of CAMPS_FIXATS) if (e[camp] !== b[camp]) errors.push(`${b.id}: ${camp} del manifest no és el del bloqueig`);
    if (objecteDeLEtiqueta(arrelRepo, b.tag) !== b.tagObject) errors.push(`${b.id}: l'etiqueta ${b.tag} no és l'objecte fixat (${String(b.tagObject).slice(0, 12)}): s'ha refet o no hi és`);
  }
  for (const et of bloqueig.etiquetes) {
    const objecte = objecteDeLEtiqueta(arrelRepo, et.tag);
    if (objecte !== et.tagObject) { errors.push(`l'etiqueta ${et.tag} no és l'objecte fixat: s'ha refet o no hi és`); continue; }
    try {
      if (git(arrelRepo, ['cat-file', '-t', objecte], { encoding: 'utf8' }).trim() !== 'tag') errors.push(`l'etiqueta ${et.tag} no és anotada`);
      if (git(arrelRepo, ['rev-parse', '--verify', `${objecte}^{commit}`], { encoding: 'utf8' }).trim() !== et.commit) errors.push(`l'etiqueta ${et.tag} no apunta a ${et.commit}`);
    } catch { errors.push(`l'etiqueta ${et.tag} és il·legible`); }
  }
  return errors;
}

export function verificaCustodiaFreda(arrelRepo, { arxiu = arxiuPerDefecte(arrelRepo), bloqueig } = {}) {
  const { manifest, error } = llegixManifest(arxiu);
  if (error) return { ok: false, arxiu, entrades: [], errors: [error] };
  const b = bloqueig === undefined ? llegixBloqueig(arrelRepo) : { bloqueig, error: bloqueig ? null : 'sense bloqueig' };
  if (b.error) return { ok: false, arxiu, entrades: [], errors: [b.error] };
  const llista = manifest[CLAU_MANIFEST];
  const delBloqueig = errorsDelBloqueig(arrelRepo, b.bloqueig, llista);
  if (llista === undefined) return { ok: delBloqueig.length === 0, arxiu, entrades: [], errors: delBloqueig, buida: true };
  if (!Array.isArray(llista)) return { ok: false, arxiu, entrades: [], errors: [`${CLAU_MANIFEST} no és una llista`, ...delBloqueig] };
  const ids = new Set();
  const entrades = llista.map((e) => {
    const errors = verificaEntrada(arrelRepo, arxiu, e);
    if (ids.has(e?.id)) errors.push(`id repetit: ${e.id}`);
    ids.add(e?.id);
    return { id: e?.id ?? null, tag: e?.tag ?? null, origen: e?.origen ?? null, desti: e?.desti ?? null, errors };
  });
  return { ok: entrades.every((x) => !x.errors.length) && delBloqueig.length === 0, arxiu, entrades, errors: delBloqueig };
}

export function textCustodia(r) {
  const linies = [`[Custòdia freda] ${r.arxiu}/${NOM_MANIFEST} · clau ${CLAU_MANIFEST}`];
  for (const e of r.errors) linies.push(`   ✗ ${e}`);
  if (r.buida) linies.push('   Cap entrada de Doble Custòdia: res a comprovar.');
  for (const e of r.entrades) {
    if (!e.errors.length) linies.push(`   ✓ ${e.id}: etiqueta ${e.tag} i còpia ${e.desti}, bytes idèntics a ${e.origen}`);
    else for (const err of e.errors) linies.push(`   ✗ ${e.id ?? '(sense id)'}: ${err}`);
  }
  return linies;
}

if (esMain(import.meta.url)) {
  const arxiu = process.argv.find((a) => a.startsWith('--arxiu='))?.slice(8);
  const arrel = process.argv.find((a) => a.startsWith('--arrel='))?.slice(8) || process.cwd();
  try {
    const r = verificaCustodiaFreda(arrel, arxiu ? { arxiu } : {});
    if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
    else console.log(textCustodia(r).join('\n'));
    process.exitCode = r.ok ? 0 : 1;
  } catch (e) { console.error(`custodia-freda: ${e.message}`); process.exitCode = 2; }
}
