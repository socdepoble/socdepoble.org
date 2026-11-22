#!/usr/bin/env node
/** Close expired turns as abandonment, never as file verification. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { canonical, turnPattern } from '../documental/core.mjs';
import { readTurn } from '../documental/turns.mjs';
import { ESTAT_BASE_EFIMERA, validaSolicitudBaseEfimera, comprovaBaseEfimera, validaTracaBaseEfimera } from './base-efimera.mjs';

const DIR_TORNS = '.agents/runtime/turns';
const FITXER_TORN = /^torn_.*\.json$/;
const MAX_REGISTRE = 8 * 1024 * 1024;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const serialitza = value => `${JSON.stringify(value, null, 2)}\n`;
function dataCanonica(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return null;
  const n = Date.parse(value), normalized = value.slice(0, 19) + '.' + (value.slice(19, -1).slice(1) || '').padEnd(3, '0') + 'Z';
  return Number.isFinite(n) && new Date(n).toISOString() === normalized ? n : null;
}
function directoriRegular(root, relative) {
  let abs = root;
  for (const part of relative.split('/')) {
    abs = path.join(abs, part);
    if (!fs.existsSync(abs)) fs.mkdirSync(abs, { mode: 0o700 });
    const st = fs.lstatSync(abs);
    if (!st.isDirectory() || st.isSymbolicLink() || canonical(abs) !== abs) throw new Error('Directori de traça no regular');
  }
  return abs;
}
function documentsObservats(root, receipts) {
  const files = [...new Set(Object.values(receipts).map(r => r?.file).filter(f => typeof f === 'string'))].sort();
  const result = {};
  for (const relative of files) {
    if (path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Document del rebut fora de ruta');
    const abs = path.join(root, relative);
    try { regular(abs); result[relative] = sha(fs.readFileSync(abs)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; result[relative] = null; }
  }
  return result;
}
function desaTraca(root, relative, value) {
  const abs = path.join(root, relative), raw = serialitza(value);
  if (Buffer.byteLength(raw, 'utf8') > MAX_REGISTRE) throw new Error('Traça de caducitat excedix el pressupost');
  directoriRegular(root, path.dirname(relative));
  if (fs.existsSync(abs)) {
    regular(abs);
    if (fs.readFileSync(abs, 'utf8') !== raw) throw new Error('Traça de caducitat divergent');
  } else fs.writeFileSync(abs, raw, { flag: 'wx', mode: 0o600 });
}


function regular(abs) {
  const stat = fs.lstatSync(abs);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > MAX_REGISTRE || canonical(abs) !== abs) throw new Error('Registre no regular');
  return stat;
}
function mateixaIdentitat(actual, expected) {
  return actual.dev === expected.dev && actual.ino === expected.ino && actual.mode === expected.mode
    && actual.size === expected.size && actual.mtimeMs === expected.mtimeMs && actual.ctimeMs === expected.ctimeMs;
}
function comprovaPany(lock, fd, identity) {
  if (!identity || !mateixaIdentitat(fs.fstatSync(fd), identity) || !mateixaIdentitat(regular(lock), identity))
    throw new Error('Pany substituït abans del commit: no es tanca el torn');
}
/** Descriptor reads do not follow a substituted final symlink; the name and
 * parents are rechecked after reading, immediately before committing. A writer
 * ignoring the cooperative lock can still race the final check and rename. */
function comprovaPreimatge(abs, abans, identity) {
  if (!mateixaIdentitat(regular(abs), identity)) throw new Error('CAS divergent en el torn');
  const fd = fs.openSync(abs, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    if (!mateixaIdentitat(fs.fstatSync(fd), identity)) throw new Error('CAS divergent en el torn');
    const raw = fs.readFileSync(fd, 'utf8');
    if (raw !== abans || !mateixaIdentitat(fs.fstatSync(fd), identity)
        || !mateixaIdentitat(regular(abs), identity)) throw new Error('CAS divergent en el torn');
  } finally { fs.closeSync(fd); }
}
function escriuAtomic(abs, valor, abans, identity, revalida = null, pany = null) {
  const tmp = `${abs}.${randomUUID()}.tmp`;
  let fd, temporal, failure;
  try {
    // Check again before creating a temporary: a substituted parent must not
    // redirect even a prepared postimage outside the turn store.
    if (pany) pany();
    comprovaPreimatge(abs, abans, identity);
    fd = fs.openSync(tmp, 'wx', 0o600);
    temporal = fs.fstatSync(fd);
    fs.fchmodSync(fd, identity.mode & 0o777);
    fs.writeFileSync(fd, `${JSON.stringify(valor, null, 2)}\n`);
    fs.fsyncSync(fd);
    if (revalida) revalida();
    if (pany) pany();
    const prepared = regular(tmp);
    if (prepared.dev !== temporal.dev || prepared.ino !== temporal.ino) throw new Error('Temporal del torn substituït');
    comprovaPreimatge(abs, abans, identity);
    if (pany) pany();
    fs.renameSync(tmp, abs);
  } catch (error) { failure = error; throw error; }
  finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (temporal) {
      try {
        const current = fs.lstatSync(tmp);
        if (current.dev !== temporal.dev || current.ino !== temporal.ino || canonical(tmp) !== tmp)
          throw new Error('Temporal propi no retirat: ruta o identitat substituïda');
        fs.unlinkSync(tmp);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          if (failure) failure.message += `; ${error.message}`;
          else throw error;
        }
      }
    }
  }
}
export function esTornCaducat(torn, ara = Date.now()) {
  if (!torn || typeof torn !== 'object' || Array.isArray(torn) || torn.state === 'closed') return false;
  const expira = dataCanonica(torn.expiresAt);
  return Number.isSafeInteger(ara) && expira !== null && expira < ara;
}

/** The same per-turn lock as mutateTurn; dry-run does not write even a lock. */
export function sanejaTornsCaducats(arrel = arrelSegura(), { ara = Date.now(), sec = false, ephemeral = null } = {}) {
  if (!Number.isSafeInteger(ara) || !Number.isFinite(new Date(ara).getTime())) throw new Error('Rellotge invàlid');
  arrel = fs.realpathSync(arrel);
  const request = ephemeral === null ? null : validaSolicitudBaseEfimera(ephemeral);
  const dir = path.join(arrel, DIR_TORNS);
  const resultat = { total: 0, tancatsAra: 0, jaTancats: 0, vius: 0, omesosLock: 0, idsTancats: [], transicions: [], diagnostics: [], errors: [] };
  if (!fs.existsSync(dir)) {
    if (request) resultat.errors.push({ file: `${DIR_TORNS}/${request.turnId}.json`, error: 'Torn sol·licitat absent' });
    return { ...resultat, valid: resultat.errors.length === 0 };
  }
  if (canonical(dir) !== dir) throw new Error('Directori de torns amb symlink');
  const noms = request ? [`${request.turnId}.json`] : fs.readdirSync(dir).filter((nom) => FITXER_TORN.test(nom)).sort();
  resultat.total = noms.length;
  const isoAra = new Date(ara).toISOString();
  for (const nom of noms) {
    const abs = path.join(dir, nom), lock = `${abs}.lock`, id = nom.slice(0, -'.json'.length);
    let fd, lockIdentity;
    try {
      if (!turnPattern.test(id)) throw new Error('Identificador de torn invàlid');
      if (sec) {
        if (fs.existsSync(lock)) { resultat.omesosLock += 1; continue; }
      } else {
        try { fd = fs.openSync(lock, 'wx', 0o600); lockIdentity = fs.fstatSync(fd); }
        catch (error) { if (error.code === 'EEXIST') { resultat.omesosLock += 1; continue; } throw error; }
      }
      const identity = regular(abs), abans = fs.readFileSync(abs, 'utf8');
      // Expired reads are explicit; all ordinary readers retain fail-closed expiry.
      const torn = readTurn(arrel, id, { closed: true, expired: true, now: ara });
      if (torn.closure?.schema === 'sdp.turn-expiry.v1') verificaTracaCaducitat(arrel, torn.closure.audit);
      if (torn.state === 'closed') {
        if (request && (torn.closure?.initialInventory?.status !== ESTAT_BASE_EFIMERA
            || torn.closure.preimageSHA256 !== request.sha256 || torn.closure.initialInventory.base !== request.base
            || torn.closure.initialInventory.reason !== request.reason)) throw new Error('El torn ja estava tancat amb una altra reconciliació');
        resultat.jaTancats += 1; continue;
      }
      if (request && sha(abans) !== request.sha256) throw new Error('SHA-256 de la preimatge divergent');
      if (dataCanonica(torn.expiresAt) === null) throw new Error('Caducitat de torn no canònica');
      if (!esTornCaducat(torn, ara)) {
        resultat.vius += 1;
        if (request) throw new Error('Torn encara viu: no s’admet una reconciliació administrativa anticipada');
        continue;
      }
      const initialInventory = request ? comprovaBaseEfimera(arrel, torn, request) : null;
      if (initialInventory) resultat.diagnostics.push({ id, state: torn.state, expiresAt: torn.expiresAt, preimageSHA256: sha(abans), initialInventory });
      if (!sec) {
        const pany = () => comprovaPany(lock, fd, lockIdentity);
        pany();
        const estatPrevi = torn.state;
        torn.state = 'closed';
        torn.revision = (Number.isInteger(torn.revision) ? torn.revision : 0) + 1;
        torn.updatedAt = isoAra;
        const preimageSHA256 = sha(abans), documents = documentsObservats(arrel, torn.receipts);
        const audit = `.agents/runtime/turn-expiry/${preimageSHA256}-${ara}.json`;
        torn.closure = { reason: 'expired', at: isoAra, previousState: estatPrevi,
          schema: 'sdp.turn-expiry.v1', expiresAt: torn.expiresAt, preimageSHA256, audit, documents,
          ...(initialInventory && { initialInventory }) };
        torn.history.push({ state: 'closed', action: 'expire-close', previousState: estatPrevi, at: isoAra });
        // Preserve any genuine prior verification byte-for-byte; never create/re-hash it.
        const postimage = serialitza(torn);
        if (Buffer.byteLength(postimage, 'utf8') > MAX_REGISTRE) throw new Error('Postimatge de caducitat excedix el pressupost');
        const postimageSHA256 = sha(postimage);
        // The trace is prepared before the CAS write. An interrupted attempt is
        // visible, never a receipt, verification or exemption from any gate.
        desaTraca(arrel, audit, { schema: 'sdp.turn-expiry.audit.v1', turn_id: id, at: isoAra,
          file: `${DIR_TORNS}/${nom}`, preimageSHA256, postimageSHA256, preimage: abans, documents,
          ...(initialInventory && { initialInventory }),
          meaning: 'Abandonament per caducitat; no acredita treball ni tancament documental verificat.' });
        escriuAtomic(abs, torn, abans, identity, request ? () => {
          const current = readTurn(arrel, id, { closed: true, expired: true, now: ara });
          if (!esTornCaducat(current, ara) || current.state !== estatPrevi || sha(fs.readFileSync(abs)) !== request.sha256)
            throw new Error('CAS divergent: estat, hash o caducitat renovats durant la reconciliació');
          comprovaBaseEfimera(arrel, current, request);
        } : null, pany);
        resultat.transicions.push({ id, file: `${DIR_TORNS}/${nom}`, audit, preimageSHA256, postimageSHA256,
          previousState: estatPrevi, state: 'closed', reason: 'expired', at: isoAra });
      }
      resultat.tancatsAra += 1;
      resultat.idsTancats.push(id);
    } catch (error) { resultat.errors.push({ file: `${DIR_TORNS}/${nom}`, error: error.message }); }
    finally {
      if (fd !== undefined) {
        fs.closeSync(fd);
        try {
          const named = fs.lstatSync(lock);
          if (named.dev !== lockIdentity.dev || named.ino !== lockIdentity.ino || canonical(lock) !== lock)
            throw new Error('Pany substituït: no es retira un fitxer alié');
          fs.unlinkSync(lock);
        } catch (error) { resultat.errors.push({ file: `${DIR_TORNS}/${nom}.lock`, error: error.message }); }
      }
    }
  }
  if (!sec) resultat.jaTancats += resultat.tancatsAra;
  return { ...resultat, valid: resultat.errors.length === 0 && resultat.omesosLock === 0 };
}

/** Verify exact before/after bytes and the only admitted administrative transition.
 * Local SHA-256 is an integrity link, not proof of who operated the machine. */
export function verificaTracaCaducitat(arrel, relative) {
  arrel = fs.realpathSync(arrel);
  if (typeof relative !== 'string' || !/^\.agents\/runtime\/turn-expiry\/[a-f0-9]{64}-[0-9]+\.json$/.test(relative)) throw new Error('Ruta de traça invàlida');
  const abs = path.join(arrel, relative); regular(abs);
  const audit = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (audit.schema !== 'sdp.turn-expiry.audit.v1' || !turnPattern.test(audit.turn_id)
    || audit.file !== `${DIR_TORNS}/${audit.turn_id}.json` || typeof audit.preimage !== 'string'
    || sha(audit.preimage) !== audit.preimageSHA256) throw new Error('Preimatge de caducitat invàlida');
  const at = dataCanonica(audit.at), before = JSON.parse(audit.preimage);
  if (at === null || before.turn_id !== audit.turn_id || before.schema !== 'sdp.turn.v1'
    || !['opened', 'context_loaded', 'planned', 'verified'].includes(before.state)
    || !Array.isArray(before.history) || !esTornCaducat(before, at)
    || relative !== `.agents/runtime/turn-expiry/${audit.preimageSHA256}-${at}.json`) throw new Error('Transició de caducitat invàlida');
  if (!audit.documents || typeof audit.documents !== 'object' || Array.isArray(audit.documents)
    || Object.values(audit.documents).some(v => v !== null && (typeof v !== 'string' || !/^[a-f0-9]{64}$/.test(v)))) throw new Error('Inventari de documents de caducitat invàlid');
  const expectedFiles = [...new Set(Object.values(before.receipts ?? {}).map(r => r?.file).filter(f => typeof f === 'string'))].sort();
  if (JSON.stringify(Object.keys(audit.documents).sort()) !== JSON.stringify(expectedFiles)) throw new Error('Inventari de documents de caducitat divergent');
  const initialInventory = Object.hasOwn(audit, 'initialInventory') ? validaTracaBaseEfimera(before, audit.initialInventory) : null;
  const expected = { ...before, state: 'closed', revision: (Number.isInteger(before.revision) ? before.revision : 0) + 1, updatedAt: audit.at,
    closure: { reason: 'expired', at: audit.at, previousState: before.state, schema: 'sdp.turn-expiry.v1',
      expiresAt: before.expiresAt, preimageSHA256: audit.preimageSHA256, audit: relative, documents: audit.documents,
      ...(initialInventory && { initialInventory }) },
    history: [...before.history, { state: 'closed', action: 'expire-close', previousState: before.state, at: audit.at }] };
  // Property order does not determine identity of the transition; exact postimage
  // bytes are independently bound by the SHA below.
  const currentPath = path.join(arrel, audit.file); regular(currentPath);
  const current = fs.readFileSync(currentPath, 'utf8'), record = JSON.parse(current);
  if (sha(current) !== audit.postimageSHA256 || sha(serialitza(expected)) !== audit.postimageSHA256
    || record.closure?.audit !== relative) throw new Error('Postimatge de caducitat divergent');
  return { valid: true, id: audit.turn_id, file: audit.file, audit: relative, at: audit.at,
    preimageSHA256: audit.preimageSHA256, postimageSHA256: audit.postimageSHA256,
    ...(initialInventory && { initialInventory }),
    noCertifica: ['Autoria de la transició', 'Execució o verificació del treball', 'Validesa dels documents del torn'] };
}
function main() {
  const sec = process.argv.includes('--sec') || process.argv.includes('--dry-run');
  const resultat = sanejaTornsCaducats(arrelSegura(), { sec });
  if (process.argv.includes('--json')) console.log(JSON.stringify(resultat, null, 2));
  else {
    console.log(`🧹 [Torns] ${resultat.tancatsAra} torns caducats ${sec ? 'candidats' : "marcats com a closed"} (${resultat.jaTancats}/${resultat.total} tancats, ${resultat.vius} vius, ${resultat.omesosLock} bloquejats, ${resultat.errors.length} errors)`);
    for (const error of resultat.errors) console.error(`${error.file}: ${error.error}`);
  }
  if (!resultat.valid) process.exitCode = 1;
}
if (esMain(import.meta.url)) {
  try { main(); } catch (error) { console.error(`❌ [Torns] ${error.message}`); process.exitCode = 1; }
}
