import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { verificaFitxerUnanimitat, executaVerificadorUnanimitat } from '../tooling/gates/verifica-alergens-unanimitat.mjs';
import { CORPUS_FIXTURE, registreFixture, jsonlFixture } from './fixtures/alergens-unanimitat.mjs';
const arrel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = process.env.TMPDIR ? path.resolve(process.env.TMPDIR, 'alergens-cli') : path.join(arrel, '.r3258/tmp/lot01');
fs.mkdirSync(tmp, { recursive: true });
const dir = fs.mkdtempSync(path.join(tmp, 'cli-'));
function fitxer(nom, text) { const p = path.join(dir, nom); fs.writeFileSync(p, text); return p; }
const complet = fitxer('validat.jsonl', jsonlFixture(...CORPUS_FIXTURE.map(([, corpus, uid]) => registreFixture({ corpus, uid }))));
const pendent = fitxer('pendent.jsonl', jsonlFixture(registreFixture({ estatConsens: 'PRECAUCIO_MAXIMA_REVISIO_MESTRE', rondesUsades: 3, discrepantsFinals: ['falten_escoles'], votsPerEscola: {} })));
const buit = fitxer('buit.jsonl', '');
const invalid = fitxer('invalid.jsonl', '{"uid":');
function cli(...args) {
  const child = spawnSync(process.execPath, [path.join(arrel, 'tooling/gates/verifica-alergens-unanimitat.mjs'), ...args], { cwd: dir, encoding: 'utf8', timeout: 5000, env: { PATH: process.env.PATH, TMPDIR: tmp } });
  assert.ifError(child.error); assert.equal(child.stderr, ''); return { status: child.status, raw: child.stdout, resultat: JSON.parse(child.stdout) };
}
test('no input and explicit absent path warn without claiming study completion', () => {
  for (const args of [[], ['--file', path.join(dir, 'missing.jsonl')]]) { const c = cli(...args); assert.equal(c.status, 0); assert.equal(c.resultat.estat, 'absent'); assert.equal(c.resultat.coberturaEstudi, 'no_acreditada'); assert.equal(c.resultat.certificacioExperta, false); assert.ok(c.resultat.avisos.some(a => a.includes('desconeguts'))); }
});
test('strict mode fails missing and pending, succeeds structurally valid supplied rows', () => {
  assert.equal(cli('--strict').status, 1);
  for (const p of [pendent, buit]) { assert.equal(cli('--file', p).resultat.estat, 'pendent'); assert.equal(cli('--file', p).status, 0); assert.equal(cli('--file', p, '--strict').status, 1); }
  const ok = cli('--file', complet, '--strict'); assert.equal(ok.status, 0); assert.equal(ok.resultat.estat, 'validat'); assert.equal(ok.resultat.registres, 6); assert.ok(Object.values(ok.resultat.corpus).every(n => n === 1));
});
test('malformed checkpoint fails independently of strict and never emits untrusted text', () => {
  for (const args of [[], ['--strict']]) { const c = cli('--file', invalid, ...args); assert.equal(c.status, 1); assert.equal(c.resultat.estat, 'malformat'); assert.equal(c.resultat.registres, 0); assert.ok(!c.raw.includes(invalid)); }
});
test('invalid UTF8, BOM, directories, symlinks and oversized files fail read-only', () => {
  const utf8 = fitxer('utf8.jsonl', Buffer.from([0xff, 0xfe]));
  const bom = fitxer('bom.jsonl', '\ufeff' + jsonlFixture(registreFixture()));
  const gros = fitxer('gros.jsonl', Buffer.alloc(8 * 1024 * 1024 + 1));
  const link = path.join(dir, 'link.jsonl'); fs.symlinkSync(complet, link);
  for (const p of [utf8, bom, gros, link, dir]) { const c = cli('--file', p); assert.equal(c.status, 1); assert.equal(c.resultat.estat, 'malformat'); }
});
test('byte SHA256 and output are deterministic; reading never changes file bytes or directory inventory', () => {
  const before = fs.readFileSync(complet), inventory = fs.readdirSync(dir).sort(); const a = cli('--file', complet, '--json'), b = cli('--file', complet, '--json');
  assert.equal(a.raw, b.raw); assert.equal(a.resultat.sha256, createHash('sha256').update(before).digest('hex')); assert.equal(a.resultat.bytes, before.length);
  assert.deepEqual(fs.readFileSync(complet), before); assert.deepEqual(fs.readdirSync(dir).sort(), inventory);
});
test('CLI arguments are bounded exact options and never evaluated as commands or code', () => {
  for (const args of [['--file'], ['--unknown'], ['--file', complet, '--file', complet], ['--file', '--strict'], ['--file', 'https://invalid.example/test.jsonl']]) {
    const c = cli(...args); assert.ok(c.status === 2 || c.resultat.estat === 'absent'); assert.ok(!c.raw.includes('https://'));
  }
  let output = ''; assert.equal(executaVerificadorUnanimitat(['--help'], s => output += s), 0); assert.ok(output.includes('només lectura'));
});
test('importing the CLI exports has no execution, filesystem discovery or network side effects', () => {
  assert.equal(typeof verificaFitxerUnanimitat, 'function'); assert.equal(typeof executaVerificadorUnanimitat, 'function');
  const source = fs.readFileSync(path.join(arrel, 'tooling/gates/verifica-alergens-unanimitat.mjs'), 'utf8');
  assert.ok(!source.includes('motor_unanimitat_8escoles_alergens')); assert.ok(!source.includes('fetch(')); assert.ok(!source.includes('node:http')); assert.ok(!source.includes('child_process'));
});
