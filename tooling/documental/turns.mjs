/** Persistent per-turn records. Locks never silently recover; failed writes leave the prior record intact. */
import { CAMINS } from '../lib/arrel.mjs';
import { checkTaula, checkConvocatoria } from '../gates/porta-olivera.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto, { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DESK, canonical, inside, relativePath, humanZone, hashFile, sha, json, turnPattern, receiptPattern,
  exemptDeRebut, loadContract, saveContract, readContract, resolveRoute, parseDocument, anchored, validateSchema, validateSections, validateRegister } from './core.mjs';

// Onada R32 · D-R30-15 (aprovada pel Mestre el 16-11-2026 a les 14:32): els registres de torn són
// estat local de la màquina (fora de Git) i els nous desen l'inventari compacte; els antics es lligen igual.
const STORE = '.agents/runtime/turns';
function recordPath(root, id) {
  if (!turnPattern.test(id)) throw new Error('Identificador de torn invàlid');
  const target = path.join(root, STORE, `${id}.json`);
  if (!inside(canonical(root), canonical(target))) throw new Error('Registre fora del repositori');
  return target;
}

/* ── Inventari del torn ──────────────────────────────────────────────────────────────────────
   Què observen openTurn i checkTurn: cada entrada (directori o fitxer de l'arrel) es recorre
   sencera excepte els noms omesos; els exclosos no compten mai. Les tres llistes queden gravades
   al descriptor compacte de cada torn nou: un canvi ací no altera la reconstrucció dels torns ja oberts. */
const ENTRADES_INVENTARI = Object.freeze(['src', 'tooling', 'scripts', 'tests', '.agents', '.codex', '.claude', '.github', '.husky', CAMINS.wiki,
  'package.json', 'package-lock.json', 'AGENTS.md', 'CLAUDE.md', 'vite.config.js', '.gitignore']);
const OMESOS_INVENTARI = Object.freeze(['node_modules', '.git', 'dist', '90_arxiu_historic', '.obsidian', 'runtime', '__pycache__']);
const EXCLOSOS_INVENTARI = Object.freeze(['.agents/TORN_ACTIU.json']);
/** `turn.initial` compacte: commit base de Git + diferències de l'arbre observat respecte d'eixe commit. */
export const FORMAT_INVENTARI_INICIAL = 'sdp.inventari.delta-git.v1';
/** `turn.verification.inventari`: certificat de l'inventari del segell, reconstruïble des de l'inicial. */
export const FORMAT_INVENTARI_VERIFICAT = 'sdp.inventari.delta-inicial.v1';
const OID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const HASH = /^[0-9a-f]{64}$/;
const LOT_BLOBS = 16 * 1024 * 1024;

const ordenat = map => Object.fromEntries(Object.keys(map).sort().map(rel => [rel, map[rel]]));
/** Empremta d'un inventari independent de l'ordre de les claus. */
const empremta = map => sha(JSON.stringify(Object.keys(map).sort().map(rel => [rel, map[rel]])));
const oidBlob = (bytes, algorisme) => crypto.createHash(algorisme).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const algorismeDe = oid => (oid.length === 64 ? 'sha256' : 'sha1');

/** Observació física de l'inventari. Amb `oid` també calcula l'identificador de blob de Git de cada entrada. */
function observa(root, { files = [], oid = null } = {}) {
  const out = new Map();
  const skip = new Set(OMESOS_INVENTARI);
  const entrada = (bytes, kind, hash) => (oid ? { hash, kind, oid: oidBlob(bytes, oid) } : { hash, kind });
  function walk(rel) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) return;
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) { const desti = fs.readlinkSync(file); out.set(rel, entrada(Buffer.from(desti), 'symlink', sha(`symlink:${desti}`))); return; }
    if (stat.isDirectory()) {
      for (const e of fs.readdirSync(file).sort()) if (!skip.has(e)) walk(`${rel}/${e}`);
    } else if (stat.isFile()) { const bytes = fs.readFileSync(file); out.set(rel, entrada(bytes, 'file', sha(bytes))); }
  }
  for (const rel of ENTRADES_INVENTARI) walk(rel);
  for (const file of files) {
    const rel = relativePath(root, file);
    if (fs.existsSync(path.join(root, rel))) { const bytes = fs.readFileSync(path.join(root, rel)); out.set(rel, entrada(bytes, 'file', sha(bytes))); }
  }
  for (const rel of EXCLOSOS_INVENTARI) out.delete(rel);
  return out;
}
const hashes = observat => Object.fromEntries([...observat].map(([rel, o]) => [rel, o.hash]));
export function inventory(root, {files=[]} = {}) {
  return hashes(observa(root, { files }));
}
export function changes(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(p => before[p] !== after[p]).sort();
}

/* Git només en lectura (rev-parse, ls-tree, cat-file), sense variables GIT_* heretades d'un hook. */
function gitLectura(root, args, input, maxBuffer = LOT_BLOBS * 4) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
  const r = spawnSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, input, maxBuffer, timeout: 60000,
    env: { ...env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' } });
  return r.error || r.status !== 0 ? null : r.stdout;
}
/** Commit base per a un inventari compacte, o el motiu (esperat) pel qual no n'hi ha. */
function baseGit(root) {
  const top = gitLectura(root, ['rev-parse', '--show-toplevel']);
  if (!top) return { motiu: 'sense repositori Git' };
  let mateixa = false;
  try { mateixa = fs.realpathSync.native(top.toString('utf8').trim()) === fs.realpathSync.native(root); } catch { mateixa = false; }
  if (!mateixa) return { motiu: "l'arrel no és el nivell superior del repositori" };
  const base = gitLectura(root, ['rev-parse', '--verify', '--quiet', 'HEAD^{commit}'])?.toString('utf8').trim();
  if (!base || !OID.test(base)) return { motiu: 'repositori sense HEAD' };
  return { base, algorisme: algorismeDe(base) };
}
function predicatInventari({ arrels, omesos, exclosos }) {
  const skip = new Set(omesos), fora = new Set(exclosos);
  return rel => {
    if (fora.has(rel)) return false;
    const arrel = arrels.find(e => rel === e || rel.startsWith(`${e}/`));
    return arrel !== undefined && !rel.slice(arrel.length + 1).split('/').some(part => skip.has(part));
  };
}
/** Blobs del commit base dins de l'inventari: ruta → {oid, kind}. */
function entradesBase(root, d) {
  const raw = gitLectura(root, ['ls-tree', '-r', '-z', '--full-tree', d.base]);
  if (raw === null) throw new Error(`Inventari inicial compacte no reconstruïble: el commit base ${d.base.slice(0, 12)} no és llegible en este repositori`);
  const dins = predicatInventari(d), out = new Map();
  for (const registre of raw.toString('utf8').split('\0')) {
    if (!registre) continue;
    const m = /^([0-7]{6}) ([a-z]+) ([0-9a-f]{40,64})\t([\s\S]+)$/.exec(registre);
    if (!m) throw new Error('Inventari inicial compacte: resposta inesperada de git ls-tree');
    if (m[2] === 'blob' && dins(m[4])) out.set(m[4], { oid: m[3], kind: m[1] === '120000' ? 'symlink' : 'file' });
  }
  return out;
}
/** sha256 dels blobs indicats, per lots acotats; els enllaços simbòlics es resumixen com a l'observació. */
function hashesDeBlobs(root, oids, symlinks) {
  const unics = [...new Set(oids)], out = new Map();
  if (!unics.length) return out;
  const mides = gitLectura(root, ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], Buffer.from(`${unics.join('\n')}\n`));
  const linies = mides?.toString('ascii').trimEnd().split('\n') || [];
  if (linies.length !== unics.length) throw new Error('Inventari inicial compacte: el commit base té blobs absents');
  const mida = new Map(linies.map((linia, i) => {
    const m = /^([0-9a-f]{40,64}) blob (\d+)$/.exec(linia);
    if (!m || m[1] !== unics[i]) throw new Error('Inventari inicial compacte: blob absent o no regular al commit base');
    return [m[1], Number(m[2])];
  }));
  const llegeix = lot => {
    // Un blob més gran que el lot va sol: el buffer s'ajusta a la mida declarada, no al revés.
    const declarat = lot.reduce((suma, oid) => suma + mida.get(oid) + 160, 1024);
    const raw = gitLectura(root, ['cat-file', '--batch'], Buffer.from(`${lot.join('\n')}\n`), Math.max(declarat, LOT_BLOBS * 4));
    if (raw === null) throw new Error('Inventari inicial compacte: git cat-file ha fallat');
    let cursor = 0;
    for (const oid of lot) {
      const fi = raw.indexOf(10, cursor);
      if (fi < 0 || raw.subarray(cursor, fi).toString('ascii') !== `${oid} blob ${mida.get(oid)}`) throw new Error('Inventari inicial compacte: resposta inesperada de git cat-file');
      const bytes = raw.subarray(fi + 1, fi + 1 + mida.get(oid));
      out.set(oid, { file: sha(bytes), symlink: symlinks.has(oid) ? sha(`symlink:${bytes.toString('utf8')}`) : null });
      cursor = fi + 1 + mida.get(oid) + 1;
    }
  };
  let lot = [], bytes = 0;
  for (const oid of unics) {
    if (lot.length && bytes + mida.get(oid) > LOT_BLOBS) { llegeix(lot); lot = []; bytes = 0; }
    lot.push(oid); bytes += mida.get(oid);
  }
  if (lot.length) llegeix(lot);
  return out;
}
/** Inventari complet a partir del descriptor. Les rutes que encara casen amb el commit base prenen
    el hash de l'observació actual; la resta es llig del blob. L'empremta ho certifica tot o res. */
function reconstrueix(root, d, observat) {
  const out = {}, pendents = [];
  for (const [rel, b] of entradesBase(root, d)) {
    if (Object.hasOwn(d.diferencies, rel)) continue;
    const o = observat.get(rel);
    if (o && o.oid === b.oid && o.kind === b.kind) out[rel] = o.hash;
    else pendents.push([rel, b]);
  }
  const blobs = hashesDeBlobs(root, pendents.map(([, b]) => b.oid), new Set(pendents.filter(([, b]) => b.kind === 'symlink').map(([, b]) => b.oid)));
  for (const [rel, b] of pendents) out[rel] = blobs.get(b.oid)[b.kind];
  for (const [rel, hash] of Object.entries(d.diferencies)) if (hash !== null) out[rel] = hash;
  const resultat = ordenat(out);
  if (Object.keys(resultat).length !== d.fitxers || empremta(resultat) !== d.sha256) {
    throw new Error(`Inventari inicial compacte no reconstruïble: l'empremta no casa amb el commit base ${d.base.slice(0, 12)}`);
  }
  return resultat;
}
/** Inventari inicial d'un torn nou: compacte si l'arrel és un repositori amb HEAD; si no (còpia aïllada,
    fixture sense Git), el mapa complet de sempre. Una fallada inesperada també desa el complet, amb avís. */
function inventariInicialNou(root) {
  const git = baseGit(root);
  const observat = observa(root, { oid: git.algorisme ?? null });
  const complet = hashes(observat);
  if (!git.base) return complet;
  try {
    const d = { format: FORMAT_INVENTARI_INICIAL, base: git.base, arrels: [...ENTRADES_INVENTARI], omesos: [...OMESOS_INVENTARI], exclosos: [...EXCLOSOS_INVENTARI] };
    const base = entradesBase(root, d), diferencies = {};
    for (const [rel, o] of observat) { const b = base.get(rel); if (!b || b.oid !== o.oid || b.kind !== o.kind) diferencies[rel] = o.hash; }
    for (const rel of base.keys()) if (!observat.has(rel)) diferencies[rel] = null;
    const descriptor = { ...d, fitxers: Object.keys(complet).length, sha256: empremta(complet), diferencies: ordenat(diferencies) };
    reconstrueix(root, descriptor, observat); // autocomprovació: amb la mateixa observació no llig cap blob
    return descriptor;
  } catch (error) {
    process.emitWarning(`Inventari del torn desat complet: ${error.message}`, { code: 'SDP_INVENTARI_COMPACTE' });
    return complet;
  }
}
const esCompacte = initial => Object.hasOwn(initial, 'format');
function validaInventariInicial(d) {
  const llista = v => Array.isArray(v) && v.every(x => typeof x === 'string' && x && !x.split('/').includes('..'));
  const valors = d.diferencies && typeof d.diferencies === 'object' && !Array.isArray(d.diferencies)
    && Object.values(d.diferencies).every(v => v === null || (typeof v === 'string' && HASH.test(v)));
  if (d.format !== FORMAT_INVENTARI_INICIAL || typeof d.base !== 'string' || !OID.test(d.base) || !llista(d.arrels) || !llista(d.omesos)
    || !llista(d.exclosos) || !Number.isSafeInteger(d.fitxers) || d.fitxers < 0 || !HASH.test(d.sha256 || '') || !valors) {
    throw new Error('Inventari inicial del torn invàlid');
  }
}
const MEMORIA_INICIAL = new Map();
/** Inventari inicial complet d'un torn, siga quin siga el format del registre (llegat o compacte).
    `observat` és opcional: checkTurn hi passa l'observació que ja ha fet. */
export function inventariInicial(root, turn, { observat = null } = {}) {
  const d = turn.initial;
  if (!esCompacte(d)) return d;
  validaInventariInicial(d);
  const clau = `${canonical(root)}\0${d.base}\0${d.sha256}`;
  if (!MEMORIA_INICIAL.has(clau)) {
    MEMORIA_INICIAL.set(clau, Object.freeze(reconstrueix(root, d, observat || observa(root, { oid: algorismeDe(d.base) }))));
    if (MEMORIA_INICIAL.size > 8) MEMORIA_INICIAL.delete(MEMORIA_INICIAL.keys().next().value);
  }
  return MEMORIA_INICIAL.get(clau);
}
/** El segell desa els fitxers que el torn ha de poder acreditar (rebuts actius, pla i canvis respecte de
    l'inicial) i el certificat de l'inventari complet; els consumidors de verification.files no canvien. */
function verificacioCompacta(turn, initial, after) {
  const rellevants = new Set([...activeReceipts(turn).map(r => r.file), ...(turn.plan?.file ? [turn.plan.file] : [])]);
  const files = {};
  for (const rel of Object.keys(after).sort()) if (rellevants.has(rel) || after[rel] !== initial[rel]) files[rel] = after[rel];
  const absents = Object.keys(initial).filter(rel => !Object.hasOwn(after, rel)).sort();
  return { files, inventari: { format: FORMAT_INVENTARI_VERIFICAT, fitxers: Object.keys(after).length, sha256: empremta(after), absents } };
}
/** Inventari complet del segell. Llegat: verification.files tal qual. Compacte: inicial + fitxers − absents,
    amb les esmenes d'archive-links desfetes només per a comprovar l'empremta del segell. */
export function inventariVerificat(root, turn) {
  const v = turn.verification;
  if (!v?.files) return null;
  if (!v.inventari) return v.files;
  const c = v.inventari;
  if (c.format !== FORMAT_INVENTARI_VERIFICAT || !Array.isArray(c.absents) || !Number.isSafeInteger(c.fitxers) || !HASH.test(c.sha256 || '')) throw new Error('Inventari verificat del torn invàlid');
  const out = { ...inventariInicial(root, turn), ...v.files };
  for (const rel of c.absents) delete out[rel];
  const segell = { ...out };
  for (const ev of [...turn.history].reverse()) {
    if (ev?.action === 'archive-links' && typeof ev.file === 'string' && segell[ev.file] === ev.toHash) segell[ev.file] = ev.fromHash;
  }
  if (Object.keys(segell).length !== c.fitxers || empremta(segell) !== c.sha256) throw new Error('Inventari verificat del torn no reconstruïble: l\'empremta del segell no casa');
  return ordenat(out);
}

export function readTurn(root, id, { closed = false, expired = false, now = Date.now() } = {}) {
  const turn = json(recordPath(root, id));
  if (turn.turn_id !== id || turn.schema !== 'sdp.turn.v1' || !['opened', 'context_loaded', 'planned', 'verified', 'closed'].includes(turn.state)) throw new Error('Registre de torn invàlid');
  if (turn.state === 'closed' && !closed) throw new Error('Torn ja tancat');
  const expiry = Date.parse(turn.expiresAt);
  if (!Number.isFinite(expiry)) throw new Error('Caducitat de torn invàlida');
  if (!expired && turn.state !== 'closed' && expiry <= now) throw new Error('Torn caducat');
  if (!turn.receipts || typeof turn.receipts !== 'object' || Array.isArray(turn.receipts) || !turn.initial || typeof turn.initial !== 'object' || Array.isArray(turn.initial) || !Array.isArray(turn.history)) throw new Error('Registre de torn incomplet');
  // Un inventari llegat és un mapa de rutes; el compacte porta `format`, i un format desconegut no es llig.
  if (esCompacte(turn.initial)) validaInventariInicial(turn.initial);
  return turn;
}
function atomic(file, value) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, {flag:'wx', mode:0o600});
    fs.renameSync(tmp, file);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
export function mutateTurn(root, id, operation) {
  const file = recordPath(root, id), lock = `${file}.lock`;
  const fd = fs.openSync(lock, 'wx', 0o600);
  try {
    const turn = readTurn(root, id);
    const result = operation(turn);
    turn.revision += 1;
    turn.updatedAt = new Date().toISOString();
    atomic(file, turn);
    return result ?? turn;
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
function move(turn, state, action) {
  turn.state = state;
  turn.history.push({state, action, at:new Date().toISOString()});
}
export function openTurn(root, { actor = 'agent-local', scope = 'code' } = {}) {
  if (fs.existsSync(path.join(root, '.agents/SDP-LOCK'))) throw new Error('SDP-LOCK actiu');
  if (!['code', 'documents'].includes(scope)) throw new Error('Abast desconegut');
  const contract = loadContract(root, {templates:false});
  const turn_id = `torn_${randomUUID()}`;
  const now = new Date().toISOString();
  const turn = {schema:'sdp.turn.v1', turn_id, actor, scope, state:'opened', revision:0,
    createdAt:now, updatedAt:now, expiresAt:new Date(Date.now()+86400000).toISOString(),
    contractHash:contract.hash, humanInventoryVersion:1, initial:inventariInicialNou(root), receipts:{}, plan:null, verification:null,
    history:[{state:'opened', action:'open', at:now}]};
  const file = recordPath(root, turn_id);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, `${JSON.stringify(turn, null, 2)}\n`, {flag:'wx', mode:0o600});
  return turn;
}
// Els rebuts de context legacy no tenen fase de creació i conserven el contracte.
export function isActiveReceipt(receipt) {
  if (!Object.hasOwn(receipt, 'creation')) return true;
  const phase = receipt.creation;
  if (!phase || !['prepared', 'committed', 'failed'].includes(phase.state) || !Number.isFinite(Date.parse(phase.preparedAt))) throw new Error('Fase de creació del rebut invàlida');
  if (phase.state === 'failed' && (phase.absent !== true || !Number.isFinite(Date.parse(phase.failedAt)))) throw new Error('Absència de creació fallida no acreditada');
  if (phase.state === 'committed' && (!/^[a-f0-9]{64}$/.test(phase.documentHash || '') || !Number.isFinite(Date.parse(phase.committedAt)))) throw new Error('Creació consolidada sense empremta');
  return phase.state !== 'failed';
}
export function activeReceipts(turn) {
  return Object.values(turn.receipts).filter(receipt => {
    if (isActiveReceipt(receipt)) return true;
    if (!turn.history.some(event => event.action === 'create-failed' && event.receiptId === receipt.id && event.file === receipt.file && event.absent === true && event.at === receipt.creation.failedAt)) throw new Error('Creació fallida sense traça d’absència');
    return false;
  });
}

// Observació física per descriptor: mai llegim un symlink o un hardlink.
function creationFile(root, relative) {
  root = fs.realpathSync(root);
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Ruta de creació documental no regular');
  const parts = relative.split('/');
  const parents = () => {
    let current = root;
    for (const part of parts.slice(0, -1)) {
      current = path.join(current, part);
      try {
        const stat = fs.lstatSync(current);
        if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Ruta de creació documental no regular');
      } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
    }
    return true;
  };
  if (!parents()) return { exists: false };
  const file = path.join(root, relative);
  let named;
  try { named = fs.lstatSync(file); } catch (error) { if (error.code === 'ENOENT') return { exists: false }; throw error; }
  const regular = stat => stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1;
  if (!regular(named)) throw new Error('Ruta de creació documental no regular');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd);
    if (!regular(opened) || opened.dev !== named.dev || opened.ino !== named.ino) throw new Error('Ruta de creació documental substituïda');
    if (!parents()) throw new Error('Ruta de creació documental substituïda');
    const raw = fs.readFileSync(fd, 'utf8');
    if (!parents()) throw new Error('Ruta de creació documental substituïda');
    const after = fs.lstatSync(file), last = fs.fstatSync(fd);
    if (!regular(after) || !regular(last) || after.dev !== opened.dev || after.ino !== opened.ino) throw new Error('Ruta de creació documental substituïda');
    return { exists: true, raw };
  } finally { fs.closeSync(fd); }
}
function creationReceipt(turn, reflex) {
  const match = receiptPattern.exec(reflex || '');
  const receipt = match && match[1] === turn.turn_id && turn.receipts[match[2]];
  if (!receipt || receipt.creation?.state !== 'prepared') throw new Error('Creació sense rebut preparat');
  isActiveReceipt(receipt);
  return receipt;
}
export function commitCreation(root, id, reflex, raw) {
  return mutateTurn(root, id, turn => {
    const receipt = creationReceipt(turn, reflex);
    const observed = creationFile(root, receipt.file);
    const index = creationFile(root, `${DESK}/00_index_escriptori.md`);
    if (!observed.exists || observed.raw !== raw || parseDocument(raw).data.reflex !== reflex || !index.exists || !anchored(index.raw, receipt.file)) throw new Error('Creació pendent: fitxer, empremta o àncora divergent');
    const at = new Date().toISOString();
    receipt.creation = { ...receipt.creation, state: 'committed', committedAt: at, documentHash: sha(raw) };
    turn.verification = null;
    turn.history.push({ action: 'create-committed', receiptId: receipt.id, file: receipt.file, at, hash: sha(raw) });
  });
}
export function failCreation(root, id, reflex) {
  return mutateTurn(root, id, turn => {
    const receipt = creationReceipt(turn, reflex);
    if (creationFile(root, receipt.file).exists) throw new Error('Creació pendent: el fitxer encara existix');
    const at = new Date().toISOString();
    receipt.creation = { ...receipt.creation, state: 'failed', failedAt: at, absent: true };
    turn.verification = null;
    turn.history.push({ action: 'create-failed', receiptId: receipt.id, file: receipt.file, at, absent: true });
  });
}
export function deliverContext(root, id, {route:routeId, file, creation = false}) {
  const contract = loadContract(root, {route:routeId}), route = resolveRoute(contract, {route:routeId});
  const rel = relativePath(root, file);
  if (!(route.destins || [DESK]).some(dir=>rel.startsWith(`${dir}/`)) || humanZone(rel) || path.basename(rel) === '00_index_escriptori.md') throw new Error('Destí de document no autoritzat');
  if (!/^\d{6}_\d{4}_[a-z0-9_]+\.md$/.test(path.basename(rel))) throw new Error('Nom termodinàmic invàlid');
  // Convocar agents exigix taula neta també fora d'un hook; una auditoria pot
  // documentar una taula bruta. create revalida ací, encara que ja tinga context.
  let avisos = [];
  if (['prompt.local', 'prompt.consell'].includes(route.id)) {
    // 261009: també la convocatòria v4 de la porta Olivera. En fase «avis» no bloqueja: els
    // avisos tornen amb el context i document.mjs els escriu per stderr abans de redactar.
    const conv = checkConvocatoria(root, { fitxer: rel });
    const errors = [...checkTaula(root).errors, ...conv.errors];
    if (errors.length) throw new Error(`Convocatòria amb Escriptori brut:\n${errors.join('\n')}`);
    avisos = conv.avisos;
  }
  return mutateTurn(root, id, turn => {
    const receiptId = randomUUID();
    const receipt = {id:receiptId, route:route.id, routeVersion:route.version, file:rel,
      contractSnapshot:saveContract(root,contract), template:route.plantilla, templateHash:route.templateHash, issuedAt:new Date().toISOString()};
    if (creation) receipt.creation = {state:'prepared', preparedAt:new Date().toISOString()};
    turn.receipts[receiptId] = receipt;
    // New context invalidates verification, but retains an already bound plan.
    turn.verification = null;
    move(turn, turn.plan ? 'planned' : 'context_loaded', 'context');
    return {reflex:`sdp:${id}:${receiptId}`, route, template:route.templateText, avisos};
  });
}
export function validateDocument(root, content, file, { closed = false, readRecord, readSnapshot } = {}) {
  const errors = [];
  try {
    const parsed = parseDocument(content);
    const rel = relativePath(root, file);
    // The canonical desktop index is structural, never a substitute for a formal document.
    if (rel === `${DESK}/00_index_escriptori.md` && parsed.data.type === 'index') return validateSchema(parsed.data,loadContract(root,{templates:false}).schema);
    // Permanent knowledge has no per-turn receipt; the exception is one canonical path.
    if (exemptDeRebut(root, file) && parsed.data.type === 'document') return validateSchema(parsed.data,loadContract(root,{templates:false}).schema);
    const m = typeof parsed.data.reflex === 'string' && receiptPattern.exec(parsed.data.reflex);
    if (!m) {
      errors.push('reflex: cal un rebut persistent emés per document.mjs context');
      errors.push(...validateSchema(parsed.data, loadContract(root, {templates: false}).schema));
    } else {
      const turn = readRecord ? readRecord(m[1]) : readTurn(root, m[1], {closed});
      const receipt = turn.receipts[m[2]];
      if (!receipt || receipt.id !== m[2] || receipt.file !== rel) throw new Error('Rebut absent o vinculat a un altre document');
      if (!isActiveReceipt(receipt)) throw new Error('Rebut de creació fallida: no autoritza cap document');
      if (receipt.creation?.state === 'prepared') throw new Error('Rebut de creació pendent de consolidar');
      const contract = receipt.contractSnapshot ? readContract(root,receipt.contractSnapshot,readSnapshot) : loadContract(root,{route:receipt.route});
      if (!receipt.contractSnapshot && turn.contractHash !== contract.hash) throw new Error('Contracte del rebut caducat');
      errors.push(...validateSchema(parsed.data, contract.schema));
      const route = resolveRoute(contract, {route:receipt.route});
      if (receipt.templateHash !== route.templateHash || receipt.routeVersion !== route.version) throw new Error('Plantilla del rebut canviada');
      if (parsed.data.type !== route.tipus) errors.push('type: no correspon a la ruta del rebut');
      errors.push(...validateSections(parsed.body, route), ...validateRegister(parsed.body, contract));
      // Expiry only records administrative closure; legacy expiry hashes are not verification.
      if (turn.state === 'closed' && Array.isArray(turn.verification?.checks) && turn.verification.checks.length > 0 && turn.verification.checks.every(check => check === 'expire-close')) errors.push('Verificació invàlida: expire-close només acredita caducitat, no fitxers');
      if (turn.state === 'closed' && turn.verification?.files?.[rel] !== sha(content)) errors.push('Artefacte modificat després del tancament');
    }
  } catch (e) { errors.push(e.message); }
  return errors;
}
export function bindPlan(root, id, file) {
  const rel = relativePath(root, file);
  const raw = fs.readFileSync(path.join(root, rel), 'utf8');
  const parsed = parseDocument(raw);
  const contract = loadContract(root);
  const errors = validateSchema(parsed.data, contract.schema);
  if (errors.length || parsed.data.type !== 'document') throw new Error(`Pla invàlid: ${errors.join('; ')}`);
  if (!rel.startsWith(`${DESK}/`) || humanZone(rel)) throw new Error('El pla ha de viure a l’Escriptori');
  return mutateTurn(root, id, turn => {
    if (!activeReceipts(turn).length) throw new Error('Cal entregar context actiu abans de vincular el pla');
    turn.plan = {file:rel, hash:sha(raw)};
    turn.verification = null;
    move(turn, 'planned', 'bind-plan');
  });
}
export function checkTurn(root, id, {turn:provided} = {}) {
  const errors = [];
  const turn = provided || readTurn(root, id);
  const contract = loadContract(root,{templates:false});
  if (!Object.values(turn.receipts).every(r=>r.contractSnapshot) && turn.contractHash !== contract.hash) errors.push('Contracte canviat durant el torn');
  if (!turn.plan || !fs.existsSync(path.join(root,turn.plan.file)) || hashFile(path.join(root, turn.plan.file)) !== turn.plan.hash) errors.push(`Pla absent o modificat: ${turn.plan?.file || '(sense pla)'}`);
  if (!['planned', 'verified'].includes(turn.state)) errors.push('El torn encara no està planificat');
  const receipts = activeReceipts(turn);
  // Una sola observació serveix per a l'estat actual i, si el registre és compacte, per a reconstruir l'inicial.
  const observat = observa(root,{files:receipts.map(r=>r.file), oid:esCompacte(turn.initial) && typeof turn.initial.base === 'string' ? algorismeDe(turn.initial.base) : null});
  const current = hashes(observat), initial = inventariInicial(root, turn, {observat}), changed = changes(initial, current);
  // Explicit ownership avoids importing another agent's documents into this turn.
  // Human-zone and scope checks still use the complete repository delta.
  const owned = turn.ownedPaths ? new Set([...turn.ownedPaths,...receipts.map(r=>r.file)]) : null;
  const documents = new Set([...changed.filter(p=>!humanZone(p)).filter(p=>!turn.relocated?.includes(p)).filter(p=>!owned || owned.has(p)).filter(p => p.startsWith(`${DESK}/`) && p.endsWith('.md')),
    ...receipts.map(r => r.file)]);
  if (turn.scope === 'documents' && changed.some(p => /^(src|tooling|scripts|tests)\//.test(p) || /^package(?:-lock)?\.json$/.test(p))) errors.push('Canvis de codi fora de l’abast documental');
  for (const p of ['.agents/ESTAT.md', '.agents/LEDGER.md']) {
    if (current[p] === initial[p] || !fs.readFileSync(path.join(root,p),'utf8').includes(id)) errors.push(`${p}: falta el relleu d’aquest torn`);
  }
  const humanBefore=turn.humanBaseline?.files || (turn.humanInventoryVersion===1 ? Object.fromEntries(Object.entries(initial).filter(([p])=>humanZone(p))) : null);
  if(!humanBefore) errors.push('Vigilància humana sense inventari inicial; cal una migració explícita observada');
  else for(const file of changes(humanBefore,Object.fromEntries(Object.entries(current).filter(([p])=>humanZone(p))))) errors.push(`Zona humana modificada: ${file}`);
  // Una creació fallida no exigix un document absent; el seu reflex no pot
  // reaparéixer ni quedar ocult per ownership. Un context nou sí que pot usar el path.
  const blockedFailedFiles = new Set();
  for (const receipt of Object.values(turn.receipts)) {
    if (receipt.creation?.state === 'prepared') errors.push(`Creació pendent de consolidar: ${receipt.file}`);
    if (isActiveReceipt(receipt)) continue;
    let observed;
    try { observed = creationFile(root, receipt.file); }
    catch { errors.push(`Creació fallida amb ruta no regular: ${receipt.file}`); blockedFailedFiles.add(receipt.file); continue; }
    if (!observed.exists) continue;
    // El path només pot reaparéixer amb un altre rebut real, també si la nova
    // autoria és aliena al torn. Ownership no pot amagar un reflex inventat.
    errors.push(...validateDocument(root,observed.raw,receipt.file,{readRecord:otherId=>otherId===id?turn:readTurn(root,otherId,{closed:true})}).map(error=>`${receipt.file}: ${error}`));
  }
  const index = fs.readFileSync(path.join(root, DESK, '00_index_escriptori.md'),'utf8');
  for (const file of documents) {
    if (blockedFailedFiles.has(file)) continue;
    if (humanZone(file)) { errors.push(`Zona humana modificada: ${file}`); continue; }
    if (!fs.existsSync(path.join(root,file))) { errors.push(`Document eliminat sense relleu: ${file}`); continue; }
    const raw = fs.readFileSync(path.join(root,file),'utf8');
    errors.push(...validateDocument(root,raw,file,{readRecord:otherId=>otherId===id?turn:readTurn(root,otherId,{closed:true})}).map(e=>`${file}: ${e}`));
    if (file !== `${DESK}/00_index_escriptori.md` && !anchored(index,file)) errors.push(`Document sense àncora: ${file}`);
  }
  return {valid:errors.length===0, errors, current, changed, turn, initial};
}
export function sealTurn(root, id, runChecks, {close = false} = {}) {
  return mutateTurn(root, id, turn => {
    const checked = checkTurn(root, id, {turn});
    if (!checked.valid) throw new Error(checked.errors.join('\n'));
    const result = runChecks(turn);
    if (!result.valid) throw new Error(result.errors.join('\n'));
    const after = inventory(root,{files:activeReceipts(turn).map(r=>r.file)});
    if (changes(checked.current,after).length) throw new Error('La comprovació ha modificat fitxers o hi ha escriptura concurrent');
    turn.verification = {at:new Date().toISOString(), ...verificacioCompacta(turn, checked.initial, after), checks:result.checks};
    move(turn,'verified','verify');
    if (close) move(turn,'closed','close');
    return {valid:true, turn_id:id, state:turn.state, checks:result.checks};
  });
}

// Ownership is explicit; absence keeps the conservative legacy whole-tree check.
export function ownPaths(root,id,files) {
  const paths=files.map(file=>relativePath(root,file));
  if(paths.some(humanZone)) throw new Error('No es pot reclamar la zona humana');
  return mutateTurn(root,id,turn=>{
    turn.ownedPaths=[...new Set([...(turn.ownedPaths||[]),...paths])];
    turn.verification=null;
    turn.history.push({action:'own-paths',files:paths,at:new Date().toISOString()});
  });
}
// A handoff registers a move already performed; it never fabricates a past reading.
export function handoffDocument(root,id,from,to) {
  const source=relativePath(root,from), target=relativePath(root,to);
  if(humanZone(source)||humanZone(target)) throw new Error('Zona humana protegida');
  if(![DESK,CAMINS.actes,CAMINS.arxiuHistoric].some(dir=>target.startsWith(`${dir}/`))) throw new Error('Destí de relleu no autoritzat');
  if(fs.existsSync(path.join(root,source))) throw new Error('La ruta original encara existeix');
  const raw=fs.readFileSync(path.join(root,target),'utf8'), digest=sha(raw);
  const match=receiptPattern.exec(parseDocument(raw).data.reflex||'');
  if(!match||match[1]!==id) throw new Error('Identitat del relleu divergent');
  return mutateTurn(root,id,turn=>{
    const receipt=turn.receipts[match[2]];
    const prior = receipt?.file===target && receipt.moves?.find(move=>move.from===source && move.to===target && move.hash===digest);
    if(!receipt || (receipt.file!==source && !prior)) throw new Error('Rebut del relleu absent');
    if (!isActiveReceipt(receipt) || receipt.creation?.state === 'prepared') throw new Error('Rebut de relleu sense creació consolidada');
    if(turn.plan?.file===source && turn.plan.hash!==digest) throw new Error('Pla modificat durant el relleu');
    // El reflex identifica el rebut immutable que va fer nàixer el document.
    // Captura IDs exactes: un context posterior per a reutilitzar source no és
    // cap lectura d'este arxiu. Legacy: prefix d'emissió, sense fiar-se del rellotge.
    const emitted = Object.values(turn.receipts);
    const original = emitted.slice(0, emitted.indexOf(receipt)+1).filter(candidate=>
      isActiveReceipt(candidate) && candidate.file===source && candidate.route===receipt.route && candidate.contractSnapshot===receipt.contractSnapshot);
    const receiptIds = prior?.receiptIds || original.map(candidate=>candidate.id);
    for(const owned of emitted.filter(candidate=>isActiveReceipt(candidate) && candidate.file===source && receiptIds.includes(candidate.id))) {
      owned.file=target;
      owned.moves=[...(owned.moves||[]),{from:source,to:target,hash:digest,at:new Date().toISOString(),receiptIds}];
    }
    if(turn.plan?.file===source) turn.plan.file=target;
    turn.ownedPaths=[...new Set([...(turn.ownedPaths||[]).filter(p=>p!==source),target])];
    // Preserve source history, while recognising that its absence is an intentional handoff.
    turn.relocated=[...(turn.relocated||[]),source];
    turn.verification=null;
    move(turn,turn.plan?'planned':'context_loaded','handoff');
  });
}
export function protectedTurnFiles(root) {
  const dir=path.join(root,STORE), out=new Set();
  if(!fs.existsSync(dir)) return out;
  for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))) {
    const turn=json(path.join(dir,name));
    if(!turnPattern.test(turn.turn_id)||!Array.isArray(turn.history)||!turn.receipts) throw new Error(`Torn il·legible: ${name}`);
    // Closed receipts are protected too until an explicit archival handoff is supported.
    if(turn.plan?.file) out.add(turn.plan.file);
    for(const receipt of activeReceipts(turn)) out.add(receipt.file);
  }
  return out;
}

export function startHumanWatch(root,id) {
 return mutateTurn(root,id,turn=>{
  if(turn.humanInventoryVersion===1||turn.humanBaseline) throw new Error('Inventari humà ja establit; no es pot reiniciar');
  turn.humanBaseline={at:new Date().toISOString(),provenance:'observed-at-upgrade',files:Object.fromEntries(Object.entries(inventory(root)).filter(([file])=>humanZone(file)))};
  turn.history.push({action:'start-human-watch',at:turn.humanBaseline.at,note:'Observació actual; no acredita vigilància anterior ni autoria dels canvis previs.'});
 });
}

/** Reconeix canvis de la zona humana aprovats pel Mestre. Un torn amb `humanInventoryVersion: 1` sense
 * `humanBaseline` usa la mateixa referència que checkTurn: la zona humana de l'inventari inicial.
 * `files` és obligatori i no buit en tots els camins: el conjunt canviat ha de ser exactament eixe
 * (cap altre canvi humà queda reconegut de retruc, i no hi ha cap mode «reconeix-ho tot»). */
export function acknowledgeHumanZoneChanges(root, id, note = 'Reconeixement explícit de canvis a la zona humana', { files = null } = {}) {
  if (!Array.isArray(files) || !files.length) throw new Error('Cal declarar la llista exacta de fitxers humans aprovats pel Mestre');
  return mutateTurn(root, id, turn => {
    const before = turn.humanBaseline?.files
      || (turn.humanInventoryVersion === 1 ? Object.fromEntries(Object.entries(inventariInicial(root, turn)).filter(([file]) => humanZone(file))) : null);
    if (!before) throw new Error('No hi ha vigilància humana activa al torn');
    const currentHumanZone = Object.fromEntries(Object.entries(inventory(root)).filter(([file]) => humanZone(file)));
    const changedFiles = changes(before, currentHumanZone);
    if (!changedFiles.length) throw new Error('No hi ha canvis a la zona humana per a reconéixer');
    const esperats = [...new Set(files.map(file => relativePath(root, file)))].sort();
    if (JSON.stringify([...changedFiles].sort()) !== JSON.stringify(esperats)) {
      throw new Error(`Canvis humans divergents del reconeixement: observats ${[...changedFiles].sort().join(', ')}; declarats ${esperats.join(', ')}`);
    }
    const at = new Date().toISOString();
    turn.humanBaseline = { at, provenance: 'acknowledged', files: currentHumanZone };
    turn.verification = null;
    turn.history.push({ action: 'acknowledge-human-zone-changes', files: changedFiles, at, note });
  });
}

/** Rastre de torns de l'arxivat amb enllaços (B1 · 261101, porta-olivera.mjs --arxiva).
 * L'única esmena admesa a la història tancada: verification.files[rel] del torn del rebut
 * propi d'un document reescrit, amb la preimatge comprovada; verification.at i checks no es
 * toquen i no es fabrica cap verificació. Als torns oberts: plan.hash i relocated. Pren els
 * locks de torn, revalida el pla, crida aplica() i escriu els registres; si res falla,
 * restaura els registres ja escrits (CAS) i crida desfes(). Sense imports nous.
 */
export function ambTornsArxiu(root, pla, aplica, desfes) {
  const { tancats = [], plans = [], relocated = [], autor = null } = pla.torns || {};
  const ambEfectes = (pla.reescriptures || []).length > 0 || tancats.length > 0 || plans.length > 0 || relocated.length > 0;
  const ids = [...new Set([...tancats.map(x => x.id), ...plans.map(x => x.id), ...relocated.map(x => x.id), ...(autor && ambEfectes ? [autor] : [])])].sort();
  const desti = Object.fromEntries((pla.moviments || []).map(m => [m.rel, m.desti]));
  const locks = [], escrits = [];
  const restaura = (file, raw) => {
    const tmp = `${file}.${randomUUID()}.tmp`;
    try { fs.writeFileSync(tmp, raw, { flag: 'wx', mode: 0o600 }); fs.renameSync(tmp, file); }
    finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
  };
  try {
    for (const id of ids) {
      const file = recordPath(root, id);
      try { locks.push({ lock: `${file}.lock`, fd: fs.openSync(`${file}.lock`, 'wx', 0o600) }); }
      catch (error) { if (error.code === 'EEXIST') throw new Error(`Torn ocupat: ${id} (${STORE}/${id}.json.lock). No s'ha mogut res.`); throw error; }
    }
    const ara = Date.now();
    const registres = ids.map(id => {
      const file = recordPath(root, id), raw = fs.readFileSync(file, 'utf8');
      const turn = readTurn(root, id, { closed: true, expired: true });
      if (JSON.stringify(JSON.parse(raw)) !== JSON.stringify(turn)) throw new Error(`Torn ${id} canviat durant la lectura. No s'ha mogut res.`);
      return { id, file, raw, turn, obert: turn.state !== 'closed', vigent: turn.state !== 'closed' && Date.parse(turn.expiresAt) > ara };
    });
    const canviat = (id, que) => new Error(`El torn ${id} ha canviat des del pla (${que}). No s'ha mogut res: torna a executar --arxiva, primer amb --sec.`);
    // Revalidació de cada precondició del pla, amb els locks presos i abans de moure res.
    for (const r of registres) {
      const { id, turn } = r;
      for (const x of tancats.filter(t => t.id === id)) {
        const checks = turn.verification?.checks;
        const genuina = Array.isArray(checks) && checks.length > 0 && !checks.every(c => c === 'expire-close');
        const rebut = Object.values(turn.receipts).some(rec => rec.file === x.rel && isActiveReceipt(rec));
        if (r.obert || !genuina || !rebut || turn.verification?.files?.[x.rel] !== x.de) throw canviat(id, x.rel);
      }
      for (const x of plans.filter(p => p.id === id)) if (!r.vigent || turn.plan?.file !== x.rel || turn.plan.hash !== x.de) throw canviat(id, `pla ${x.rel}`);
      if ((relocated.some(x => x.id === id) || id === autor) && !r.vigent) throw canviat(id, 'ja no és obert i vigent');
    }
    let resultat;
    try { resultat = aplica(); }
    catch (error) {
      try { desfes(); } catch (e) { error.message += `\nDesfer incomplet: ${e.message}`; }
      throw error;
    }
    const at = new Date().toISOString();
    const moves = (pla.moviments || []).map(m => ({ from: m.rel, to: m.desti }));
    const escritsDoc = resultat?.escrits || [];
    for (const r of registres) {
      const { id, turn } = r;
      for (const x of tancats.filter(t => t.id === id)) {
        turn.verification.files[x.rel] = x.a;
        turn.history.push({ action: 'archive-links', at, by: autor, file: x.rel, fromHash: x.de, toHash: x.a, moves, replacements: x.substitucions });
      }
      const pl = plans.find(p => p.id === id);
      const rels = relocated.find(x => x.id === id)?.rels || [];
      if (pl) turn.plan.hash = pl.a;
      if (rels.length) turn.relocated = [...new Set([...(turn.relocated || []), ...rels])];
      if (pl || rels.length) {
        const ev = { action: 'archive-links', at, by: autor };
        if (pl) ev.plan = { file: pl.rel, fromHash: pl.de, toHash: pl.a };
        if (rels.length) ev.relocated = rels.map(rel => ({ from: rel, to: desti[rel] }));
        if (turn.state === 'verified') { turn.state = 'planned'; ev.state = 'planned'; }
        turn.history.push(ev);
      }
      if (id === autor && ambEfectes) {
        turn.history.push({ action: 'archive-links', role: 'autor', at,
          moves: (pla.moviments || []).map(m => ({ from: m.rel, to: m.desti, hash: m.hash })),
          rewrites: escritsDoc.map(e => ({ file: e.rel, fromHash: sha(e.abans), toHash: sha(e.despres), links: e.enllacos })),
          amended: tancats.map(x => ({ turn: x.id, file: x.rel })), relocatedIn: relocated.map(x => x.id) });
        if (turn.state === 'verified') turn.state = 'planned';
      }
      if (r.obert) turn.verification = null;
      turn.revision += 1;
      turn.updatedAt = at;
    }
    try {
      for (const r of registres) { atomic(r.file, r.turn); escrits.push(r); }
    } catch (error) {
      const fallades = [];
      for (const r of [...escrits].reverse()) {
        try {
          if (fs.readFileSync(r.file, 'utf8') !== `${JSON.stringify(r.turn, null, 2)}\n`) throw new Error(`registre canviat: ${r.id}`);
          restaura(r.file, r.raw);
        } catch (e) { fallades.push(e.message); }
      }
      try { desfes(); } catch (e) { fallades.push(e.message); }
      if (fallades.length) error.message += `\nDesfer incomplet: ${fallades.join('; ')}`;
      throw error;
    }
    return { ...resultat, torns: registres.map(r => ({ id: r.id, estat: r.turn.state })) };
  } finally {
    for (const { lock, fd } of locks.reverse()) { fs.closeSync(fd); try { fs.unlinkSync(lock); } catch { /* ja no hi és */ } }
  }
}
