/** R31: cobertura del lector de rebuts i de porta-reflex/plantilla-viva.
 * El receptor experimental de missatges retirat no es reinstal·la ni es
 * declara operatiu. La inspecció és pura; l'autoritat operativa és explícita. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, REPO } from './helpers/documental.mjs';
import { openTurn, readTurn, validateDocument, inventory } from '../tooling/documental/turns.mjs';
import { createDraft } from '../tooling/wiki/document.mjs';
import { checkPayload } from '../tooling/gates/porta-reflex.mjs';
import { inspeccionaText } from '../tooling/gates/porta-plantilla-viva.mjs';
import { avui } from '../tooling/gates/porta-olivera.mjs';

const DESK = '_wiki_de_poble/04_escriptori';
function setup(t, { complete = true } = {}) {
  const root = fs.realpathSync(fixture(t));
  fs.writeFileSync(path.join(root, '.agents/AGENTS.md'), '# Arrel sintètica de prova\n');
  const turn = openTurn(root, { scope: 'documents', actor: 'prova' }), file = `${DESK}/${avui()}_1310_prompt_receptor.md`;
  createDraft(root, turn.turn_id, { route: 'prompt.local', file, title: 'Validació documental R31', description: 'Document sintètic per provar el lector i les portes canòniques' });
  let raw = fs.readFileSync(path.join(root, file), 'utf8'); if (complete) raw = raw.replaceAll('[pendent]', 'Contingut sintètic comprovat.');
  fs.writeFileSync(path.join(root, file), raw); return { root, turn, file, raw };
}
const payload = (file, raw) => ({ tool_name: 'Write', tool_input: { file_path: file, content: raw } });
const errors = result => result.errors.join('\n');

test('rebut consolidat i document complet passen els tres consumidors actuals', t => {
  const { root, file, raw } = setup(t);
  assert.deepEqual(validateDocument(root, raw, file), []);
  assert.deepEqual(inspeccionaText(root, file, raw, { complet: true }).errors, []);
  assert.deepEqual(checkPayload(payload(file, raw), root), { code: 0, errors: [], file });
});
test('prompt a mà sense rebut falla encara que declare una casella marcada', t => {
  const { root, file, raw } = setup(t), manual = raw.replace(/^reflex:.*\n/m, '').replace('Contingut sintètic comprovat.', '- [x] Rebut obtingut');
  assert.match(validateDocument(root, manual, file).join('\n'), /rebut persistent/);
  const gate = checkPayload(payload(file, manual), root); assert.equal(gate.code, 2); assert.match(errors(gate), /rebut persistent/);
  assert.match(errors(inspeccionaText(root, file, manual)), /sense rebut/);
});
test('rebut real no és portable a un altre fitxer o a un altre torn', t => {
  const { root, file, raw, turn } = setup(t), other = file.replace('_receptor.md', '_altre.md');
  assert.match(validateDocument(root, raw, other).join('\n'), /altre document/);
  assert.equal(checkPayload(payload(other, raw), root).code, 2);
  const foreign = openTurn(root, { scope: 'documents' }), transplanted = raw.replace(turn.turn_id, foreign.turn_id);
  assert.match(validateDocument(root, transplanted, file).join('\n'), /Rebut absent/);
});
test('pendent estructural és esborrany; no acredita completesa operativa', t => {
  const { root, file, raw } = setup(t, { complete: false });
  assert.deepEqual(inspeccionaText(root, file, raw).errors, []);
  assert.match(errors(inspeccionaText(root, file, raw, { complet: true })), /pendent/);
  assert.equal(checkPayload(payload(file, raw), root).code, 2);
});
test('bloc fix mutilat es detecta amb frontmatter i rebut legítims', t => {
  const { root, file, raw } = setup(t), mutilat = raw.replace('**Hipermodularitat i Enxufabilitat:**', '**Contracte alterat:**');
  assert.notEqual(mutilat, raw, 'la fixture exercita un bloc real');
  assert.match(errors(inspeccionaText(root, file, mutilat)), /bloc normatiu alterat/);
  assert.equal(checkPayload(payload(file, mutilat), root).code, 2);
});
test('caducitat conserva procedència estructural però rebutja ús operatiu i no inventa verificació', t => {
  const { root, turn, file, raw } = setup(t), record = path.join(root, '.agents/runtime/turns', `${turn.turn_id}.json`), old = JSON.parse(fs.readFileSync(record, 'utf8'));
  fs.writeFileSync(record, JSON.stringify({ ...old, expiresAt: '2000-01-01T00:00:00.000Z' }));
  assert.throws(() => readTurn(root, turn.turn_id), /Torn caducat/);
  const structural = inspeccionaText(root, file, raw); assert.ok(structural.rebut); assert.deepEqual(structural.errors, []);
  assert.match(validateDocument(root, raw, file).join('\n'), /Torn caducat/);
  assert.equal(checkPayload(payload(file, raw), root).code, 2);
});
test('lectures positives i negatives deixen bytes, rebuts i índex idèntics', t => {
  const { root, file, raw } = setup(t), before = inventory(root);
  for (const candidate of [raw, raw.replace(/^reflex:.*\n/m, ''), '# Sense frontmatter\n']) {
    validateDocument(root, candidate, file); inspeccionaText(root, file, candidate, { complet: true }); checkPayload(payload(file, candidate), root);
  }
  assert.deepEqual(inventory(root), before);
});
test('Edit reconstrueix candidat i rebutja fragments absents o ambigus sense escriure', t => {
  const { root, file, raw } = setup(t), before = inventory(root);
  const edit = (old_string, new_string) => checkPayload({ tool_name: 'Edit', tool_input: { file_path: file, old_string, new_string } }, root);
  assert.equal(edit('# Validació documental R31', '# Validació completada R31').code, 0);
  assert.match(errors(edit('text absent', 'nou')), /absent o ambigua/);
  assert.match(errors(edit('Contingut sintètic comprovat.', 'nou')), /absent o ambigua/);
  assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), raw); assert.deepEqual(inventory(root), before);
});
test('CLI actual falla tancat davant payload il·legible i arbre intacte', t => {
  const { root, file, raw } = setup(t), before = inventory(root);
  const cli = input => spawnSync(process.execPath, [path.join(REPO, 'tooling/gates/porta-reflex.mjs'), '--arrel', root], { input, cwd: root, encoding: 'utf8' });
  const valid = cli(JSON.stringify(payload(file, raw))); assert.equal(valid.status, 0, valid.stderr);
  const malformed = cli('{payload trencat'); assert.equal(malformed.status, 2); assert.match(malformed.stderr, /Payload il·legible/);
  const missing = cli(''); assert.equal(missing.status, 1); assert.match(missing.stderr, /cap comprovació executada/);
  assert.deepEqual(inventory(root), before);
});
