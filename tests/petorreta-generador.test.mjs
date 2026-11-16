/** R31: cobertura del successor context → create → check del generador
 * experimental retirat. Cap generador històric es reinstal·la. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, REPO } from './helpers/documental.mjs';
import { openTurn, readTurn, deliverContext, validateDocument, activeReceipts, bindPlan } from '../tooling/documental/turns.mjs';
import { createDraft } from '../tooling/wiki/document.mjs';
import { avui, vius, checkTaula } from '../tooling/gates/porta-olivera.mjs';

const DESK = '_wiki_de_poble/04_escriptori', DAY = avui(), INDEX = `${DESK}/00_index_escriptori.md`;
const nom = categoria => `${DESK}/${DAY}_1310_${categoria}_generador.md`;
const opts = (route = 'auditoria', file = nom('auditoria')) => ({ route, file, title: 'Circuit documental R31', description: 'Fixture del circuit explícit i de les seues negatives', actor: 'agent-de-prova' });
const completa = raw => raw.replaceAll('[pendent]', 'Contingut sintètic comprovat.');
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
function setup(t) {
  const root = fs.realpathSync(fixture(t));
  fs.writeFileSync(path.join(root, '.agents/AGENTS.md'), '# Arrel sintètica de prova\n');
  const turn = openTurn(root, { actor: 'prova', scope: 'documents' });
  return { root, turn };
}
const cli = (root, ...args) => spawnSync(process.execPath, [path.join(REPO, 'tooling/wiki/document.mjs'), ...args, '--arrel', root], { cwd: root, encoding: 'utf8' });

test('context entrega plantilla; create consolida rebut i àncora; el pendent encara falla check', t => {
  const { root, turn } = setup(t), o = opts(), context = deliverContext(root, turn.turn_id, o);
  assert.ok(context.template.includes('## Registre'));
  assert.equal(fs.existsSync(path.join(root, o.file)), false);
  const result = createDraft(root, turn.turn_id, o), raw = read(root, o.file);
  assert.notEqual(result.reflex, context.reflex);
  const receipt = readTurn(root, turn.turn_id).receipts[result.reflex.split(':').at(-1)];
  assert.deepEqual([receipt.file, receipt.creation.state], [o.file, 'committed']);
  assert.match(raw, /Propietari \| agent-de-prova/);
  assert.ok(vius(root).has(path.basename(o.file, '.md')));
  assert.match(validateDocument(root, raw, o.file).join('\n'), /pendent/);
  const done = completa(raw); fs.writeFileSync(path.join(root, o.file), done);
  assert.deepEqual(validateDocument(root, done, o.file), []);
});

test('pla i prompt compartixen HHMM, amb pla vinculat i dos documents ancorats sense sobreescriptura', t => {
  const { root, turn } = setup(t), plan = opts('pla.implementacio', nom('pla_implementacio'));
  createDraft(root, turn.turn_id, plan); fs.writeFileSync(path.join(root, plan.file), completa(read(root, plan.file)));
  bindPlan(root, turn.turn_id, plan.file);
  const before = read(root, plan.file), prompt = opts('prompt.local', nom('prompt'));
  createDraft(root, turn.turn_id, prompt);
  assert.equal(path.basename(plan.file).slice(0, 11), path.basename(prompt.file).slice(0, 11));
  assert.equal(read(root, plan.file), before);
  assert.equal(readTurn(root, turn.turn_id).plan.file, plan.file);
  for (const file of [plan.file, prompt.file]) assert.ok(read(root, INDEX).includes(`[[${path.basename(file, '.md')}]]`));
  assert.equal(checkTaula(root).valid, true);
});

test('destí existent, nom invàlid i zona humana fallen abans de crear cap rebut fantasma', t => {
  const { root, turn } = setup(t), file = nom('auditoria');
  fs.writeFileSync(path.join(root, file), 'contingut humà preexistent');
  const before = readTurn(root, turn.turn_id);
  assert.throws(() => createDraft(root, turn.turn_id, opts('auditoria', file)), /EEXIST/);
  assert.equal(read(root, file), 'contingut humà preexistent');
  for (const other of [`${DESK}/sense_data.md`, `${DESK}/01_produccio/${DAY}_1310_auditoria_humana.md`]) assert.throws(() => deliverContext(root, turn.turn_id, opts('auditoria', other)), /invàlid|no autoritzat/);
  assert.deepEqual(readTurn(root, turn.turn_id), before);
});

test('taula bruta denega context i create de convocatòria sense tocar índex ni rebuts', t => {
  const { root, turn } = setup(t); fs.writeFileSync(path.join(root, DESK, '250101_0900_auditoria_consumida.md'), '# Consumida\n');
  const before = readTurn(root, turn.turn_id), index = read(root, INDEX), o = opts('prompt.local', nom('prompt'));
  assert.throws(() => deliverContext(root, turn.turn_id, o), /Escriptori brut/);
  assert.throws(() => createDraft(root, turn.turn_id, o), /Escriptori brut/);
  assert.deepEqual(readTurn(root, turn.turn_id), before);
  assert.equal(read(root, INDEX), index); assert.equal(fs.existsSync(path.join(root, o.file)), false);
});

test('lock ocupat deixa fallada explícita i absent, cap rebut actiu ni draft parcial', t => {
  const { root, turn } = setup(t), o = opts(), lock = path.join(root, '.agents/runtime/document-create.lock');
  fs.writeFileSync(lock, 'lock d’un altre autor'); const index = read(root, INDEX);
  assert.throws(() => createDraft(root, turn.turn_id, o), /EEXIST/);
  const state = readTurn(root, turn.turn_id), receipts = Object.values(state.receipts);
  assert.equal(receipts.length, 1, 'la fallada conserva rastre auditable');
  assert.deepEqual([receipts[0].creation.state, receipts[0].creation.absent], ['failed', true]);
  assert.deepEqual(activeReceipts(state), []); assert.equal(fs.existsSync(path.join(root, o.file)), false);
  assert.equal(read(root, INDEX), index); assert.equal(fs.readFileSync(lock, 'utf8'), 'lock d’un altre autor');
});

test('metadades invàlides no escriuen; el reintent correcte té rebut nou consolidat', t => {
  const { root, turn } = setup(t), o = opts();
  assert.throws(() => createDraft(root, turn.turn_id, { ...o, description: 'x' }));
  assert.equal(fs.existsSync(path.join(root, o.file)), false); assert.deepEqual(activeReceipts(readTurn(root, turn.turn_id)), []);
  const result = createDraft(root, turn.turn_id, o), receipts = readTurn(root, turn.turn_id).receipts;
  assert.equal(Object.values(receipts).filter(r => r.creation.state === 'failed').length, 1);
  assert.equal(receipts[result.reflex.split(':').at(-1)].creation.state, 'committed');
});

test('CLI real context/create/check: JSON, roig al pendent i verd després de completar', t => {
  const { root, turn } = setup(t), o = opts(), common = ['--turn-id', turn.turn_id, '--route', o.route, '--file', o.file];
  const context = cli(root, 'context', ...common); assert.equal(context.status, 0, context.stderr);
  assert.match(JSON.parse(context.stdout).template, /## Registre/);
  const create = cli(root, 'create', ...common, '--title', o.title, '--description', o.description); assert.equal(create.status, 0, create.stderr);
  assert.equal(JSON.parse(create.stdout).file, o.file); assert.equal(cli(root, 'check', '--file', o.file).status, 1);
  fs.writeFileSync(path.join(root, o.file), completa(read(root, o.file)));
  const check = cli(root, 'check', '--file', o.file); assert.equal(check.status, 0, check.stderr);
  assert.deepEqual(JSON.parse(check.stdout), { valid: true, errors: [] });
});
