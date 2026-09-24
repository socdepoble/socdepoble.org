import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, REPO } from './helpers/documental.mjs';
import { openTurn, deliverContext } from '../tooling/documental/turns.mjs';
import { createDraft } from '../tooling/wiki/document.mjs';
import { checkLocal } from '../tooling/gates/hooks-local.mjs';
import { SOURCES } from '../tooling/brain/context-local.mjs';
import { CAMINS } from '../tooling/lib/arrel.mjs';
const relativeFile = `${CAMINS.escriptori}/260924_0900_auditoria_race.md`;
function setup(t) {
  const root = fs.realpathSync(fixture(t));
  for (const rel of [...SOURCES, 'tooling/wiki/document.mjs', 'tooling/gates/obrir_torn.mjs']) {
    const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.copyFileSync(path.join(REPO, rel), file);
  }
  const turn = openTurn(root, { scope: 'documents' });
  const opts = { route: 'auditoria', file: relativeFile, title: 'Prova', description: 'Prova sintètica de carrera documental' };
  deliverContext(root, turn.turn_id, opts);
  const command = `node tooling/wiki/document.mjs create --turn-id ${turn.turn_id} --route auditoria --file ${relativeFile} --title Prova --description "Prova sintètica de carrera documental"`;
  assert.equal(checkLocal({ tool_name: 'Bash', cwd: root, tool_input: { command } }, root).code, 0, 'el hook inicial permet el circuit vàlid');
  const ledger = path.join(root, CAMINS.ledger), index = path.join(root, CAMINS.indexEscriptori), file = path.join(root, relativeFile);
  return { root, ledger, index, file, before: fs.readFileSync(ledger), create: () => createDraft(root, turn.turn_id, opts) };
}
function afterDraftWrite(file, swap, operation) {
  const originalOpen = fs.openSync, originalWrite = fs.writeFileSync;
  let descriptor, swapped = false;
  fs.openSync = (...args) => { const fd = originalOpen(...args); if (args[0] === file) descriptor = fd; return fd; };
  fs.writeFileSync = (...args) => {
    const result = originalWrite(...args);
    if (args[0] === descriptor && !swapped) { swapped = true; swap(); }
    return result;
  };
  try { operation(); assert.equal(swapped, true, 'la cursa s’ha exercitat'); }
  finally { fs.openSync = originalOpen; fs.writeFileSync = originalWrite; }
}
test('create normal escriu i ancora, però mai sobreescriu un draft existent', t => {
  const s = setup(t); s.create();
  assert.match(fs.readFileSync(s.index, 'utf8'), /\[\[260924_0900_auditoria_race\]\]/);
  assert.throws(s.create, /EEXIST/);
  assert.deepEqual(fs.readFileSync(s.ledger), s.before);
});
for (const kind of ['symlink', 'hardlink']) test(`hook → índex ${kind} a LEDGER → create rebutjat`, t => {
  const s = setup(t); fs.unlinkSync(s.index);
  if (kind === 'symlink') fs.symlinkSync(s.ledger, s.index); else fs.linkSync(s.ledger, s.index);
  assert.throws(s.create);
  assert.deepEqual(fs.readFileSync(s.ledger), s.before);
  assert.equal(fs.existsSync(s.file), false);
});
for (const kind of ['symlink', 'hardlink']) test(`hook → destí ${kind} a LEDGER → create no sobreescriu`, t => {
  const s = setup(t);
  if (kind === 'symlink') fs.symlinkSync(s.ledger, s.file); else fs.linkSync(s.ledger, s.file);
  assert.throws(s.create, /EEXIST/);
  assert.deepEqual(fs.readFileSync(s.ledger), s.before);
});
test('hook → ancestre substituït per symlink → create rebutjat', t => {
  const s = setup(t), desk = path.dirname(s.index), renamed = `${desk}-original`;
  fs.renameSync(desk, renamed); fs.symlinkSync(path.join(s.root, CAMINS.agents), desk);
  assert.throws(s.create);
  assert.deepEqual(fs.readFileSync(s.ledger), s.before);
});
test('índex substituït després d’obrir-lo no modifica LEDGER i retira només el draft propi', t => {
  const s = setup(t);
  afterDraftWrite(s.file, () => { fs.unlinkSync(s.index); fs.symlinkSync(s.ledger, s.index); }, () => assert.throws(s.create));
  assert.deepEqual(fs.readFileSync(s.ledger), s.before);
  assert.equal(fs.existsSync(s.file), false);
});
test('edició concurrent de l’índex es preserva i no es perd amb la nova àncora', t => {
  const s = setup(t);
  afterDraftWrite(s.file, () => fs.appendFileSync(s.index, '\nEdició concurrent\n'), () => assert.throws(s.create));
  assert.match(fs.readFileSync(s.index, 'utf8'), /Edició concurrent/);
  assert.doesNotMatch(fs.readFileSync(s.index, 'utf8'), /260924_0900_auditoria_race/);
  assert.equal(fs.existsSync(s.file), false);
});
test('rollback no elimina un destí que ha estat substituït per un hardlink alié', t => {
  const s = setup(t);
  afterDraftWrite(s.file, () => { fs.unlinkSync(s.file); fs.linkSync(s.ledger, s.file); }, () => assert.throws(s.create));
  assert.deepEqual(fs.readFileSync(s.ledger), s.before);
  assert.equal(fs.lstatSync(s.file).ino, fs.lstatSync(s.ledger).ino);
  assert.doesNotMatch(fs.readFileSync(s.index, 'utf8'), /260924_0900_auditoria_race/);
});
