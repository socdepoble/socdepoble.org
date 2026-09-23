#!/usr/bin/env node
/** Post-effect verification only. A host payload cannot authenticate a mutation. */
import fs from 'node:fs';
import path from 'node:path';
import { esMain } from '../lib/arrel.mjs';
import { verificaSegell } from './segella.mjs';
import { canonical, inside } from '../documental/core.mjs';
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
if (esMain(import.meta.url)) {
  try {
    const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (!['PostToolUse', 'PostToolUseFailure'].includes(payload.hook_event_name) || !payload.tool_name) throw new Error('Payload post-hook incomplet');
    console.log(JSON.stringify(resegellaSiCal(null, ARREL)));
  } catch (e) { console.error(`[segell-auto] ${e.message}`); process.exitCode = 2; }
}
