/** Narrow administrative diagnosis: a declared ephemeral base absent from local Git.
 * No inventory is reconstructed and no missing object is fetched or manufactured. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CAMINS } from '../lib/arrel.mjs';
import { UUID, turnPattern, canonical } from '../documental/core.mjs';
import { FORMAT_INVENTARI_INICIAL } from '../documental/turns.mjs';

export const ESTAT_BASE_EFIMERA = 'unreconstructible_ephemeral_base';
const OID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const HASH = /^[0-9a-f]{64}$/;
const RECEIPT = new RegExp(`^${UUID}$`);
const fields = ['turnId', 'base', 'sha256', 'reason'];

export function validaSolicitudBaseEfimera(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).some(key => !fields.includes(key))
      || ['turnId', 'base', 'sha256'].some(key => typeof value[key] !== 'string')
      || !turnPattern.test(value.turnId) || !OID.test(value.base || '') || !HASH.test(value.sha256 || '')
      || typeof value.reason !== 'string' || value.reason.trim().length < 12 || value.reason.length > 512
      || /[\u0000-\u001f\u007f]/.test(value.reason)) throw new Error('Sol·licitud de base efímera incompleta o invàlida');
  return { turnId: value.turnId, base: value.base, sha256: value.sha256, reason: value.reason.trim() };
}

/** Only formal, top-level desktop documents; no permanent/human/laboratory paths. */
function documentFormal(relative) {
  return typeof relative === 'string' && path.posix.dirname(relative) === CAMINS.escriptori
    && /^\d{6}_\d{4}_[a-z0-9_]+\.md$/.test(path.posix.basename(relative));
}
export function validaAbastBaseEfimera(turn, request) {
  if (turn.turn_id !== request.turnId || turn.scope !== 'documents'
      || turn.initial?.format !== FORMAT_INVENTARI_INICIAL || turn.initial.base !== request.base)
    throw new Error('Abast documental o base efímera divergent');
  if (turn.closure !== undefined && turn.closure !== null) throw new Error('El torn ja porta una traça de tancament');
  const created = Date.parse(turn.createdAt), updated = Date.parse(turn.updatedAt), expires = Date.parse(turn.expiresAt);
  if (!Number.isFinite(created) || !Number.isFinite(updated) || created > expires || updated < created)
    throw new Error('Cronologia del torn incoherent');
  for (const [id, receipt] of Object.entries(turn.receipts)) {
    if (!RECEIPT.test(id) || receipt?.id !== id || !documentFormal(receipt.file))
      throw new Error('Rebut fora de l’abast documental de reconciliació');
  }
  if (turn.plan !== null && (!turn.plan || !documentFormal(turn.plan.file))) throw new Error('Pla fora de l’abast documental de reconciliació');
  if (turn.ownedPaths !== undefined && (!Array.isArray(turn.ownedPaths) || !turn.ownedPaths.every(documentFormal)))
    throw new Error('Ownership fora de l’abast documental de reconciliació');
}

/** Every Git error is distinct from an absent object. No network/lazy fetching. */
export function observaBaseGitAbsent(root, base) {
  if (!OID.test(base || '')) throw new Error('OID de base efímera invàlid');
  root = fs.realpathSync(root);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  const git = (args, input) => {
    const result = spawnSync('git', ['--no-replace-objects', '--no-lazy-fetch', '-c', 'core.fsmonitor=false', ...args], {
      cwd: root, input, encoding: 'utf8', timeout: 5000, maxBuffer: 64 * 1024,
      env: { ...env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0', GIT_NO_LAZY_FETCH: '1' },
    });
    // cat-file can return exit 0 and "OID missing" while reporting corrupt
    // loose objects or broken alternates on stderr. Neither is absence.
    if (result.error || result.signal || result.status !== 0 || typeof result.stdout !== 'string'
        || typeof result.stderr !== 'string' || result.stderr.length !== 0)
      throw new Error('No es pot observar la base en Git local: execució o diagnòstic de Git no net');
    return result.stdout.trim();
  };
  const top = git(['rev-parse', '--show-toplevel']);
  if (fs.realpathSync(top) !== root) throw new Error('La reconciliació exigix l’arrel exacta del repositori Git');
  const head = git(['rev-parse', '--verify', 'HEAD^{commit}']);
  if (!OID.test(head)) throw new Error('HEAD de Git no vàlid');
  const observation = git(['cat-file', '--batch-check=%(objectname) %(objecttype)'], `${base}\n`);
  if (observation !== `${base} missing`) {
    if (new RegExp(`^${base} (?:commit|tree|blob|tag)$`).test(observation)) throw new Error('La base existix en Git: no és una base efímera absent');
    throw new Error('Resposta Git inesperada: no es pot acreditar l’absència local');
  }
  return { status: ESTAT_BASE_EFIMERA, base, observedHead: head,
    absence: 'observed_local_git_object_absent', origin: 'declared_ephemeral_clone',
    inventoryReconstructed: false, inventoryVerified: false };
}

/** These fields only describe the observation and the operator's explanation. */
export function comprovaBaseEfimera(root, turn, request) {
  validaAbastBaseEfimera(turn, request);
  const declared = [...Object.values(turn.receipts).map(receipt => receipt.file),
    ...(turn.plan?.file ? [turn.plan.file] : []), ...(turn.ownedPaths || [])];
  for (const relative of new Set(declared)) {
    const absolute = path.join(root, relative);
    if (canonical(absolute) !== absolute) throw new Error('Ruta documental substituïda o amb symlink');
    try {
      const stat = fs.lstatSync(absolute);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error('Ruta documental no regular');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { ...observaBaseGitAbsent(root, request.base), reason: request.reason };
}

export function validaTracaBaseEfimera(before, claim) {
  const keys = ['status', 'base', 'observedHead', 'absence', 'origin', 'inventoryReconstructed', 'inventoryVerified', 'reason'];
  if (!claim || typeof claim !== 'object' || Array.isArray(claim)
      || Object.keys(claim).sort().join() !== keys.sort().join()
      || claim.status !== ESTAT_BASE_EFIMERA || claim.base !== before.initial?.base || !OID.test(claim.observedHead || '')
      || claim.absence !== 'observed_local_git_object_absent' || claim.origin !== 'declared_ephemeral_clone'
      || claim.inventoryReconstructed !== false || claim.inventoryVerified !== false) throw new Error('Traça de base efímera invàlida');
  const request = validaSolicitudBaseEfimera({ turnId: before.turn_id, base: claim.base, sha256: '0'.repeat(64), reason: claim.reason });
  validaAbastBaseEfimera(before, request);
  // Do not test Git again here: later recovery of the object must not rewrite history.
  // The hashes bind this claim to local before/after bytes, not to an author or an approval.
  return claim;
}
