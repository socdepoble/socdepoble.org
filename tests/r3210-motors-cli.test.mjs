import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
function entrada(t, valor) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3210-cli-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fitxer = path.join(dir, 'entrada.json');
  fs.writeFileSync(fitxer, JSON.stringify(valor));
  return { dir, fitxer, abans: fs.readFileSync(fitxer) };
}
function cli(script, args) {
  return spawnSync(process.execPath, [path.join(ROOT, script), ...args], { encoding: 'utf8', timeout: 10_000 });
}
const operacio = {
  id: 'manual-1', data: { a: 2026, m: 11, d: 18 }, tipus: 'ingres', tractament: 'interior', origen: 'manual',
  base: '9007199254740993', iva: '1891511843495608', retencio: '0', deduibleIva: false, deduibleIrpf: false
};

test('CLI resum anual: exporta JSON i CSV en cèntims exactes i només per stdout', (t) => {
  const e = entrada(t, { any: 2026, operacions: [operacio] });
  const json = cli('tooling/gestoria/resum-anual.mjs', [e.fitxer]);
  assert.equal(json.status, 0, json.stderr);
  const resum = JSON.parse(json.stdout);
  assert.equal(resum.anual.totals.ingressos, '9007199254740993');
  assert.equal(resum.anual.totals.ivaRepercutit, '1891511843495608');
  assert.equal(resum.trimestres[3].operacions, 1);
  assert.match(resum.avis, /No Verifactu/);
  const csv = cli('tooling/gestoria/resum-anual.mjs', [e.fitxer, '--csv']);
  assert.equal(csv.status, 0, csv.stderr);
  assert.match(csv.stdout, /9007199254740993/);
  assert.match(csv.stdout, /ANUAL/);
  assert.deepEqual(fs.readFileSync(e.fitxer), e.abans);
  assert.deepEqual(fs.readdirSync(e.dir), ['entrada.json']);
});

test('CLI resum anual: entrada incompleta, decimal imprecís o bandera aliena fallen sense export parcial', (t) => {
  for (const valor of [{ any: 2026 }, { any: 2026, operacions: [{ ...operacio, base: 9007199254740992 }] }]) {
    const e = entrada(t, valor);
    const r = cli('tooling/gestoria/resum-anual.mjs', [e.fitxer]);
    assert.equal(r.status, 1); assert.equal(r.stdout, ''); assert.ok(r.stderr);
    assert.deepEqual(fs.readFileSync(e.fitxer), e.abans);
  }
  const e = entrada(t, { any: 2026, operacions: [operacio] });
  const r = cli('tooling/gestoria/resum-anual.mjs', [e.fitxer, '--escriu']);
  assert.equal(r.status, 1); assert.equal(r.stdout, '');
});

test('CLI mapa 301: valida el mapa real i rebutja un destí que encadena als dominis històrics sense escriure ni fer xarxa', (t) => {
  const valor = {
    redireccions: [{ source: 'https://socdepoble.net/vell', destination: '/nou', status: 301 }],
    destinsDisponibles: ['/nou'], origensEsperats: ['https://socdepoble.net/vell']
  };
  const e = entrada(t, valor);
  const bo = cli('tooling/seo/verifica-mapa-301.mjs', [e.fitxer]);
  assert.equal(bo.status, 0, bo.stderr); assert.equal(JSON.parse(bo.stdout).valid, true);
  assert.deepEqual(fs.readFileSync(e.fitxer), e.abans);
  const cicle = entrada(t, { ...valor, redireccions: [...valor.redireccions, { source: 'https://elrentonar.blogspot.com/nou', destination: 'https://socdepoble.net/vell', status: 301 }] });
  const roig = cli('tooling/seo/verifica-mapa-301.mjs', [cicle.fitxer]);
  assert.equal(roig.status, 1); assert.equal(JSON.parse(roig.stdout).valid, false);
  assert.deepEqual(fs.readdirSync(e.dir), ['entrada.json']);
});
