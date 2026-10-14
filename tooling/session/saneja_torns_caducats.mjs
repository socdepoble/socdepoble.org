#!/usr/bin/env node
/**
 * saneja_torns_caducats.mjs — Tractor de sanejament de torns caducats.
 *
 * Recorre `.agents/runtime/turns/torn_*.json` i marca automàticament com a
 * `closed` tots els torns que no estiguen tancats i que hagen superat la seua
 * data d'expiració (`expiresAt <= ara` o `expiresAt` il·legible), seguint el
 * mateix criteri que `tooling/documental/turns.mjs` i
 * `src/sections/consola/mapa/construeixMapa.js`.
 *
 * Ús:
 *   node tooling/session/saneja_torns_caducats.mjs           # aplica el tancament
 *   node tooling/session/saneja_torns_caducats.mjs --sec     # simulació sense escriure
 *   node tooling/session/saneja_torns_caducats.mjs --json    # eixida JSON
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

const DIR_TORNS = '.agents/runtime/turns';
const FITXER_TORN = /^torn_[0-9a-f-]+\.json$/;

const sha256 = ( contingut ) => createHash('sha256').update(contingut).digest('hex');

function escriuAtomic(abs, valor) {
  const tmp = `${abs}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(valor, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    fs.renameSync(tmp, abs);
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

/**
 * Cert si el torn no està tancat i la seua data de caducitat ja ha passat o no
 * es pot llegir (mateix predicat que `construeixMapa.js`).
 */
export function esTornCaducat(torn, ara = Date.now()) {
  if (!torn || typeof torn !== 'object' || Array.isArray(torn)) return false;
  if (torn.state === 'closed') return false;
  const expira = Date.parse(torn.expiresAt);
  return !Number.isFinite(expira) || expira <= ara;
}

/**
 * Tanca tots els torns caducats de `.agents/runtime/turns/`.
 * @param {string} [arrel]
 * @param {{ ara?: number, sec?: boolean }} [opcions]
 */
export function sanejaTornsCaducats(arrel = arrelSegura(), { ara = Date.now(), sec = false } = {}) {
  const dir = path.join(arrel, DIR_TORNS);
  if (!fs.existsSync(dir)) {
    return { total: 0, tancatsAra: 0, jaTancats: 0, vius: 0, omesosLock: 0, idsTancats: [] };
  }

  const noms = fs.readdirSync(dir).filter((nom) => FITXER_TORN.test(nom)).sort();
  const isoAra = new Date(ara).toISOString();
  let tancatsAra = 0;
  let jaTancats = 0;
  let vius = 0;
  let omesosLock = 0;
  const idsTancats = [];

  for (const nom of noms) {
    const abs = path.join(dir, nom);
    const lock = `${abs}.lock`;
    if (fs.existsSync(lock)) {
      omesosLock += 1;
      continue;
    }

    let torn;
    try {
      torn = JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch {
      continue;
    }

    if (torn?.state === 'closed') {
      jaTancats += 1;
      continue;
    }

    if (!esTornCaducat(torn, ara)) {
      vius += 1;
      continue;
    }

    const id = typeof torn.turn_id === 'string' ? torn.turn_id : nom.slice(0, -'.json'.length);
    if (!sec) {
      const estatPrevi = torn.state ?? null;
      torn.state = 'closed';
      torn.revision = (Number.isInteger(torn.revision) ? torn.revision : 0) + 1;
      torn.updatedAt = isoAra;
      if (!Array.isArray(torn.history)) torn.history = [];
      torn.history.push({
        state: 'closed',
        action: 'expire-close',
        previousState: estatPrevi,
        at: isoAra
      });
      if (!torn.verification && torn.receipts && typeof torn.receipts === 'object') {
        const files = {};
        for (const rebut of Object.values(torn.receipts)) {
          const rel = rebut?.file;
          if (typeof rel !== 'string' || !rel) continue;
          const absDoc = path.join(arrel, rel);
          try {
            if (fs.existsSync(absDoc) && fs.statSync(absDoc).isFile()) {
              files[rel] = sha256(fs.readFileSync(absDoc));
            }
          } catch { /* s'omet si no es pot llegir */ }
        }
        if (Object.keys(files).length > 0) {
          torn.verification = { at: isoAra, files, checks: ['expire-close'] };
        }
      }
      escriuAtomic(abs, torn);
    }

    tancatsAra += 1;
    idsTancats.push(id);
  }

  return {
    total: noms.length,
    tancatsAra,
    jaTancats: jaTancats + (sec ? 0 : tancatsAra),
    vius,
    omesosLock,
    idsTancats
  };
}

function main() {
  const sec = process.argv.includes('--sec') || process.argv.includes('--dry-run');
  const json = process.argv.includes('--json');
  const resultat = sanejaTornsCaducats(arrelSegura(), { sec });
  if (json) {
    console.log(JSON.stringify(resultat, null, 2));
    return;
  }
  console.log(
    `🧹 [Torns] ${resultat.tancatsAra} torns caducats marcats com a 'closed' ` +
    `(${resultat.jaTancats}/${resultat.total} tancats, ${resultat.vius} vius)`
  );
}

if (esMain(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`❌ [Torns] ${error.message}`);
    process.exitCode = 1;
  }
}
