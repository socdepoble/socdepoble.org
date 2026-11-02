import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { motiuContaminacio, comprovaHigienePaquet } from '../tooling/lib/higiene-paquets.mjs';
import { inspeccionaHigienePaquets, SUPERFICIES } from '../tooling/gates/tractor-higiene-paquets.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-higiene-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  for (const nom of ['socdepoble-enxufe.php', 'uninstall.php', 'readme.txt', 'includes', 'templates', 'languages']) {
    fs.mkdirSync(path.join(arrel, 'wordpress-plugin'), { recursive: true });
    fs.cpSync(path.join(REPO, 'wordpress-plugin', nom), path.join(arrel, 'wordpress-plugin', nom), { recursive: true });
  }
  fs.mkdirSync(path.join(arrel, 'public'));
  return arrel;
}
function posa(arrel, cami, text = 'fixture') {
  fs.mkdirSync(path.dirname(path.join(arrel, cami)), { recursive: true });
  fs.writeFileSync(path.join(arrel, cami), text);
}

test('la vitrina queda fora dels paquets WordPress, sense prohibir fotos del poble', () => {
  for (const cami of ['assets/banner-1544x500.png', 'assets/banner-772x250.png', 'assets/screenshot-1.png', 'assets/icon-256x256.png', 'assets/icon.svg']) {
    assert.match(motiuContaminacio(cami, { wordpress: true }), /vitrina/);
    assert.equal(motiuContaminacio(cami), null);
  }
  for (const cami of ['assets/uploads/screenshot-1.png', 'assets/towns/banner-del-poble.jpg', 'assets/ui/icon.svg']) assert.equal(motiuContaminacio(cami, { wordpress: true }), null);
});

test('bloqueja dades de desenvolupament i conserva dades publiques legítimes', () => {
  for (const cami of ['a/.env.local', '.git/config', '.svn/wc.db', 'a/.DS_Store', '__MACOSX/x', 'a.test.js', 'a.spec.jsx', 'a.js.map', 'dump.sql', 'server.log', 'a.bak', 'a.orig', 'a.rej', '__tests__/a.js', 'fixtures/cas.json', 'node_modules/x.js']) {
    assert.ok(motiuContaminacio(cami), cami);
    assert.throws(() => comprovaHigienePaquet([cami]), /IDEA-62/, cami);
  }
  assert.doesNotThrow(() => comprovaHigienePaquet(['.well-known/nodeinfo', 'data/okf/index.md', 'rag-index.json', 'assets/ui/testimoni.webp', 'fonts/OFL.txt', 'soc-de-poble.standalone.js']));
});

test('examina totes les projeccions, detecta intrusions i no muta ni obri un secret', t => {
  const arrel = fixture(t);
  for (const carpeta of SUPERFICIES) posa(arrel, `${carpeta}/ok.js`);
  const bo = inspeccionaHigienePaquets(arrel);
  assert.equal(bo.valid, true);
  assert.equal(bo.examinades.length, SUPERFICIES.length);
  for (const carpeta of SUPERFICIES) posa(arrel, `${carpeta}/quasi.test.js`);
  posa(arrel, 'public/.env.local', 'no-lligues-el-contingut');
  fs.chmodSync(path.join(arrel, 'public/.env.local'), 0);
  const abans = fs.readdirSync(path.join(arrel, 'public')).sort();
  const roig = inspeccionaHigienePaquets(arrel);
  assert.equal(roig.valid, false);
  assert.equal(roig.incidencies.length, SUPERFICIES.length + 1);
  assert.deepEqual(fs.readdirSync(path.join(arrel, 'public')).sort(), abans);
  assert.ok(!JSON.stringify(roig).includes('no-lligues-el-contingut'));
});

test('no seguix enllaços simbòlics interns ni en avantpassats de la projecció', t => {
  const arrel = fixture(t);
  const exterior = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-fora-paquet-'));
  t.after(() => fs.rmSync(exterior, { recursive: true, force: true }));
  posa(exterior, 'App/public/intacte.js', 'intacte');
  fs.symlinkSync(exterior, path.join(arrel, 'ios'));
  fs.symlinkSync(exterior, path.join(arrel, 'public', 'fora'));
  const r = inspeccionaHigienePaquets(arrel);
  assert.equal(r.valid, false);
  assert.equal(r.incidencies.length, 2);
  assert.ok(r.incidencies.every(i => /enllaç simbòlic/.test(i.motiu)));
  assert.equal(fs.readFileSync(path.join(exterior, 'App/public/intacte.js'), 'utf8'), 'intacte');
});

test('informa projeccions absents i no certifica una font public absent', t => {
  const arrel = fixture(t);
  const r = inspeccionaHigienePaquets(arrel);
  assert.equal(r.valid, true);
  assert.equal(r.absents.length, SUPERFICIES.length - 1);
  fs.rmdirSync(path.join(arrel, 'public'));
  assert.ok(inspeccionaHigienePaquets(arrel).incidencies.some(i => i.cami === 'public'));
});

test('la porta forma part de run-portes i és declarada només lectura', async () => {
  const { passos } = await import('../tooling/gates/run-portes.mjs');
  assert.ok(passos.some(p => p.args.includes('tooling/gates/tractor-higiene-paquets.mjs') && p.readOnly === true));
});

test('la CLI arranca amb el custodi i distingix arbre net de contaminació', t => {
  const arrel = fixture(t);
  posa(arrel, '.agents/AGENTS.md', '# Fixture');
  const crida = () => spawnSync(process.execPath, [path.join(REPO, 'tooling/gates/tractor-higiene-paquets.mjs'), `--arrel=${arrel}`], { encoding: 'utf8' });
  const bo = crida();
  assert.equal(bo.status, 0, bo.stderr);
  assert.equal(JSON.parse(bo.stdout).valid, true);
  posa(arrel, 'public/quasi.spec.js');
  const roig = crida();
  assert.equal(roig.status, 1, roig.stderr);
  assert.equal(JSON.parse(roig.stdout).valid, false);
});
