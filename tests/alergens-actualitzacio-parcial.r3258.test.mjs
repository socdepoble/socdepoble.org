import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { registreFixture, jsonlFixture } from './fixtures/alergens-unanimitat.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(root, '.r3258/tmp/lot01');
fs.mkdirSync(tmp, { recursive: true });
const dir = fs.mkdtempSync(path.join(tmp, 'partial-cli-'));
after(() => fs.rmSync(dir, { recursive: true, force: true }));
const ready = registreFixture({ uid: 'quedinem:allioli', corpus: '1_receptes_que_dinem' });
const pending = registreFixture({ uid: 'quedinem:pa-rustic', corpus: '1_receptes_que_dinem', estatConsens: 'PRECAUCIO_MAXIMA_REVISIO_MESTRE', rondesUsades: 3, discrepantsFinals: ['aptitud'] });
function file(name, value) { const p = path.join(dir, name); fs.writeFileSync(p, value); return p; }
const mixed = file('mixed.jsonl', jsonlFixture(ready, pending));
function cli(...args) {
  const child = spawnSync(process.execPath, [path.join(root, 'tooling/gates/verifica-alergens-unanimitat.mjs'), ...args], { cwd: dir, encoding: 'utf8', timeout: 5000, env: { PATH: process.env.PATH, TMPDIR: tmp } });
  assert.ifError(child.error); assert.equal(child.stderr, '');
  return { status: child.status, output: JSON.parse(child.stdout), raw: child.stdout };
}
test('partial opt-in validates the entire checkpoint and emits one consolidated row, pending IDs and six corpus coverage', () => {
  const result = cli('--file', mixed, '--partial');
  assert.equal(result.status, 0); assert.equal(result.output.format, 'socdepoble.alergens.parcial.v1');
  assert.equal(result.output.coberturaGlobal, 'parcial'); assert.equal(result.output.certificacioExperta, false);
  assert.equal(result.output.font.sha256, createHash('sha256').update(fs.readFileSync(mixed)).digest('hex'));
  assert.equal(result.output.consolidats.length, 1); assert.equal(result.output.pendents.length, 1);
  assert.equal(Object.keys(result.output.corpus).length, 6);
  assert.equal(result.output.corpus.quedinem.consolidats, 1); assert.equal(result.output.corpus.quedinem.pendents, 1);
  for (const name of ['bar', 'nevera-ing', 'nevera-rec', 'llavors', 'herbari']) assert.equal(result.output.corpus[name].consolidats, 0);
  const rows = result.output.jsonl.split('\n').filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 1); assert.equal(rows[0].uid, ready.uid); assert.ok(!rows.some(r => r.uid === pending.uid));
});
test('ordinary and strict C3 semantics remain unchanged for a mixed checkpoint', () => {
  const ordinary = cli('--file', mixed), strict = cli('--file', mixed, '--strict');
  assert.equal(ordinary.status, 0); assert.equal(strict.status, 1);
  assert.equal(ordinary.output.estat, 'pendent'); assert.equal(strict.output.estat, 'pendent');
  assert.equal(ordinary.output.registres, 2); assert.equal(ordinary.output.consolidats, 1);
  assert.equal(ordinary.output.coberturaEstudi, 'no_acreditada');
});
test('partial ingestion never discards a malformed last row, incomplete bytes, duplicate UID or conflicting votes', () => {
  const badVote = structuredClone(ready); badVote.votsPerEscola['phi4:14b'].alergens.ous = 'absent';
  const inputs = [jsonlFixture(ready) + '{"uid":\n', jsonlFixture(ready).trimEnd(), jsonlFixture(ready, ready), jsonlFixture(ready, badVote)];
  for (const [i, input] of inputs.entries()) {
    const result = cli('--file', file('bad-' + i + '.jsonl', input), '--partial');
    assert.equal(result.status, 1); assert.equal(result.output.estat, 'malformat'); assert.equal(result.output.jsonl, undefined);
  }
});
test('partial and strict are separate explicit modes; empty or missing input cannot produce an update', () => {
  assert.equal(cli('--file', mixed, '--partial', '--strict').status, 2);
  for (const args of [['--partial'], ['--file', file('empty.jsonl', ''), '--partial'], ['--file', file('only-pending.jsonl', jsonlFixture(pending)), '--partial']]) {
    const result = cli(...args); assert.equal(result.status, 1); assert.equal(result.output.jsonl, undefined);
  }
});
test('partial mode checks real catalogue identities, not merely a matching prefix', () => {
  const invented = registreFixture({ uid: 'quedinem:no-existeix-al-cataleg', corpus: '1_receptes_que_dinem' });
  const p = file('unknown-identity.jsonl', jsonlFixture(ready, invented));
  const result = cli('--file', p, '--partial');
  assert.equal(result.status, 1); assert.equal(result.output.estat, 'malformat'); assert.equal(result.output.jsonl, undefined);
  assert.ok(result.output.errors.some(e => e.codi === 'identitat_cataleg'));
});
test('partial mode is deterministic and read-only, including the observed checkpoint hash', () => {
  const bytes = fs.readFileSync(mixed), names = fs.readdirSync(dir).sort();
  const a = cli('--file', mixed, '--partial'), b = cli('--file', mixed, '--partial');
  assert.equal(a.status, 0); assert.equal(a.raw, b.raw);
  assert.deepEqual(fs.readFileSync(mixed), bytes); assert.deepEqual(fs.readdirSync(dir).sort(), names);
});
test('an expected checkpoint SHA rejects changed bytes and does not claim an update', () => {
  const expected = createHash('sha256').update(fs.readFileSync(mixed)).digest('hex');
  assert.equal(cli('--file', mixed, '--partial', '--sha256', expected).status, 0);
  const changed = file('changed.jsonl', jsonlFixture(ready));
  const result = cli('--file', changed, '--partial', '--sha256', expected);
  assert.equal(result.status, 1); assert.equal(result.output.jsonl, undefined);
  assert.deepEqual(result.output.errors, [{ linia: 0, codi: 'hash_checkpoint' }]);
});
