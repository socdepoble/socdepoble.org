#!/usr/bin/env node
/** Bounded file replacement executor: no shell, eval or arbitrary child process. */
import fs from 'node:fs';
import path from 'node:path';
import {relativePath, humanZone, sha} from '../documental/core.mjs';
import {inventory, changes} from '../documental/turns.mjs';
import {calculaSegell, verificaSegell} from './segella.mjs';
import {esMain} from '../lib/arrel.mjs';
import {readState, safePath, atomicReplace, durableMutation} from '../lib/mutacio-durable.mjs';
import {REGISTRE, validaMutacioRegistre} from './frontissa-contingut.mjs';

export function validatePlan(root, plan) {
  if (plan?.schema !== 'sdp.mutation.v1' || !Array.isArray(plan.files) || !plan.files.length || typeof plan.session !== 'string' || !plan.session.trim() || typeof plan.operationId !== 'string' || !plan.operationId.trim()) throw new Error('Pla de mutació incomplet');
  const seen = new Set();
  return plan.files.map(f => {
    safePath(root, f.path);
    const rel = relativePath(root, f.path);
    if (rel !== f.path || seen.has(rel) || humanZone(rel) || /^(?:\.git|\.sdp-reflex)(?:\/|$)/.test(rel) || rel.startsWith('.agents/runtime/') || rel.startsWith('.agents/seal-transactions/') || rel === '.agents/SKILLS_SEAL.json') throw new Error(`Target no autoritzat: ${f.path}`);
    seen.add(rel);
    if (typeof f.content !== 'string' || !(f.before === null || /^[a-f0-9]{64}$/.test(f.before))) throw new Error('Cal contingut complet i hash previ (null per a alta)');
    const before = readState(root, rel);
    if (before.hash !== f.before) throw new Error(`CAS divergent: ${rel}`);
    if (rel === REGISTRE) validaMutacioRegistre(before.bytes?.toString('utf8') ?? null, f.content, plan.frontissa);
    return {...f, after: sha(f.content)};
  });
}
/** Real CLI authorization; fixture injection is never exposed as a CLI flag. */
export function reflexAuthorization(root, plan, receiptPath) {
  return async (targets, planDigest) => {
    const {PROJECT_DIR, claimReceiptForMutation, completeMutationClaim} = await import('../wiki/reflex_petorreta.mjs');
    if (fs.realpathSync(PROJECT_DIR) !== fs.realpathSync(root)) throw new Error('Arrel Reflex divergent');
    const options = {receiptPath, operation: 'governance-write', targets, planDigest};
    const {receipt, claimToken} = await claimReceiptForMutation(options);
    if (receipt.sessionId !== plan.session) throw new Error('Sessió divergent');
    return {claim: `${receipt.sessionId}:governance-write`, complete: () => completeMutationClaim(options, claimToken)};
  };
}
export async function executeMutation(root, input, authorize) {
  root = fs.realpathSync(root);
  // Snapshot before authorization awaits; a callback cannot widen or change the plan.
  const plan = structuredClone(input), files = validatePlan(root, plan);
  readState(root, '.agents/SKILLS_SEAL.json');
  if (!verificaSegell(root).ok) throw new Error('Segell previ invàlid; reconciliació explícita requerida');
  const snapshot = () => inventory(root, {files: files.map(f => f.path)});
  const initial = snapshot(), prior = readState(root, '.agents/SKILLS_SEAL.json');
  const expected = {...initial}; for (const f of files) expected[f.path] = f.after;
  const planHash = sha(JSON.stringify(plan));
  const result = await durableMutation(root, files, {
    metadata: {session: plan.session, operationId: plan.operationId, planHash, beforeSeal: prior.hash,
      ...(plan.frontissa ? {kind: 'frontissa-agent', ...plan.frontissa} : {})},
    prepare: async () => {
      if (changes(initial, snapshot()).length) throw new Error('Canvi concurrent abans de preparar');
      if (readState(root, '.agents/SKILLS_SEAL.json').hash !== prior.hash) throw new Error('CAS de segell divergent');
      const authorization = await (authorize || reflexAuthorization(root, plan))(files.map(f => path.join(root, f.path)), planHash);
      if (typeof authorization?.claim !== 'string' || !authorization.claim.trim() || typeof authorization.complete !== 'function') throw new Error('Claim absent');
      if (changes(initial, snapshot()).length) throw new Error('Canvi concurrent abans de preparar');
      validatePlan(root, plan);
      return {metadata: {claim: authorization.claim}, complete: authorization.complete};
    },
    verify: () => {
      if (changes(expected, snapshot()).length || readState(root, '.agents/SKILLS_SEAL.json').hash !== prior.hash) throw new Error('CAS final divergent; cap segell acceptat');
      return {afterSeal: calculaSegell(root).hash};
    },
    publish: accepted => {
      const seal = calculaSegell(root);
      const withEvidence = {...expected, [`.agents/seal-transactions/${accepted.id}.json`]: sha(`${JSON.stringify(accepted, null, 2)}\n`)};
      if (seal.hash !== accepted.afterSeal || changes(withEvidence, snapshot()).length) throw new Error('CAS final divergent');
      atomicReplace(root, {path: '.agents/SKILLS_SEAL.json', before: prior.hash,
        content: `${JSON.stringify({timestamp: new Date().toISOString(), hash: seal.hash, filesCount: seal.files.length, manifest: seal.manifest, transaction: accepted.id}, null, 2)}\n`}, accepted.id);
    }
  });
  return {...result, seal: result.afterSeal};
}
if (esMain(import.meta.url)) {
  try {
    const [planPath, receiptPath] = process.argv.slice(2);
    if (!planPath || !receiptPath || process.argv.length !== 4) throw new Error('Ús: executor-mutacio.mjs PLA.json REBUT.json');
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const {PROJECT_DIR} = await import('../wiki/reflex_petorreta.mjs');
    const result = await executeMutation(PROJECT_DIR, plan, reflexAuthorization(PROJECT_DIR, plan, receiptPath));
    console.log(JSON.stringify(result));
  } catch (e) { console.error(e.message); process.exitCode = 2; }
}
