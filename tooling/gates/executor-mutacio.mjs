#!/usr/bin/env node
/** Bounded file replacement executor: no shell, no eval, no arbitrary child process. */
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {canonical, relativePath, humanZone, sha} from '../documental/core.mjs';
import {inventory, changes} from '../documental/turns.mjs';
import {calculaSegell, verificaSegell} from './segella.mjs';
import {esMain} from '../lib/arrel.mjs';

function durable(file, text, flags = 'wx') {
  const fd = fs.openSync(file, flags, 0o600);
  try { fs.writeFileSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function syncDir(dir) {
  const fd = fs.openSync(dir, 'r');
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function journal(root, entry) {
  durable(path.join(root, '.agents/runtime/segell.log'), JSON.stringify(entry) + '\n', 'a');
}
export function validatePlan(root, plan) {
  if (plan?.schema !== 'sdp.mutation.v1' || !Array.isArray(plan.files) || !plan.files.length || !plan.session || !plan.operationId) throw new Error('Pla de mutació incomplet');
  const seen = new Set();
  return plan.files.map(f => {
    const rel = relativePath(root, f.path);
    if (rel !== f.path || seen.has(rel) || humanZone(rel) || /^(?:\.git|\.sdp-reflex)(?:\/|$)/.test(rel) || (rel.startsWith('.agents/runtime/') || rel.startsWith('.agents/seal-transactions/')) || rel === '.agents/SKILLS_SEAL.json') throw new Error(`Target no autoritzat: ${f.path}`);
    seen.add(rel);
    if (typeof f.content !== 'string' || !(f.before === null || /^[a-f0-9]{64}$/.test(f.before))) throw new Error('Cal contingut complet i hash previ (null per a alta)');
    const file = path.join(root, rel);
    if (fs.existsSync(file) && (!fs.lstatSync(file).isFile() || fs.lstatSync(file).nlink !== 1)) throw new Error('Target no regular o hardlink');
    if (canonical(file) !== path.resolve(root, rel)) throw new Error('Target amb symlink');
    const before = fs.existsSync(file) ? sha(fs.readFileSync(file)) : null;
    if (before !== f.before) throw new Error(`CAS divergent: ${rel}`);
    return {...f, after: sha(f.content)};
  });
}
// authorize is an internal dependency for fixtures; the CLI always uses the real Reflex claim.
export async function executeMutation(root, plan, authorize) {
  root = fs.realpathSync(root);
  const files = validatePlan(root, plan);
  if (!verificaSegell(root).ok) throw new Error('Segell previ invàlid; reconciliació explícita requerida');
  const snapshot = () => inventory(root, {files: files.map(f => f.path)});
  const initial = snapshot(), prior = fs.readFileSync(path.join(root, '.agents/SKILLS_SEAL.json'), 'utf8');
  const authorization = await authorize(files.map(f => path.join(root, f.path)), sha(JSON.stringify(plan)));
  if (!authorization?.claim || typeof authorization.complete !== 'function') throw new Error('Claim absent');
  const runtime = path.join(root, '.agents/runtime');
  fs.mkdirSync(runtime, {recursive: true});
  if (canonical(runtime) !== runtime || canonical(path.join(root,'.agents/SKILLS_SEAL.json')) !== path.join(root,'.agents/SKILLS_SEAL.json')) throw new Error('Estat de segell amb symlink');
  const log = path.join(runtime,'segell.log');
  if (fs.existsSync(log) && (!fs.lstatSync(log).isFile() || fs.lstatSync(log).nlink !== 1)) throw new Error('Traça no regular');
  const lock = path.join(runtime, 'mutation.lock');
  const fd = fs.openSync(lock, 'wx', 0o600);
  const id = randomUUID();
  const pending = path.join(runtime, 'mutation.pending.json');
  const record = {id, session: plan.session, operationId: plan.operationId, claim: authorization.claim,
    planHash: sha(JSON.stringify(plan)), beforeSeal: sha(prior), files: files.map(({path, before, after}) => ({path, before, after}))};
  let prepared = false;
  try {
    if (changes(initial, snapshot()).length) throw new Error('Canvi concurrent abans de preparar');
    validatePlan(root, plan);
    durable(pending, JSON.stringify({...record, state: 'prepared'}) + '\n'); prepared = true;
    syncDir(runtime);
    journal(root, {...record, state: 'prepared'});
    for (const f of files) {
      const target = path.join(root, f.path), temp = `${target}.${id}.tmp`;
      fs.mkdirSync(path.dirname(target), {recursive: true});
      durable(temp, f.content);
      if (fs.existsSync(target)) fs.chmodSync(temp, fs.statSync(target).mode & 0o777);
      fs.renameSync(temp, target); syncDir(path.dirname(target));
    }
    const expected = {...initial};
    for (const f of files) expected[f.path] = f.after;
    if (changes(expected, snapshot()).length) throw new Error('Conjunt de canvis divergent; cap segell acceptat');
    const seal = calculaSegell(root);
    journal(root, {...record, state: 'verified', afterSeal: seal.hash});
    await authorization.complete();
    if (changes(expected, snapshot()).length || fs.readFileSync(path.join(root, '.agents/SKILLS_SEAL.json'), 'utf8') !== prior) throw new Error('CAS final divergent');
    const accepted = {...record, state: 'accepted', afterSeal: seal.hash};
    journal(root, accepted);
    const evidence = path.join(root, '.agents/seal-transactions');
    fs.mkdirSync(evidence, {recursive:true});
    if (canonical(evidence) !== evidence) throw new Error('Evidència amb symlink');
    durable(path.join(evidence, `${id}.json`),JSON.stringify(accepted,null,2)+'\n'); syncDir(evidence);
    const sealFile = path.join(root, '.agents/SKILLS_SEAL.json'), temp = `${sealFile}.${id}.tmp`;
    durable(temp, JSON.stringify({timestamp: new Date().toISOString(), hash: seal.hash, filesCount: seal.files.length, manifest: seal.manifest, transaction: id}, null, 2) + '\n');
    fs.renameSync(temp, sealFile); syncDir(path.dirname(sealFile));
    fs.unlinkSync(pending); syncDir(runtime);
    return {valid: true, id, files: record.files, seal: seal.hash};
  } catch (error) {
    // Preserve pending state after any effect. Recovery must review actual bytes; never roll back concurrent edits.
    if (prepared) try { journal(root, {...record, state: 'failed', error: error.message}); } catch { /* pending remains blocking */ }
    throw error;
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
if (esMain(import.meta.url)) {
  try {
    const [planPath, receiptPath] = process.argv.slice(2);
    if (!planPath || !receiptPath || process.argv.length !== 4) throw new Error('Ús: executor-mutacio.mjs PLA.json REBUT.json');
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const {PROJECT_DIR, claimReceiptForMutation, completeMutationClaim} = await import('../wiki/reflex_petorreta.mjs');
    const result = await executeMutation(PROJECT_DIR, plan, async (targets, planDigest) => {
      const options = {receiptPath, operation: 'governance-write', targets, planDigest};
      const {receipt, claimToken} = await claimReceiptForMutation(options);
      if (receipt.sessionId !== plan.session) throw new Error('Sessió divergent');
      return {claim: `${receipt.sessionId}:governance-write`, complete: () => completeMutationClaim(options, claimToken)};
    });
    console.log(JSON.stringify(result));
  } catch (e) { console.error(e.message); process.exitCode = 2; }
}
