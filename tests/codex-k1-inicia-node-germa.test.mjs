/* K1 suplementari (kit Codex 261101, auditat per Claude): fronteres d'enllaços simbòlics i
   claus extra de l'instal·lador, amb fixtures temporals; cap npm ci/build ni xarxa.
   La prova de la CLI sobre la release sencera viu a tests/inicia-node-germa.test.mjs, que
   pren la font de git archive i no de l'arbre de treball compartit. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iniciaNodeGerma } from '../tooling/instalador/inicia-node-germa.mjs';

const config = { slug: 'sella', nom: 'Sella', origen: 'https://sella.example', mode: 'seed' };
function temporary(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-codex-k1-instalador-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return fs.realpathSync(dir);
}
function fixture(t) {
  const dir = temporary(t), font = path.join(dir, 'font');
  fs.mkdirSync(font);
  for (const name of ['src', 'public', 'tooling', 'scripts']) {
    fs.mkdirSync(path.join(font, name));
    fs.writeFileSync(path.join(font, name, 'prova.txt'), 'font de prova');
  }
  fs.writeFileSync(path.join(font, 'package.json'), '{"version":"1.0.0"}');
  fs.writeFileSync(path.join(font, 'package-lock.json'), '{"lockfileVersion":3,"packages":{"":{"version":"1.0.0"}}}');
  return { dir, font, desti: path.join(dir, 'node') };
}

test('K1 instal·lador: un fitxer arrel simbòlic es rebutja abans de crear el destí', t => {
  const f = fixture(t), external = path.join(f.dir, 'extern.html');
  fs.writeFileSync(external, 'fora de la release');
  fs.symlinkSync(external, path.join(f.font, 'index.html'));
  assert.throws(() => iniciaNodeGerma({ ...f, config }), /regular|simbòlic|enllaç/i);
  assert.equal(fs.existsSync(f.desti), false);
  assert.equal(fs.readFileSync(external, 'utf8'), 'fora de la release');
});

test('K1 instal·lador: un parent simbòlic no es travessa encara que el destí final no existisca', t => {
  const f = fixture(t), link = path.join(f.dir, 'pare-enllac');
  fs.symlinkSync(f.dir, link);
  assert.throws(() => iniciaNodeGerma({ ...f, desti: path.join(link, 'node-nou'), config }), /enllaç/i);
  assert.equal(fs.existsSync(path.join(f.dir, 'node-nou')), false);
});

test('K1 instal·lador: claus extra no es propaguen al manifest ni llancen processos', t => {
  const f = fixture(t), marker = 'secret-fixture-no-real';
  const manifest = iniciaNodeGerma({ ...f, config: { ...config, secret: marker, service_role: marker } });
  assert.deepEqual(manifest.config, config);
  assert.ok(!JSON.stringify(manifest).includes(marker));
  assert.ok(!fs.readFileSync(path.join(f.desti, '.env.local'), 'utf8').includes(marker));
  let calls = 0;
  assert.throws(() => iniciaNodeGerma({ ...f, desti: path.join(f.dir, 'rebutjat'),
    config: { ...config, slug: '../fora' }, build: true, run: () => { calls++; return { status: 0 }; } }));
  assert.equal(calls, 0);
  assert.equal(fs.existsSync(path.join(f.dir, 'rebutjat')), false);
});
