#!/usr/bin/env node
/** Close expired turns as abandonment, never as file verification. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { canonical, turnPattern } from '../documental/core.mjs';
import { readTurn } from '../documental/turns.mjs';

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
function escriuAtomic(abs, valor, abans, identity) {
  const tmp = `${abs}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(valor, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    const actual = regular(abs);
    if (actual.dev !== identity.dev || actual.ino !== identity.ino || fs.readFileSync(abs, 'utf8') !== abans) throw new Error('CAS divergent en el torn');
    fs.renameSync(tmp, abs);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
export function esTornCaducat(torn, ara = Date.now()) {
  if (!torn || typeof torn !== 'object' || Array.isArray(torn) || torn.state === 'closed') return false;
  const expira = dataCanonica(torn.expiresAt);
  return Number.isSafeInteger(ara) && expira !== null && expira < ara;
}

/** The same per-turn lock as mutateTurn; dry-run does not write even a lock. */
export function sanejaTornsCaducats(arrel = arrelSegura(), { ara = Date.now(), sec = false } = {}) {
  if (!Number.isSafeInteger(ara) || !Number.isFinite(new Date(ara).getTime())) throw new Error('Rellotge invàlid');
  arrel = fs.realpathSync(arrel);
  const dir = path.join(arrel, DIR_TORNS);
  const resultat = { total: 0, tancatsAra: 0, jaTancats: 0, vius: 0, omesosLock: 0, idsTancats: [], transicions: [], errors: [] };
  if (!fs.existsSync(dir)) return { ...resultat, valid: true };
  if (canonical(dir) !== dir) throw new Error('Directori de torns amb symlink');
  const noms = fs.readdirSync(dir).filter((nom) => FITXER_TORN.test(nom)).sort();
  resultat.total = noms.length;
  const isoAra = new Date(ara).toISOString();
  for (const nom of noms) {
    const abs = path.join(dir, nom), lock = `${abs}.lock`, id = nom.slice(0, -'.json'.length);
    let fd;
    try {
      if (!turnPattern.test(id)) throw new Error('Identificador de torn invàlid');
      if (sec) {
        if (fs.existsSync(lock)) { resultat.omesosLock += 1; continue; }
      } else {
        try { fd = fs.openSync(lock, 'wx', 0o600); }
        catch (error) { if (error.code === 'EEXIST') { resultat.omesosLock += 1; continue; } throw error; }
      }
      const identity = regular(abs), abans = fs.readFileSync(abs, 'utf8');
      // Expired reads are explicit; all ordinary readers retain fail-closed expiry.
      const torn = readTurn(arrel, id, { closed: true, expired: true, now: ara });
      if (torn.closure?.schema === 'sdp.turn-expiry.v1') verificaTracaCaducitat(arrel, torn.closure.audit);
      if (torn.state === 'closed') { resultat.jaTancats += 1; continue; }
      if (dataCanonica(torn.expiresAt) === null) throw new Error('Caducitat de torn no canònica');
      if (!esTornCaducat(torn, ara)) { resultat.vius += 1; continue; }
      if (!sec) {
        const estatPrevi = torn.state;
        torn.state = 'closed';
        torn.revision = (Number.isInteger(torn.revision) ? torn.revision : 0) + 1;
        torn.updatedAt = isoAra;
        const preimageSHA256 = sha(abans), documents = documentsObservats(arrel, torn.receipts);
        const audit = `.agents/runtime/turn-expiry/${preimageSHA256}-${ara}.json`;
        torn.closure = { reason: 'expired', at: isoAra, previousState: estatPrevi,
          schema: 'sdp.turn-expiry.v1', expiresAt: torn.expiresAt, preimageSHA256, audit, documents };
        torn.history.push({ state: 'closed', action: 'expire-close', previousState: estatPrevi, at: isoAra });
        // Preserve any genuine prior verification byte-for-byte; never create/re-hash it.
        const postimage = serialitza(torn);
        if (Buffer.byteLength(postimage, 'utf8') > MAX_REGISTRE) throw new Error('Postimatge de caducitat excedix el pressupost');
        const postimageSHA256 = sha(postimage);
        // The trace is prepared before the CAS write. An interrupted attempt is
        // visible, never a receipt, verification or exemption from any gate.
        desaTraca(arrel, audit, { schema: 'sdp.turn-expiry.audit.v1', turn_id: id, at: isoAra,
          file: `${DIR_TORNS}/${nom}`, preimageSHA256, postimageSHA256, preimage: abans, documents,
          meaning: 'Abandonament per caducitat; no acredita treball ni tancament documental verificat.' });
        escriuAtomic(abs, torn, abans, identity);
        resultat.transicions.push({ id, file: `${DIR_TORNS}/${nom}`, audit, preimageSHA256, postimageSHA256,
          previousState: estatPrevi, state: 'closed', reason: 'expired', at: isoAra });
      }
      resultat.tancatsAra += 1;
      resultat.idsTancats.push(id);
    } catch (error) { resultat.errors.push({ file: `${DIR_TORNS}/${nom}`, error: error.message }); }
    finally { if (fd !== undefined) { fs.closeSync(fd); fs.unlinkSync(lock); } }
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
  const expected = { ...before, state: 'closed', revision: (Number.isInteger(before.revision) ? before.revision : 0) + 1, updatedAt: audit.at,
    closure: { reason: 'expired', at: audit.at, previousState: before.state, schema: 'sdp.turn-expiry.v1',
      expiresAt: before.expiresAt, preimageSHA256: audit.preimageSHA256, audit: relative, documents: audit.documents },
    history: [...before.history, { state: 'closed', action: 'expire-close', previousState: before.state, at: audit.at }] };
  // Property order does not determine identity of the transition; exact postimage
  // bytes are independently bound by the SHA below.
  const currentPath = path.join(arrel, audit.file); regular(currentPath);
  const current = fs.readFileSync(currentPath, 'utf8'), record = JSON.parse(current);
  if (sha(current) !== audit.postimageSHA256 || sha(serialitza(expected)) !== audit.postimageSHA256
    || record.closure?.audit !== relative) throw new Error('Postimatge de caducitat divergent');
  return { valid: true, id: audit.turn_id, file: audit.file, audit: relative, at: audit.at,
    preimageSHA256: audit.preimageSHA256, postimageSHA256: audit.postimageSHA256,
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
