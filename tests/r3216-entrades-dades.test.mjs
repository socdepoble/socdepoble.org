import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { calculaDades, main } from '../tooling/domain/calcula-dades.mjs';
import { creaTransportCrdtRuralRemot } from '../src/data/sessioRural.js';

test('el barrel de la sessió exposa el transport opt-in sense fer xarxa', () => {
  const t = creaTransportCrdtRuralRemot({ autoritat: 'https://socdepoble.org' });
  assert.equal(t.tipus, 'remot');
  assert.equal(t.autoritat, 'https://socdepoble.org');
  assert.equal(typeof t.envia, 'function');
  assert.throws(() => creaTransportCrdtRuralRemot({ autoritat: 'http://socdepoble.org' }));
});

test('CLI calcula disponibilitat real i export comptable exacte', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3216-cli-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'entrada.json');
  fs.writeFileSync(file, JSON.stringify({ intervals: [{ id: 'a', inici: 1, fi: 4 }, { id: 'b', inici: 3, fi: 5 }] }));
  let output = '';
  assert.equal(main(['disponibilitat', file], { stdout: { write: s => { output += s; } } }), 0);
  assert.equal(JSON.parse(output).disponible, false);
  const exportat = calculaDades('gestoria', { any: 2026, operacions: [{ id: 'a', data: '2026-01-01', tipus: 'ingres', baseCentims: '10', ivaCentims: '2', retencioCentims: '0' }] });
  assert.equal(exportat.resum.total.ingressos.totalCentims, '12');
  assert.equal(exportat.resum.verifactu, false);
  assert.throws(() => calculaDades('exec', {}));
  fs.symlinkSync(file, path.join(dir, 'link'));
  assert.throws(() => main(['disponibilitat', path.join(dir, 'link')]));
});

test('L08 arrela CLI npm executables, i continua bloquejant un fitxer solt', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3216-l08-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const d of ['src/data/importacioEditorial', 'tooling/importacio', '.agents/deute']) fs.mkdirSync(path.join(dir, d), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents/deute/.pedra-seca-deute.json'), '{}');
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ scripts: { 'importacio:editorial': 'node tooling/importacio/importa.mjs' } }));
  fs.writeFileSync(path.join(dir, 'tooling/importacio/importa.mjs'), "import { parseja } from '../../src/data/importacioEditorial/index.js'; export const main = parseja;\n");
  fs.writeFileSync(path.join(dir, 'src/data/importacioEditorial/index.js'), 'export const parseja = x => x;');
  fs.writeFileSync(path.join(dir, 'src/data/solt.js'), 'export const solt = true;');
  const gate = path.resolve('tooling/brain/tractor-pedra-seca.mjs');
  const r = spawnSync(process.execPath, [gate, '--detall'], { cwd: dir, encoding: 'utf8', timeout: 15000 });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /src\/data\/solt.js/);
  assert.doesNotMatch(r.stdout, /\+ src\/data\/importacioEditorial/);
});
