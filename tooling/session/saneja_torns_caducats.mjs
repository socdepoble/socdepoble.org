#!/usr/bin/env node
/** Close expired turns as abandonment, never as file verification. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { canonical, turnPattern } from '../documental/core.mjs';
import { readTurn } from '../documental/turns.mjs';

const DIR_TORNS = '.agents/runtime/turns';
const FITXER_TORN = /^torn_.*\.json$/;

function regular(abs) {
  const stat = fs.lstatSync(abs);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || canonical(abs) !== abs) throw new Error('Registre no regular');
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
  const expira = Date.parse(torn.expiresAt);
  return Number.isFinite(expira) && expira <= ara;
}

/** The same per-turn lock as mutateTurn; dry-run does not write even a lock. */
export function sanejaTornsCaducats(arrel = arrelSegura(), { ara = Date.now(), sec = false } = {}) {
  arrel = fs.realpathSync(arrel);
  const dir = path.join(arrel, DIR_TORNS);
  const resultat = { total: 0, tancatsAra: 0, jaTancats: 0, vius: 0, omesosLock: 0, idsTancats: [], errors: [] };
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
      if (torn.state === 'closed') { resultat.jaTancats += 1; continue; }
      if (!esTornCaducat(torn, ara)) { resultat.vius += 1; continue; }
      if (!sec) {
        const estatPrevi = torn.state;
        torn.state = 'closed';
        torn.revision = (Number.isInteger(torn.revision) ? torn.revision : 0) + 1;
        torn.updatedAt = isoAra;
        torn.closure = { reason: 'expired', at: isoAra, previousState: estatPrevi };
        torn.history.push({ state: 'closed', action: 'expire-close', previousState: estatPrevi, at: isoAra });
        // Preserve any genuine prior verification byte-for-byte; never create/re-hash it.
        escriuAtomic(abs, torn, abans, identity);
      }
      resultat.tancatsAra += 1;
      resultat.idsTancats.push(id);
    } catch (error) { resultat.errors.push({ file: `${DIR_TORNS}/${nom}`, error: error.message }); }
    finally { if (fd !== undefined) { fs.closeSync(fd); fs.unlinkSync(lock); } }
  }
  if (!sec) resultat.jaTancats += resultat.tancatsAra;
  return { ...resultat, valid: resultat.errors.length === 0 && resultat.omesosLock === 0 };
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
