#!/usr/bin/env node
/** Post-effect verification only. A host payload cannot authenticate a mutation. */
import fs from 'node:fs';
import path from 'node:path';
import { esMain } from '../lib/arrel.mjs';
import { verificaSegell } from './segella.mjs';
import { canonical, inside } from '../documental/core.mjs';
import { knownPureRead } from './mutation-policy.mjs';
const ARREL = process.env.SDP_ARREL || process.cwd();
export function tocaSkill(file, root = ARREL) {
  if (typeof file !== 'string' || !file) return false;
  const actual = canonical(path.resolve(root, file));
  return inside(canonical(path.join(root, '.agents/skills')), actual) && /\.md$/i.test(actual);
}
export function resegellaSiCal(_file, root = ARREL) {
  const state = verificaSegell(root);
  if (!state.ok) throw new Error('Origen no acreditat: segell divergent; cap resegellat automàtic. Usa executor-mutacio amb lease i estat previ vàlid, o reconciliació explícita del diff.');
  return {fet: false, motiu: 'segell intacte; comprovació sense resegellat'};
}
export function checkPostTool(payload, root = ARREL) {
  if (!['PostToolUse', 'PostToolUseFailure'].includes(payload?.hook_event_name) || typeof payload.tool_name !== 'string' || !payload.tool_name) throw new Error('Payload post-hook incomplet');
  // A read cannot explain prior drift. Do not turn that drift into a failed read
  // or claim the seal is valid: writes and explicit seal checks still verify it.
  if (knownPureRead(payload, root)) return {fet: false, motiu: 'lectura sense mutació; segell no comprovat'};
  return resegellaSiCal(null, root);
}
if (esMain(import.meta.url)) {
  try {
    const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
    console.log(JSON.stringify(checkPostTool(payload, ARREL)));
  } catch (e) { console.error(`[segell-auto] ${e.message}`); process.exitCode = 2; }
}
