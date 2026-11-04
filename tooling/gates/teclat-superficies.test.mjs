import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executaPortaTeclat, triaSuperficies } from './teclat-superficies.mjs';

test('la CLI --list entra a la porta i declara superfícies i límits sense executar Vitest', () => {
  const resultat = spawnSync(process.execPath, ['tooling/gates/teclat-superficies.mjs', '--list'], { encoding: 'utf8' });
  assert.equal(resultat.status, 0, resultat.stderr);
  assert.match(resultat.stdout, /workspace:.*375 i 800/);
  assert.match(resultat.stdout, /graf:.*Pan/);
  assert.match(resultat.stdout, /No acredita tots els processos/);
  assert.doesNotMatch(resultat.stdout, /PASSA:/);
});

test('superfície desconeguda o runner absent fallen abans d’invocar cap procés', () => {
  const executar = () => assert.fail('No ha d’executar cap procés.');
  for (const args of [['--superficie='], ['--superficie=graf,inventat'], ['--list', '--superficie=graf']]) {
    assert.throws(() => executaPortaTeclat({ args, executar }), /desconeguda|Ús/);
  }
  assert.throws(() => executaPortaTeclat({ args: ['--superficie=graf'], arrel: '/__sdp_contracte_inexistent__', executar }), /Falta un fitxer/);
});

test('la porta transmet les suites seleccionades i mai convertix error o senyal del runner en èxit', () => {
  const args = ['--superficie=graf,pestanyes'];
  let crida;
  const executar = (...dades) => { crida = dades; return { status: 0 }; };
  assert.equal(executaPortaTeclat({ args, executar, escriu: () => {} }), 0);
  const proves = triaSuperficies(args).flatMap(s => s.proves);
  assert.deepEqual(crida[1].slice(-proves.length), proves);
  assert.ok(crida[1].includes('--passWithNoTests=false'));
  for (const resultat of [{ status: 1 }, { status: null, signal: 'SIGTERM' }, {}]) {
    assert.throws(() => executaPortaTeclat({ args, executar: () => resultat, escriu: () => {} }), /fallit/);
  }
});


test('identitats exigix la prova real de teclat, l’executa i falla si falta encara que la suite de clics existisca', t => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-teclat-identitats-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const args = ['--superficie=identitats'];
  const proves = triaSuperficies(args)[0].proves;
  const teclat = 'src/components/universal/identitat/CalaixIdentitats.teclat.test.jsx';
  assert.deepEqual(proves, ['src/components/universal/identitat/CalaixIdentitats.test.jsx', teclat]);
  for (const fitxer of [...proves, 'node_modules/vitest/vitest.mjs']) {
    fs.mkdirSync(path.dirname(path.join(arrel, fitxer)), { recursive: true });
    fs.writeFileSync(path.join(arrel, fitxer), '');
  }
  let crides = 0;
  const executar = (_cmd, argv, opcions) => {
    crides++;
    assert.deepEqual(argv.slice(-proves.length), proves);
    assert.equal(opcions.cwd, arrel);
    assert.ok(argv.includes('--passWithNoTests=false'));
    return { status: 0 };
  };
  assert.equal(executaPortaTeclat({ args, arrel, executar, escriu: () => {} }), 0);
  assert.equal(crides, 1);
  fs.unlinkSync(path.join(arrel, teclat));
  assert.throws(() => executaPortaTeclat({ args, arrel, executar, escriu: () => {} }), /Falta un fitxer.*CalaixIdentitats.teclat/);
  assert.equal(crides, 1, 'el contracte trencat es rebutja abans del procés');
});
