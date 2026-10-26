import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture, validDoc, writeDoc } from './helpers/documental.mjs';
import { readTurn } from '../tooling/documental/turns.mjs';
import { checkDocuments } from '../tooling/gates/porta-documents.mjs';
import { sanejaTornsCaducats, esTornCaducat } from '../tooling/session/saneja_torns_caducats.mjs';
const ARA = Date.parse('2026-10-26T03:00:00Z');
function expired(t) {
  const root = fixture(t), d = validDoc(root); writeDoc(root, d);
  const file = path.join(root, '.agents/runtime/turns', `${d.turn.turn_id}.json`);
  const turn = JSON.parse(fs.readFileSync(file)); turn.expiresAt = '2026-10-25T00:00:00Z';
  fs.writeFileSync(file, JSON.stringify(turn));
  return { root, d, file, turn };
}
test('caducar no fabrica verificació ni fa passar un document sense tancament verificat', t => {
  const { root, d, file } = expired(t);
  assert.throws(() => readTurn(root, d.turn.turn_id, { now: ARA }), /caducat/);
  const r = sanejaTornsCaducats(root, { ara: ARA });
  assert.equal(r.valid, true); assert.equal(r.tancatsAra, 1);
  const after = JSON.parse(fs.readFileSync(file));
  assert.equal(after.state, 'closed'); assert.equal(after.verification, null); assert.equal(after.plan, null);
  assert.equal(after.closure.reason, 'expired'); assert.equal(after.history.at(-1).action, 'expire-close');
  execFileSync('git', ['init', '-q'], { cwd: root }); execFileSync('git', ['add', '.'], { cwd: root });
  const gate = checkDocuments(root, { staged: true });
  assert.equal(gate.valid, false); assert.match(gate.errors.join(), /rebut del torn tancat/);
  assert.equal(sanejaTornsCaducats(root, { ara: ARA }).tancatsAra, 0);
});
test('caducar conserva la verificació anterior sense recalcular fitxers', t => {
  const { root, file, turn } = expired(t);
  turn.verification = { at: '2026-10-24T00:00:00Z', files: { 'absent.md': 'a'.repeat(64) }, checks: ['porta real'] };
  fs.writeFileSync(file, JSON.stringify(turn));
  sanejaTornsCaducats(root, { ara: ARA });
  assert.deepEqual(JSON.parse(fs.readFileSync(file)).verification, turn.verification);
});
test('mode sec conserva tots els bytes i no crea locks', t => {
  const { root, file } = expired(t), before = fs.readFileSync(file);
  assert.equal(sanejaTornsCaducats(root, { ara: ARA, sec: true }).tancatsAra, 1);
  assert.deepEqual(fs.readFileSync(file), before); assert.equal(fs.existsSync(`${file}.lock`), false);
});
test('locks ocupats i registres corruptes es compten sense escriptura', t => {
  const { root, file, turn } = expired(t), before = fs.readFileSync(file);
  fs.writeFileSync(`${file}.lock`, 'ocupat');
  assert.equal(sanejaTornsCaducats(root, { ara: ARA }).omesosLock, 1);
  assert.deepEqual(fs.readFileSync(file), before); fs.unlinkSync(`${file}.lock`);
  turn.schema = 'not-a-turn'; fs.writeFileSync(file, JSON.stringify(turn));
  let result = sanejaTornsCaducats(root, { ara: ARA });
  assert.equal(result.valid, false); assert.equal(result.errors.length, 1); assert.equal(result.tancatsAra, 0);
  fs.writeFileSync(file, '{'); result = sanejaTornsCaducats(root, { ara: ARA });
  assert.equal(result.valid, false); assert.equal(result.errors.length, 1);
});
test('la lectura està sota lock i CAS preserva una mutació aliena', t => {
  const { root, file } = expired(t), read = fs.readFileSync;
  let reads = 0, locked = false;
  const realFile = fs.realpathSync(file);
  fs.readFileSync = function (target, ...args) {
    if (target === realFile && ++reads === 2) {
      assert.throws(() => fs.openSync(`${file}.lock`, 'wx'), /EEXIST/); locked = true;
      const other = JSON.parse(read.call(fs, file, 'utf8')); other.concurrentMarker = 'conservat';
      fs.writeFileSync(file, JSON.stringify(other));
    }
    return read.call(fs, target, ...args);
  };
  let result;
  try { result = sanejaTornsCaducats(root, { ara: ARA }); } finally { fs.readFileSync = read; }
  assert.equal(locked, true); assert.equal(result.valid, false); assert.match(result.errors[0].error, /CAS divergent/);
  const after = JSON.parse(fs.readFileSync(file));
  assert.equal(after.concurrentMarker, 'conservat'); assert.notEqual(after.state, 'closed'); assert.equal(fs.existsSync(`${file}.lock`), false);
});
test('symlinks i hardlinks no es muten', t => {
  const { root, file } = expired(t), copy = `${file}.copy`;
  fs.renameSync(file, copy); fs.symlinkSync(copy, file);
  assert.equal(sanejaTornsCaducats(root, { ara: ARA }).valid, false);
  fs.unlinkSync(file); fs.linkSync(copy, file);
  assert.equal(sanejaTornsCaducats(root, { ara: ARA }).valid, false);
  assert.notEqual(JSON.parse(fs.readFileSync(copy)).state, 'closed');
});

test('caducitat il·legible és corrupció: ni expired true ni el sanejador la convertixen en baixa', t => {
  const { root, d, file, turn } = expired(t);
  turn.expiresAt = '???'; fs.writeFileSync(file, JSON.stringify(turn));
  const before = fs.readFileSync(file);
  assert.equal(esTornCaducat(turn, ARA), false);
  assert.throws(() => readTurn(root, d.turn.turn_id, { expired: true, now: ARA }), /Caducitat de torn invàlida/);
  const result = sanejaTornsCaducats(root, { ara: ARA });
  assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0);
  assert.match(result.errors[0].error, /Caducitat de torn invàlida/);
  assert.deepEqual(fs.readFileSync(file), before);
});
