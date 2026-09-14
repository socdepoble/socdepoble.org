/**
 * autoneteja_wiki.mjs — auditoria i migració reversible de la Wiki.
 *
 * GARANTIES:
 * - Sense flags d'aplicació és un dry-run real: zero escriptures.
 * - Una migració de frontmatter conserva el cos byte a byte.
 * - Cap orfe amb contingut es mou automàticament.
 * - Només es poden quarantinar buits semàntics amb grau zero.
 * - Tota mutació exigix rebut del Reflex, backup, manifest i rollback.
 * - Qualsevol error és fail-closed (exit diferent de zero).
 *
 * Ús:
 *   node autoneteja_wiki.mjs [--json] [--strict]
 *   node autoneteja_wiki.mjs --apply-frontmatter --ack-schema-cutover \
 *     --receipt=/ruta/rebut.json
 *   node autoneteja_wiki.mjs --quarantine-empty --receipt=/ruta/rebut.json
 *   node autoneteja_wiki.mjs --restore=/ruta/manifest.json \
 *     --receipt=/ruta/rebut.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { verificaTancaSeguretat } from './tanca.mjs';
import { discoverMarkdown, treeDigest } from './corpus_snapshot.mjs';
import { claimReceiptForMutation, completeMutationClaim } from '../reflex_petorreta.mjs';
import {
  TOOLING_WIKI_DIR,
  WIKI_DIR,
} from '../lib/project_paths.mjs';

const SCRIPT_DIR = TOOLING_WIKI_DIR;
export const DEFAULT_WIKI_DIR = WIKI_DIR;


export async function atomicWrite(file, content, { mode = 0o644 } = {}) {
  verificaTancaSeguretat(file);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.sdp-tmp-${process.pid}-${Date.now()}`;
  const handle = await fs.open(temp, 'wx', mode & 0o777);
  try {
    await handle.writeFile(content, typeof content === 'string' ? 'utf8' : undefined);
    await handle.sync();
  } catch (error) {
    await handle.close().catch(() => {});
    await fs.rm(temp, { force: true }).catch(() => {});
    throw error;
  }
  await handle.close();
  await fs.chmod(temp, mode & 0o777);
  await fs.rename(temp, file);
  const directory = await fs.open(path.dirname(file), 'r').catch(() => null);
  if (directory) {
    await directory.sync().catch(() => {});
    await directory.close().catch(() => {});
  }
}

export async function writeManifest(file, manifest) {
  await atomicWrite(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

export async function writeNewFile(file, content, { mode = 0o600 } = {}) {
  verificaTancaSeguretat(file);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const handle = await fs.open(file, 'wx', mode);
  try {
    await handle.writeFile(content, typeof content === 'string' ? 'utf8' : undefined);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const directory = await fs.open(path.dirname(file), 'r').catch(() => null);
  if (directory) {
    await directory.sync().catch(() => {});
    await directory.close().catch(() => {});
  }
}

export async function requireReceipt(receiptPath, operation, targets, planDigest) {
  if (!receiptPath) throw new Error(`L'operació ${operation} exigix --receipt=<rebut.json>`);
  const claimed = await claimReceiptForMutation({ receiptPath, operation, targets, planDigest });
  return { receiptPath, operation, claimToken: claimed.claimToken };
}

export async function completeReceiptClaim(claim) {
  await completeMutationClaim({ receiptPath: claim.receiptPath, operation: claim.operation }, claim.claimToken);
}

export const safetyDirFor = (root) => path.join(path.dirname(root), '.wiki-safety');

export async function acquireMutationLock(root, { recoverStale = false, maxRetries = 5, retryDelayMs = 100 } = {}) {
  const safetyDir = safetyDirFor(root);
  await fs.mkdir(safetyDir, { recursive: true });
  const lockPath = path.join(safetyDir, 'autoneteja.lock');
  let handle;
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      handle = await fs.open(lockPath, 'wx');
      break;
    } catch (error) {
      if (error.code === 'EEXIST') {
        if (recoverStale) {
          const owner = await fs.readFile(lockPath, 'utf8').catch(() => '');
          const pid = Number(owner.trim().split(/\s+/)[0]);
          let alive = Number.isInteger(pid) && pid > 0;
          if (alive) {
            try { process.kill(pid, 0); } catch (failure) { if (failure.code === 'ESRCH') alive = false; else throw failure; }
          }
          if (!alive) {
            await fs.rm(lockPath, { force: true });
            continue;
          }
        }
        if (retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, retryDelayMs));
          continue;
        }
        throw new Error('Ja hi ha una autoneteja en curs; usa restore sobre el manifest si el procés anterior va morir.');
      }
      throw error;
    }
  }

  await handle.writeFile(`${process.pid} ${new Date().toISOString()}\n`);
  return async () => {
    await handle.close().catch(() => {});
    await fs.rm(lockPath, { force: true }).catch(() => {});
  };
}

export async function assertUnchanged(root, expectedDigest) {
  const fresh = await discoverMarkdown(root);
  const actual = treeDigest(fresh.docs);
  if (actual !== expectedDigest) {
    const error = new Error('La Wiki ha canviat després de l\'auditoria; pla caducat, zero escriptures.');
    error.code = 'STALE_PLAN';
    throw error;
  }
}

export async function assertSchemaCutoverReady() {
  const lockPath = path.join(SCRIPT_DIR, 'schema-cutover.lock.json');
  const lock = JSON.parse(await fs.readFile(lockPath, 'utf8'));
  if (lock.schema !== 'socdepoble.schema-cutover.v1' || lock.ready !== true) {
    throw new Error('Cutover v2 no preparat: schema-cutover.lock.json continua en ready=false.');
  }
  if (!Array.isArray(lock.blockers) || lock.blockers.length > 0) {
    throw new Error(`Cutover v2 bloquejat per ${(lock.blockers || []).length} consumidor(s) legacy.`);
  }
  // if (lock.schemaSha256 !== SCHEMA_SHA256) {
  //   throw new Error('Cutover v2 caducat: schemaSha256 no coincidix amb schema.json.');
  // }
}
